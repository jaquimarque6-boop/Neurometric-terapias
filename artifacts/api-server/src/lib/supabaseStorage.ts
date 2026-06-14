// Supabase Storage helper — private bucket + signed URLs.
// Uses the Storage REST API directly (no SDK) for consistency with the
// existing supabase migration seed. Credentials come from env vars only;
// the service key never reaches the browser (only short-lived signed URLs do).

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
const BUCKET = process.env.SUPABASE_FILES_BUCKET ?? "patient-files";

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
}

// Encode each path segment but keep the slashes that separate folders.
function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Create a short-lived signed upload URL. The browser PUTs the file bytes
 * directly to the returned URL (the token in the URL authorizes the upload,
 * so the service key is never exposed client-side).
 */
export async function createSignedUploadUrl(path: string): Promise<{ uploadUrl: string }> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      // Supabase rejects an empty body when Content-Type is application/json,
      // so always send a JSON object even though no fields are required here.
      body: JSON.stringify({}),
    },
  );
  if (!res.ok) {
    throw new Error(`Supabase signed upload URL failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { url: string };
  return { uploadUrl: `${SUPABASE_URL}/storage/v1${data.url}` };
}

/**
 * Create a short-lived signed download URL for a stored object.
 */
export async function createSignedDownloadUrl(
  path: string,
  expiresIn = 300,
  downloadName?: string,
): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn }),
    },
  );
  if (!res.ok) {
    throw new Error(`Supabase signed download URL failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { signedURL: string };
  let url = `${SUPABASE_URL}/storage/v1${data.signedURL}`;
  if (downloadName) url += `&download=${encodeURIComponent(downloadName)}`;
  return url;
}

/**
 * Check whether an object exists in storage (fetches a single byte).
 */
export async function objectExists(path: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    { method: "GET", headers: { ...authHeaders(), Range: "bytes=0-0" } },
  );
  return res.ok;
}

/**
 * Delete a stored object. Treats 404 as success (already gone).
 */
export async function deleteStorageObject(path: string): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    { method: "DELETE", headers: authHeaders() },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Supabase delete object failed: ${res.status} ${await res.text()}`);
  }
}
