import { TableClient, odata } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "@/lib/env";
import {
  DailyPackSchema,
  type DailyPack,
  type PackSummary,
} from "@/lib/schemas";

const PARTITION = "daily";

function pad(n: number, len: number): string {
  return n.toString().padStart(len, "0");
}

// Unique, sortable pack id used as the RowKey. An ascending scan is
// newest-first: newest date first, and within a date the newest generation
// first. Multiple packs can coexist for the same date (§5.4).
function newPackId(date: string, createdMs: number): string {
  const invDate = pad(99999999 - Number(date.replaceAll("-", "")), 8);
  const invMs = pad(9999999999999 - createdMs, 13);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${invDate}-${invMs}-${rand}`;
}

interface PackEntity {
  partitionKey: string;
  rowKey: string;
  date: string;
  packJson: string;
  createdAt: string;
  title: string;
  genre: string;
  theme: string;
  coverBlobPath: string;
  readingTimeMin: number;
}

export interface StoredPack {
  id: string;
  date: string;
  pack: DailyPack;
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

function parsePack(entity: PackEntity): DailyPack {
  return DailyPackSchema.parse(JSON.parse(entity.packJson));
}

/** Point-read a pack by its unique id. */
export async function getPackById(id: string): Promise<StoredPack | null> {
  const client = await getClient();
  try {
    const entity = await client.getEntity<PackEntity>(PARTITION, id);
    return { id: entity.rowKey, date: entity.date, pack: parsePack(entity) };
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null;
    throw err;
  }
}

/** The most recently generated pack (newest date, newest generation). */
export async function getLatestPack(): Promise<StoredPack | null> {
  const client = await getClient();
  const iter = client.listEntities<PackEntity>({
    queryOptions: { filter: odata`PartitionKey eq ${PARTITION}` },
  });
  for await (const entity of iter) {
    return { id: entity.rowKey, date: entity.date, pack: parsePack(entity) };
  }
  return null;
}

/**
 * Insert a new pack under a unique id plus its denormalized metadata columns
 * (§5.4). Never overwrites — multiple packs can coexist for the same date.
 */
export async function insertPack(
  date: string,
  pack: DailyPack,
): Promise<{ id: string }> {
  const client = await getClient();
  const createdMs = Date.now();
  const id = newPackId(date, createdMs);
  const cover = pack.story.images.find((i) => i.role === "cover");
  const entity: PackEntity = {
    partitionKey: PARTITION,
    rowKey: id,
    date,
    packJson: JSON.stringify(pack),
    createdAt: new Date(createdMs).toISOString(),
    title: pack.story.title,
    genre: pack.story.genre,
    theme: pack.story.theme,
    coverBlobPath: cover?.blobPath ?? "",
    readingTimeMin: pack.story.readingTimeMin,
  };
  await client.createEntity(entity);
  return { id };
}

const DEFAULT_LIST_LIMIT = 12;
const MAX_LIST_LIMIT = 50;

/** Only the metadata columns projected for the Story Library (§5.4). */
type PackMetaEntity = Pick<
  PackEntity,
  | "rowKey"
  | "date"
  | "title"
  | "genre"
  | "theme"
  | "readingTimeMin"
  | "coverBlobPath"
>;

export function clampListLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIST_LIMIT);
}

export function entityToSummary(entity: PackMetaEntity): PackSummary {
  return {
    id: entity.rowKey,
    date: entity.date,
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
}): Promise<{ items: PackSummary[]; nextCursor?: string }> {
  const client = await getClient();
  const limit = clampListLimit(opts?.limit);
  const pages = client
    .listEntities<PackEntity>({
      queryOptions: {
        filter: odata`PartitionKey eq ${PARTITION}`,
        select: [
          "RowKey",
          "date",
          "title",
          "genre",
          "theme",
          "readingTimeMin",
          "coverBlobPath",
        ],
      },
    })
    .byPage({ maxPageSize: limit, continuationToken: opts?.cursor });

  const { value } = await pages.next();
  const page = (value ?? []) as PackEntity[] & { continuationToken?: string };
  return {
    items: page.map(entityToSummary),
    nextCursor: page.continuationToken || undefined,
  };
}
