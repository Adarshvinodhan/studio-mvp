import path from "path";
import fs from "fs/promises";
import { ensureUploadsDir } from "@/lib/uploads";

export type PdfGenerateResult = {
  relativePath: string;
  pageCount: number;
};

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type[\s]*\/Page[^s]/g);
  return Math.max(1, matches?.length ?? 1);
}

export async function htmlToPdf(
  html: string,
  relativeOutPath: string,
): Promise<PdfGenerateResult> {
  const outDir = await ensureUploadsDir("pdfs");
  const fileName = path.basename(relativeOutPath);
  const absolutePath = path.join(outDir, fileName);

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");
    await page.evaluateHandle("document.fonts.ready");

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "14mm", bottom: "12mm", left: "14mm" },
    });

    await fs.writeFile(absolutePath, buffer);

    const relative = path.join("pdfs", fileName).replace(/\\/g, "/");
    return {
      relativePath: relative,
      pageCount: countPdfPages(Buffer.from(buffer)),
    };
  } finally {
    await browser.close();
  }
}

export async function readPdfBuffer(relativePath: string): Promise<Buffer> {
  const absolute = path.join(process.cwd(), "uploads", relativePath);
  return fs.readFile(absolute);
}
