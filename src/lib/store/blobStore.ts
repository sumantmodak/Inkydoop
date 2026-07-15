import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "@/lib/env";

let containerPromise: Promise<ContainerClient> | null = null;

function createServiceClient(): BlobServiceClient {
  const conn = env.AZURE_STORAGE_CONNECTION_STRING;
  if (conn) return BlobServiceClient.fromConnectionString(conn);
  const account = env.AZURE_STORAGE_ACCOUNT;
  if (!account) throw new Error("No Azure Storage configuration");
  return new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
}

async function getContainer(): Promise<ContainerClient> {
  if (!containerPromise) {
    containerPromise = (async () => {
      const service = createServiceClient();
      const container = service.getContainerClient(env.AZURE_BLOB_CONTAINER);
      await container.createIfNotExists();
      return container;
    })();
    // Don't cache a failed init — allow the next call to retry.
    containerPromise.catch(() => {
      containerPromise = null;
    });
  }
  return containerPromise;
}

/** Upload image bytes to a blob path (e.g. "2026-07-15/cover.webp"). */
export async function uploadImage(
  path: string,
  data: Buffer,
  contentType = "image/webp",
): Promise<void> {
  const container = await getContainer();
  const blob = container.getBlockBlobClient(path);
  await blob.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

/** Download image bytes, or null if the blob does not exist. */
export async function downloadImage(path: string): Promise<Buffer | null> {
  const container = await getContainer();
  const blob = container.getBlockBlobClient(path);
  try {
    return await blob.downloadToBuffer();
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null;
    throw err;
  }
}
