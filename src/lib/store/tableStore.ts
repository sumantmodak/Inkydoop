import { TableClient, odata } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "@/lib/env";
import {
  DailyPackSchema,
  type DailyPack,
  type PackSummary,
} from "@/lib/schemas";

const PARTITION = "daily";

/** Inverted date so an ascending RowKey scan is newest-first (§5.4). */
function invertedRowKey(date: string): string {
  return (99999999 - Number(date.replaceAll("-", "")))
    .toString()
    .padStart(8, "0");
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

/** Point-read a pack by exact date. */
export async function getPack(date: string): Promise<DailyPack | null> {
  const client = await getClient();
  try {
    const entity = await client.getEntity<PackEntity>(
      PARTITION,
      invertedRowKey(date),
    );
    return parsePack(entity);
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null;
    throw err;
  }
}

/** Most recent pack on or before a date (§6.3 fallback). */
export async function getLatestPack(
  onOrBefore: string,
): Promise<{ date: string; pack: DailyPack } | null> {
  const client = await getClient();
  const floor = invertedRowKey(onOrBefore);
  const iter = client.listEntities<PackEntity>({
    queryOptions: {
      filter: odata`PartitionKey eq ${PARTITION} and RowKey ge ${floor}`,
    },
  });
  for await (const entity of iter) {
    return { date: entity.date, pack: parsePack(entity) };
  }
  return null;
}

/** Upsert a pack plus its denormalized metadata columns (§5.4). */
export async function upsertPack(date: string, pack: DailyPack): Promise<void> {
  const client = await getClient();
  const cover = pack.story.images.find((i) => i.role === "cover");
  const entity: PackEntity = {
    partitionKey: PARTITION,
    rowKey: invertedRowKey(date),
    date,
    packJson: JSON.stringify(pack),
    createdAt: new Date().toISOString(),
    title: pack.story.title,
    genre: pack.story.genre,
    theme: pack.story.theme,
    coverBlobPath: cover?.blobPath ?? "",
    readingTimeMin: pack.story.readingTimeMin,
  };
  await client.upsertEntity(entity, "Replace");
}

const DEFAULT_LIST_LIMIT = 12;
const MAX_LIST_LIMIT = 50;

/** Only the metadata columns projected for the Story Library (§5.4). */
type PackMetaEntity = Pick<
  PackEntity,
  "date" | "title" | "genre" | "theme" | "readingTimeMin" | "coverBlobPath"
>;

export function clampListLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIST_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIST_LIMIT);
}

export function entityToSummary(entity: PackMetaEntity): PackSummary {
  return {
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
