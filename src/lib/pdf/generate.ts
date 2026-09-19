import path from "path";
import { putUpload, readUpload } from "@/lib/uploads";

export type PdfGenerateResult = {
  relativePath: string;
  pageCount: number;
  buffer: Buffer;
};

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type[\s]*\/Page[^s]/g);
  return Math.max(1, matches?.length ?? 1);
}

async function renderPdfBuffer(html: string): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    const browser = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      await page.emulateMediaType("print");
      await page.evaluateHandle("document.fonts.ready");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "12mm", right: "14mm", bottom: "12mm", left: "14mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "14mm", bottom: "12mm", left: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function htmlToPdf(
  html: string,
  relativeOutPath: string,
): Promise<PdfGenerateResult> {
  const fileName = path.basename(relativeOutPath);
  const relative = path.posix.join("pdfs", fileName);
  const buffer = await renderPdfBuffer(html);
  await putUpload(relative, buffer, "application/pdf");

  return {
    relativePath: relative,
    pageCount: countPdfPages(buffer),
    buffer,
  };
}

export async function readPdfBuffer(relativePath: string): Promise<Buffer> {
  return readUpload(relativePath);
}
