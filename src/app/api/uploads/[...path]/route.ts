import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { contentTypeForUpload, readUpload } from "@/lib/uploads";

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
    const buffer = await readUpload(relative);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentTypeForUpload(relative),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
