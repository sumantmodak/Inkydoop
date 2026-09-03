import { TableClient, odata } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "@/lib/env";
import {
  DailyPackSchema,
  type DailyPack,
  type GenerationPromptRecord,
  type ModerationStatus,
  type ModerationSummary,
  type PackSummary,
  type TierId,
} from "@/lib/schemas";

const PARTITION = "daily";
const TABLE_STRING_MAX_CODE_UNITS = 32 * 1024;
const MAX_PROMPT_RECORDS = 24;

function pad(n: number, len: number): string {
  return n.toString().padStart(len, "0");
}

// Unique, sortable pack id used as the RowKey. An ascending scan is
// newest-first: newest date first, and within a date the newest generation
// first. Multiple packs can coexist for the same date (§5.4).
function packRowKey(date: string, createdMs: number): string {
  const invDate = pad(99999999 - Number(date.replaceAll("-", "")), 8);
  const invMs = pad(9999999999999 - createdMs, 13);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${invDate}-${invMs}-${rand}`;
}

/** Mint a fresh unique id for a pack generated now. */
export function newPackId(date: string): string {
  return packRowKey(date, Date.now());
}

interface PackEntity {
  partitionKey: string;
  rowKey: string;
  date: string;
  tier: string;
  packJson: string;
  createdAt: string;
  title: string;
  genre: string;
  theme: string;
  coverBlobPath: string;
  readingTimeMin: number;
  generationSchemaVersion?: number;
  appVersion?: string;
  promptVersion?: string;
  storyModel?: string;
  learningModel?: string;
  imageModel?: string;
  totalTokens?: number;
  totalCostUsd?: number;
  textCostUsd?: number;
  imageCostUsd?: number;
  audioCostUsd?: number;
  totalWithAudioCostUsd?: number;
  audioEstimatedCostUsd?: number;
  estimatedTotalCostUsd?: number;
  durationMs?: number;
  storyRetries?: number;
  learningRetries?: number;
  imageSucceeded?: number;
  imageFailed?: number;
  audioModel?: string;
  audioVoice?: string;
  audioStatus?: string;
  audioBytes?: number;
  generationPromptCount?: number;
  moderationStatus?: string;
  moderatedAt?: string;
  moderationNote?: string;
}

type PromptColumns = Record<string, string | number>;

export interface StoredPack {
  id: string;
  date: string;
  pack: DailyPack;
}

export interface ModerationPack extends StoredPack {
  moderation: {
    status: ModerationStatus;
    createdAt: string;
    moderatedAt?: string;
    note?: string;
  };
}

let clientPromise: Promise<TableClient> | null = null;

function createClient(): TableClient {
  const conn = env.AZURE_STORAGE_CONNECTION_STRING;
  if (conn) {
    return TableClient.fromConnectionString(conn, env.AZURE_TABLE_NAME, {
      allowInsecureConnection: true,
    });
  }
  const account = env.AZURE_STORAGE_ACCOUNT;
  if (!account) throw new Error("No Azure Storage configuration");
  return new TableClient(
    `https://${account}.table.core.windows.net`,
    env.AZURE_TABLE_NAME,
    new DefaultAzureCredential(),
  );
}

async function getClient(): Promise<TableClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient();
      await client.createTable().catch(() => {
        // table already exists — ignore
      });
      return client;
    })();
    // Don't cache a failed init — allow the next call to retry.
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

function promptColumn(index: number, part: "Meta" | "System" | "User") {
  return `generationPrompt${String(index + 1).padStart(2, "0")}${part}`;
}

function assertTableStringFits(property: string, value: string): void {
  if (value.length > TABLE_STRING_MAX_CODE_UNITS) {
    throw new Error(
      `${property} is ${value.length.toLocaleString()} characters; Azure Table string properties allow at most ${TABLE_STRING_MAX_CODE_UNITS.toLocaleString()}`,
    );
  }
}

export function serializePackForTable(pack: DailyPack): {
  packJson: string;
  promptColumns: PromptColumns;
} {
  const prompts = pack.generation?.prompts ?? [];
  if (prompts.length > MAX_PROMPT_RECORDS) {
    throw new Error(
      `Generation produced ${prompts.length} prompt records; at most ${MAX_PROMPT_RECORDS} can be stored`,
    );
  }

  const packWithoutPrompts = pack.generation
    ? {
        ...pack,
        generation: {
          ...pack.generation,
          prompts: undefined,
        },
      }
    : pack;
  const packJson = JSON.stringify(packWithoutPrompts);
  assertTableStringFits("packJson", packJson);

  const promptColumns: PromptColumns = {};
  if (prompts.length > 0) promptColumns.generationPromptCount = prompts.length;
  prompts.forEach(({ system, user, ...metadata }, index) => {
    const metaProperty = promptColumn(index, "Meta");
    const userProperty = promptColumn(index, "User");
    const metadataJson = JSON.stringify(metadata);
    assertTableStringFits(metaProperty, metadataJson);
    assertTableStringFits(userProperty, user);
    promptColumns[metaProperty] = metadataJson;
    promptColumns[userProperty] = user;
    if (system !== undefined) {
      const systemProperty = promptColumn(index, "System");
      assertTableStringFits(systemProperty, system);
      promptColumns[systemProperty] = system;
    }
  });

  return { packJson, promptColumns };
}

export function parsePack(entity: PackEntity): DailyPack {
  const raw = JSON.parse(entity.packJson) as {
    generation?: { prompts?: GenerationPromptRecord[] };
  };
  if (
    raw.generation &&
    raw.generation.prompts === undefined &&
    entity.generationPromptCount
  ) {
    const values = entity as unknown as Record<string, unknown>;
    raw.generation.prompts = Array.from(
      { length: entity.generationPromptCount },
      (_, index) => {
        const metaProperty = promptColumn(index, "Meta");
        const userProperty = promptColumn(index, "User");
        const metadataJson = values[metaProperty];
        const user = values[userProperty];
        if (typeof metadataJson !== "string" || typeof user !== "string") {
          throw new Error(
            `Stored generation prompt ${index + 1} is missing ${typeof metadataJson !== "string" ? metaProperty : userProperty}`,
          );
        }
        const metadata = JSON.parse(metadataJson) as Omit<
          GenerationPromptRecord,
          "system" | "user"
        >;
        const system = values[promptColumn(index, "System")];
        return {
          ...metadata,
          ...(typeof system === "string" ? { system } : {}),
          user,
        };
      },
    );
  }
  return DailyPackSchema.parse(raw);
}

export function moderationStatusOf(entity: {
  moderationStatus?: string;
}): ModerationStatus {
  if (entity.moderationStatus === undefined) return "approved";
  if (
    entity.moderationStatus === "pending" ||
    entity.moderationStatus === "approved" ||
    entity.moderationStatus === "rejected"
  ) {
    return entity.moderationStatus;
  }
  return "pending";
}

function isPublic(entity: { moderationStatus?: string }): boolean {
  return moderationStatusOf(entity) === "approved";
}

/** Point-read a pack by its unique id. */
export async function getPackById(id: string): Promise<StoredPack | null> {
  const client = await getClient();
  try {
    const entity = await client.getEntity<PackEntity>(PARTITION, id);
    if (!isPublic(entity)) return null;
    return { id: entity.rowKey, date: entity.date, pack: parsePack(entity) };
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null;
    throw err;
  }
}

/** Check whether a pack's assets may be served publicly. */
export async function isPackPublic(id: string): Promise<boolean> {
  const client = await getClient();
  try {
    const entity = await client.getEntity<Pick<PackEntity, "moderationStatus">>(
      PARTITION,
      id,
      { queryOptions: { select: ["moderationStatus"] } },
    );
    return isPublic(entity);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return false;
    throw error;
  }
}

/** The most recently generated pack, optionally filtered to a reading tier. */
export async function getLatestPack(tier?: TierId): Promise<StoredPack | null> {
  const client = await getClient();
  const filter = tier
    ? odata`PartitionKey eq ${PARTITION} and tier eq ${tier}`
    : odata`PartitionKey eq ${PARTITION}`;
  const iter = client.listEntities<PackEntity>({ queryOptions: { filter } });
  for await (const entity of iter) {
    if (!isPublic(entity)) continue;
    return { id: entity.rowKey, date: entity.date, pack: parsePack(entity) };
  }
  return null;
}

/**
 * Insert a new pack under a caller-supplied unique id plus its denormalized
 * metadata columns (§5.4). Never overwrites — multiple packs can coexist for
 * the same date. The id also namespaces the pack's images in Blob storage.
 */
export async function insertPack(
  id: string,
  date: string,
  tier: TierId,
  pack: DailyPack,
): Promise<void> {
  const client = await getClient();
  const cover = pack.story.images.find((i) => i.role === "cover");
  const generation = pack.generation;
  const { packJson, promptColumns } = serializePackForTable(pack);
  const entity: PackEntity = {
    partitionKey: PARTITION,
    rowKey: id,
    date,
    tier,
    packJson,
    createdAt: new Date().toISOString(),
    title: pack.story.title,
    genre: pack.story.genre,
    theme: pack.story.theme,
    coverBlobPath: cover?.blobPath ?? "",
    readingTimeMin: pack.story.readingTimeMin,
    moderationStatus: "pending",
    ...promptColumns,
    ...(generation
      ? {
          generationSchemaVersion: generation.schemaVersion,
          appVersion: generation.appVersion,
          promptVersion: generation.promptVersion,
          storyModel: generation.models.story,
          learningModel: generation.models.learning,
          imageModel: generation.models.image,
          totalTokens: generation.tokens.total,
          ...(generation.costUsd === undefined
            ? {}
            : { totalCostUsd: generation.costUsd }),
          ...(generation.costs?.textUsd === undefined
            ? {}
            : { textCostUsd: generation.costs.textUsd }),
          ...(generation.costs?.imagesUsd === undefined
            ? {}
            : { imageCostUsd: generation.costs.imagesUsd }),
          ...(generation.costs?.audioUsd === undefined
            ? {}
            : { audioCostUsd: generation.costs.audioUsd }),
          ...(generation.costs?.totalWithAudioUsd === undefined
            ? {}
            : { totalWithAudioCostUsd: generation.costs.totalWithAudioUsd }),
          ...(generation.costs?.audioEstimatedUsd === undefined
            ? {}
            : { audioEstimatedCostUsd: generation.costs.audioEstimatedUsd }),
          ...(generation.costs?.estimatedTotalUsd === undefined
            ? {}
            : { estimatedTotalCostUsd: generation.costs.estimatedTotalUsd }),
          durationMs: generation.durationMs,
          storyRetries: generation.retries.story,
          learningRetries: generation.retries.learning,
          imageSucceeded: generation.images.succeeded,
          imageFailed: generation.images.failed,
          ...(generation.audio
            ? {
                audioModel: generation.audio.model,
                audioVoice: generation.audio.voice,
                audioStatus: generation.audio.status,
                audioBytes: generation.audio.bytes,
              }
            : {}),
        }
      : {}),
  };
  await client.createEntity(entity);
}

const DEFAULT_LIST_LIMIT = 12;
const MAX_LIST_LIMIT = 50;

/** Only the metadata columns projected for the Story Library (§5.4). */
type PackMetaEntity = Pick<
  PackEntity,
  | "rowKey"
  | "date"
  | "tier"
  | "title"
  | "genre"
  | "theme"
  | "readingTimeMin"
  | "coverBlobPath"
  | "moderationStatus"
>;

export function clampListLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIST_LIMIT);
}

export function entityToSummary(entity: PackMetaEntity): PackSummary {
  return {
    id: entity.rowKey,
    date: entity.date,
    tier: (entity.tier as TierId) ?? "growing",
    title: entity.title,
    genre: entity.genre,
    theme: entity.theme,
    readingTimeMin: entity.readingTimeMin,
    coverBlobPath: entity.coverBlobPath ? entity.coverBlobPath : null,
  };
}

/** Metadata-only, paged, newest-first listing for the Story Library (§3.5). */
export async function listPacks(opts?: {
  limit?: number;
  cursor?: string;
  tier?: TierId;
  genre?: string;
  theme?: string;
}): Promise<{ items: PackSummary[]; nextCursor?: string }> {
  const client = await getClient();
  const limit = clampListLimit(opts?.limit);
  const filters = [odata`PartitionKey eq ${PARTITION}`];
  if (opts?.tier) filters.push(odata`tier eq ${opts.tier}`);
  if (opts?.genre) filters.push(odata`genre eq ${opts.genre}`);
  if (opts?.theme) filters.push(odata`theme eq ${opts.theme}`);
  const filter = filters.join(" and ");
  const items: PackSummary[] = [];
  let continuationToken = opts?.cursor;
  do {
    const pages = client
      .listEntities<PackEntity>({
        queryOptions: {
          filter,
          select: [
            "RowKey",
            "date",
            "tier",
            "title",
            "genre",
            "theme",
            "readingTimeMin",
            "coverBlobPath",
            "moderationStatus",
          ],
        },
      })
      .byPage({
        maxPageSize: limit - items.length,
        continuationToken,
      });
    const { value } = await pages.next();
    const page = (value ?? []) as PackEntity[] & {
      continuationToken?: string;
    };
    items.push(...page.filter(isPublic).map(entityToSummary));
    continuationToken = page.continuationToken || undefined;
  } while (items.length < limit && continuationToken);

  return {
    items,
    nextCursor: continuationToken,
  };
}

function entityToModerationSummary(entity: PackEntity): ModerationSummary {
  return {
    ...entityToSummary(entity),
    status: moderationStatusOf(entity),
    createdAt: entity.createdAt,
    moderatedAt: entity.moderatedAt,
    moderationNote: entity.moderationNote,
  };
}

/** List packs for the admin moderation queue. */
export async function listModerationPacks(
  status: ModerationStatus = "pending",
  limit = 50,
): Promise<ModerationSummary[]> {
  const client = await getClient();
  const iter = client.listEntities<PackEntity>({
    queryOptions: {
      filter: odata`PartitionKey eq ${PARTITION}`,
      select: [
        "RowKey",
        "date",
        "tier",
        "title",
        "genre",
        "theme",
        "readingTimeMin",
        "coverBlobPath",
        "createdAt",
        "moderationStatus",
        "moderatedAt",
        "moderationNote",
      ],
    },
  });
  const items: ModerationSummary[] = [];
  for await (const entity of iter) {
    if (moderationStatusOf(entity) !== status) continue;
    items.push(entityToModerationSummary(entity));
    if (items.length >= Math.min(Math.max(limit, 1), 100)) break;
  }
  return items;
}

/** Read any pack for authenticated moderation, regardless of public status. */
export async function getPackForModeration(
  id: string,
): Promise<ModerationPack | null> {
  const client = await getClient();
  try {
    const entity = await client.getEntity<PackEntity>(PARTITION, id);
    return {
      id: entity.rowKey,
      date: entity.date,
      pack: parsePack(entity),
      moderation: {
        status: moderationStatusOf(entity),
        createdAt: entity.createdAt,
        moderatedAt: entity.moderatedAt,
        note: entity.moderationNote,
      },
    };
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }
}

/** Approve or reject a generated pack without rewriting its content. */
export async function moderatePack(
  id: string,
  status: "approved" | "rejected",
  note?: string,
): Promise<boolean> {
  const client = await getClient();
  try {
    await client.updateEntity(
      {
        partitionKey: PARTITION,
        rowKey: id,
        moderationStatus: status,
        moderatedAt: new Date().toISOString(),
        moderationNote: note?.trim() || "",
      },
      "Merge",
    );
    return true;
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return false;
    throw error;
  }
}
