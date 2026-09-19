import path from "path";
import fs from "fs/promises";
import {
  getSupabaseAdmin,
  storageBucket,
  supabaseConfigured,
} from "@/lib/supabase";

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

let bucketReady: Promise<void> | null = null;

function assertStorageAvailable() {
  if (process.env.VERCEL && !supabaseConfigured()) {
    throw new Error(
      "File storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel",
    );
  }
}

async function ensureBucket() {
  if (!supabaseConfigured()) return;
  if (!bucketReady) {
    bucketReady = (async () => {
      const supabase = getSupabaseAdmin();
      const bucket = storageBucket();
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) throw listError;
      if (!buckets?.some((b) => b.name === bucket)) {
        const { error } = await supabase.storage.createBucket(bucket, {
          public: false,
          fileSizeLimit: 20 * 1024 * 1024,
        });
        // Race: another instance may have created it
        if (error && !/already exists|duplicate/i.test(error.message)) {
          throw error;
        }
      }
    })();
  }
  await bucketReady;
}

function contentTypeFor(relativePath: string) {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

function normalizeKey(relativePath: string) {
  const key = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!key || key.includes("..")) {
    throw new Error("Invalid path");
  }
  return key;
}

export async function putUpload(
  relativePath: string,
  data: Buffer,
  contentType?: string,
) {
  assertStorageAvailable();
  const key = normalizeKey(relativePath);
  const type = contentType || contentTypeFor(key);

  if (supabaseConfigured()) {
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(storageBucket()).upload(key, data, {
      contentType: type,
      upsert: true,
    });
    if (error) throw error;
    return key;
  }

  const absolute = path.join(LOCAL_UPLOADS_DIR, key);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
  return key;
}

export async function readUpload(relativePath: string): Promise<Buffer> {
  assertStorageAvailable();
  const key = normalizeKey(relativePath);

  if (supabaseConfigured()) {
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(storageBucket()).download(key);
    if (error || !data) throw error || new Error("Not found");
    return Buffer.from(await data.arrayBuffer());
  }

  return fs.readFile(path.join(LOCAL_UPLOADS_DIR, key));
}

export async function deleteUpload(relativePath: string) {
  assertStorageAvailable();
  const key = normalizeKey(relativePath);

  if (supabaseConfigured()) {
    await ensureBucket();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(storageBucket()).remove([key]);
    if (error) throw error;
    return;
  }

  try {
    await fs.unlink(path.join(LOCAL_UPLOADS_DIR, key));
  } catch {
    // ignore missing file
  }
}

export function contentTypeForUpload(relativePath: string) {
  return contentTypeFor(normalizeKey(relativePath));
}
