import path from "path";
import fs from "fs/promises";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadsDir(...subdirs: string[]) {
  const dir = path.join(UPLOADS_DIR, ...subdirs);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function safeJoinUploads(relativePath: string) {
  const resolved = path.resolve(UPLOADS_DIR, relativePath);
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
    throw new Error("Invalid path");
  }
  return resolved;
}
