import { readJsonResponse } from "./read-json-response";
import type { AdminFetch } from "./types";

type UploadTicket = {
  publicUrl?: string;
  uploadUrl?: string;
  contentType?: string;
  cacheControl?: string;
  needsOptimizing?: boolean;
};

async function contentHash(bytes: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await bytes.arrayBuffer());
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

function subtypeOf(dataUri: string): string {
  return dataUri.slice("data:image/".length, dataUri.indexOf(";"));
}

async function postJson<T extends object>(adminFetch: AdminFetch, path: string, body: object): Promise<T> {
  const res = await adminFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJsonResponse<T>(res);
  if (!res.ok || data.error) throw new Error(data.error ?? `${path} failed (${res.status})`);
  return data;
}

async function putToR2(ticket: UploadTicket, bytes: Blob) {
  const upload = await fetch(ticket.uploadUrl!, {
    method: "PUT",
    body: bytes,
    headers: { "Content-Type": ticket.contentType!, "Cache-Control": ticket.cacheControl! },
  });
  if (!upload.ok) throw new Error(`R2 rejected an image upload (${upload.status})`);
}

// The original goes straight to R2 through a presigned URL, because a single
// photo can be larger than the 4.5 MB a Vercel function accepts. The server
// then converts stills to WebP from R2 and answers with the final URL.
export async function uploadInlineImage(dataUri: string, adminFetch: AdminFetch): Promise<string> {
  const bytes = await (await fetch(dataUri)).blob();
  const identity = { hash: await contentHash(bytes), subtype: subtypeOf(dataUri) };
  const ticket = await postJson<UploadTicket>(adminFetch, "/api/admin/blog/image-upload", identity);
  if (!ticket.uploadUrl) return ticket.publicUrl!;

  await putToR2(ticket, bytes);
  if (!ticket.needsOptimizing) return ticket.publicUrl!;

  const optimized = await postJson<{ publicUrl: string }>(adminFetch, "/api/admin/blog/image-upload/optimize", identity);
  return optimized.publicUrl;
}
