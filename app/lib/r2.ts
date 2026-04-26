import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not set (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

function publicBase(): string {
  const base = process.env.R2_PUBLIC_BASE;
  if (!base) throw new Error("R2_PUBLIC_BASE not set");
  return base.replace(/\/$/, "");
}

function bucketName(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET not set");
  return bucket;
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await getClient().send(new PutObjectCommand({
    Bucket: bucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${publicBase()}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}

export function r2KeysFor(photoId: string): { full: string; thumb: string; micro: string } {
  return {
    full: `photos/${photoId}/full.jpg`,
    thumb: `photos/${photoId}/thumb.jpg`,
    micro: `photos/${photoId}/micro.jpg`,
  };
}

export function r2UrlFor(key: string): string {
  return `${publicBase()}/${key}`;
}
