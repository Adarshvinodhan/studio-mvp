import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getSession } from "@/lib/auth";
import {
  generateCataloguePdf,
  generateQuotationPdf,
  generateReceiptPdf,
} from "@/lib/actions/pdf";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id");
  const disposition =
    request.nextUrl.searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  try {
    let result: { relativePath: string; pageCount: number };
    let downloadName: string;

    if (type === "catalogue") {
      result = await generateCataloguePdf(id);
      downloadName = `catalogue-${id}.pdf`;
    } else if (type === "quotation") {
      result = await generateQuotationPdf(id);
      downloadName = path.basename(result.relativePath);
    } else if (type === "receipt") {
      result = await generateReceiptPdf(id);
      downloadName = path.basename(result.relativePath);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const absolute = path.join(process.cwd(), "uploads", result.relativePath);
    const buffer = await fs.readFile(absolute);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${downloadName}"`,
        "X-PDF-Pages": String(result.pageCount),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}
