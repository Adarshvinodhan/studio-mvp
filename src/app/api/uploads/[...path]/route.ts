import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getSession } from "@/lib/auth";
import { safeJoinUploads } from "@/lib/uploads";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: parts } = await context.params;
  const relative = parts.join("/");
  try {
    const absolute = safeJoinUploads(relative);
    const buffer = await fs.readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
    return new NextResponse(buffer, {
      headers: { "Content-Type": type },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
