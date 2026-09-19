import { formatINR, toNumber } from "@/lib/money";

type SettingsLike = {
  businessName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankHolderName: string | null;
  bankAccountNumber: string | null;
  ifsc: string | null;
  upiNumber: string | null;
  logo?: string | null;
};

type ItemLike = {
  name: string;
  description: string | null;
  category: string | null;
  quantity: unknown;
  unitPrice: unknown;
  lineTotal?: unknown;
};

const GREEN = "#0f3d2e";
const GREEN_MID = "#1f6b4f";
const GREEN_SOFT = "#e7f2ec";
const INK = "#1a2e26";
const MUTED = "#5a6f65";

const PDF_DESC_MAX = 220;
const PDF_TERMS_MAX = 6000;

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncatePdfText(s: string | null | undefined, max: number): string {
  if (!s) return "—";
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function qtyLabel(item: ItemLike): string {
  const qty = toNumber(item.quantity);
  const cat = (item.category || "").toLowerCase();
  if (cat.includes("album")) return `${qty} Album${qty === 1 ? "" : "s"}`;
  if (cat.includes("video")) return `${qty} Video${qty === 1 ? "" : "s"}`;
  if (cat.includes("photo")) return `${qty} Event${qty === 1 ? "" : "s"}`;
  if (cat.includes("add")) return `${qty} Package${qty === 1 ? "" : "s"}`;
  return String(qty);
}

function baseStyles() {
  return `
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      color: ${INK};
      font-size: 10.5pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      page-break-after: always;
      break-after: page;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .page-inner {
      padding: 0;
    }
    .top-bar {
      height: 8px;
      background: linear-gradient(90deg, ${GREEN} 0%, ${GREEN_MID} 100%);
      margin: 0 0 14px;
      border-radius: 0;
    }
    .doc-label {
      display: inline-block;
      font-size: 9pt;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: ${GREEN_MID};
      border: 1px solid ${GREEN_MID};
      padding: 4px 12px;
      margin-bottom: 10px;
    }
    .brand {
      font-family: "Palatino Linotype", "Book Antiqua", Palatino, serif;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: 22pt;
      color: ${GREEN};
      margin: 0 0 6px;
      font-weight: 700;
      word-break: break-word;
    }
    .contact {
      color: ${MUTED};
      font-size: 9pt;
      line-height: 1.5;
      margin: 0;
      word-break: break-word;
    }
    .rule {
      border: none;
      border-top: 2px solid ${GREEN};
      margin: 14px 0 16px;
    }
    h2 {
      font-size: 11pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fff;
      background: ${GREEN};
      margin: 18px 0 0;
      padding: 8px 12px;
      break-after: avoid;
      page-break-after: avoid;
    }
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .deliverables {
      table-layout: fixed;
    }
    .deliverables th {
      background: ${GREEN_SOFT};
      color: ${GREEN};
      font-size: 8pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 9px 10px;
      border-bottom: 2px solid ${GREEN};
      text-align: left;
    }
    .deliverables td {
      padding: 10px;
      border-bottom: 1px solid #dce6e0;
      vertical-align: top;
      font-size: 9.5pt;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .deliverables tr:nth-child(even) td { background: #fafcfb; }
    .col-service { width: 26%; }
    .col-desc { width: 44%; }
    .col-qty { width: 14%; }
    .col-price { width: 8%; }
    .service-name { color: ${GREEN}; font-weight: 700; }
    .desc { color: ${MUTED}; font-size: 9pt; margin-top: 2px; }
    .qty { white-space: nowrap; color: ${INK}; }
    .meta-grid { width: 100%; margin-top: 4px; }
    .meta-grid td { vertical-align: top; padding: 0; border: none; }
    .meta-box {
      background: ${GREEN_SOFT};
      border-left: 3px solid ${GREEN};
      padding: 10px 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .meta-label {
      font-size: 7.5pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${GREEN_MID};
      margin: 0 0 4px;
    }
    .meta-value {
      margin: 0;
      font-size: 10.5pt;
      color: ${INK};
      word-break: break-word;
    }
    .meta-row { margin: 0 0 8px; }
    .meta-row:last-child { margin-bottom: 0; }
    .section-block {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .investment {
      border: 1.5px solid ${GREEN};
      margin-top: 0;
      padding: 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .investment-body { padding: 12px 14px; }
    .investment table td { border: none; padding: 5px 0; font-size: 10.5pt; }
    .investment .grand td {
      font-size: 13pt;
      font-weight: 700;
      color: ${GREEN};
      border-top: 1.5px solid ${GREEN};
      padding-top: 10px;
    }
    .right { text-align: right; }
    .page-terms {
      page-break-before: always;
      break-before: page;
    }
    .terms-title {
      font-size: 14pt;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${GREEN};
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${GREEN};
      break-after: avoid;
      page-break-after: avoid;
    }
    .terms {
      white-space: pre-wrap;
      font-size: 9pt;
      color: #334840;
      line-height: 1.55;
      word-break: break-word;
    }
    .bank {
      background: ${GREEN_SOFT};
      border: 1px solid #b7d0c4;
      padding: 12px 14px;
      margin-top: 16px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .bank strong {
      color: ${GREEN};
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-size: 9pt;
    }
    .footer-note {
      margin-top: 20px;
      font-size: 8.5pt;
      color: ${MUTED};
      text-align: center;
    }
    .amount-hero {
      font-size: 18pt;
      font-weight: 700;
      color: ${GREEN};
    }
  `;
}

function brandHeader(settings: SettingsLike, docLabel: string) {
  return `
    <div class="top-bar"></div>
    <div class="doc-label">${esc(docLabel)}</div>
    <p class="brand">${esc(settings.businessName)}</p>
    <p class="contact">${esc(truncatePdfText(settings.address, 120))}</p>
    <p class="contact">
      ${settings.phone ? `Phone: ${esc(settings.phone)}` : ""}
      ${settings.phone && settings.email ? "&nbsp;&nbsp;|&nbsp;&nbsp;" : ""}
      ${settings.email ? `Email: ${esc(settings.email)}` : ""}
    </p>
    <hr class="rule" />
  `;
}

function bankBlock(settings: SettingsLike) {
  if (!settings.bankHolderName && !settings.upiNumber) return "";
  return `
    <div class="bank">
      <strong>Bank Details</strong><br/><br/>
      ${settings.bankHolderName ? `Account Holder name : ${esc(settings.bankHolderName)}<br/>` : ""}
      ${settings.bankAccountNumber ? `Account No : ${esc(settings.bankAccountNumber)}<br/>` : ""}
      ${settings.ifsc ? `IFSC : ${esc(settings.ifsc)}` : ""}
      ${settings.upiNumber ? `<br/>Gpay : ${esc(settings.upiNumber)}` : ""}
    </div>
  `;
}

function deliverablesTable(items: ItemLike[], mode: "catalogue" | "quotation") {
  const rows = items
    .map((item) => {
      const priceCells =
        mode === "catalogue"
          ? `<td class="right col-price">${formatINR(item.unitPrice)}</td>
             <td class="right col-price">${formatINR(
               item.lineTotal != null
                 ? item.lineTotal
                 : toNumber(item.quantity) * toNumber(item.unitPrice),
             )}</td>`
          : "";
      return `
        <tr>
          <td class="col-service">
            <div class="service-name">${esc(truncatePdfText(item.name, 80))}</div>
            ${item.category ? `<div class="desc">${esc(item.category)}</div>` : ""}
          </td>
          <td class="col-desc">
            <div class="desc">${esc(truncatePdfText(item.description, PDF_DESC_MAX))}</div>
          </td>
          <td class="col-qty qty">${esc(qtyLabel(item))}</td>
          ${priceCells}
        </tr>
      `;
    })
    .join("");

  const priceHeaders =
    mode === "catalogue"
      ? `<th class="right col-price">Price</th><th class="right col-price">Total</th>`
      : "";

  return `
    <table class="deliverables">
      <thead>
        <tr>
          <th class="col-service">Service / Category</th>
          <th class="col-desc">Description &amp; Premium Specifications</th>
          <th class="col-qty">Quantity</th>
          ${priceHeaders}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function termsPage(terms: string | null, settings: SettingsLike) {
  if (!terms) return `<div class="page"><div class="page-inner">${bankBlock(settings)}</div></div>`;
  const trimmedTerms = truncatePdfText(terms, PDF_TERMS_MAX);
  return `
    <div class="page page-terms">
      <div class="page-inner">
        <div class="top-bar"></div>
        <h1 class="terms-title">Terms &amp; Conditions</h1>
        <div class="terms">${esc(trimmedTerms)}</div>
        ${bankBlock(settings)}
        <p class="footer-note">${esc(settings.businessName)} · Coimbatore</p>
      </div>
    </div>
  `;
}

export function renderCatalogueHtml(opts: {
  settings: SettingsLike;
  packageName: string;
  packageDescription: string | null;
  basePrice: unknown;
  items: ItemLike[];
  terms: string | null;
}) {
  const { settings, packageName, packageDescription, basePrice, items, terms } = opts;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles()}</style></head><body>
    <div class="page">
      <div class="page-inner">
        ${brandHeader(settings, "Catalogue")}
        <h2>Exclusive Premium Package Deliverables</h2>
        ${deliverablesTable(items, "catalogue")}
        <div class="section-block">
          <h2>Investment &amp; Commercial Terms</h2>
          <div class="investment">
            <div class="investment-body">
              <p style="margin:0 0 10px;color:${MUTED};font-size:9.5pt;">${esc(packageName)}${
                packageDescription ? ` — ${esc(truncatePdfText(packageDescription, 160))}` : ""
              }</p>
              <table>
                <tr><td>Package Amount</td><td class="right">${formatINR(basePrice)}</td></tr>
                <tr><td>Taxes &amp; GST (18%)</td><td class="right">${formatINR(0)}</td></tr>
                <tr class="grand"><td>Total Investment</td><td class="right">${formatINR(basePrice)}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${termsPage(terms, settings)}
  </body></html>`;
}

export function renderQuotationHtml(opts: {
  settings: SettingsLike;
  quotationNumber: string;
  customerName: string;
  customerContact?: string | null;
  customerAddress?: string | null;
  eventName?: string | null;
  eventLocation?: string | null;
  eventDate?: string | null;
  issuedDate?: string | null;
  packageLabel?: string | null;
  items: ItemLike[];
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;
  terms: string | null;
}) {
  const o = opts;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles()}</style></head><body>
    <div class="page">
      <div class="page-inner">
        ${brandHeader(o.settings, "Quotation")}
        <table class="meta-grid">
          <tr>
            <td style="width:48%;padding-right:10px;">
              <div class="meta-box">
                <p class="meta-label">Prepared For</p>
                <p class="meta-value"><strong>${esc(truncatePdfText(o.customerName, 80))}</strong></p>
                ${o.customerContact ? `<p class="meta-value">${esc(o.customerContact)}</p>` : ""}
                ${o.customerAddress ? `<p class="meta-value">${esc(truncatePdfText(o.customerAddress, 120))}</p>` : ""}
              </div>
            </td>
            <td style="width:52%;padding-left:10px;">
              <div class="meta-box">
                <div class="meta-row">
                  <p class="meta-label">Quotation No</p>
                  <p class="meta-value"><strong>${esc(o.quotationNumber)}</strong></p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Event</p>
                  <p class="meta-value">${esc(o.eventName || "—")}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Event Location</p>
                  <p class="meta-value">${esc(truncatePdfText(o.eventLocation, 80))}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Date Issued</p>
                  <p class="meta-value">${esc(o.issuedDate || "—")}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Event Date</p>
                  <p class="meta-value">${esc(o.eventDate || "—")}</p>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <h2>Exclusive Premium Package Deliverables</h2>
        ${deliverablesTable(o.items, "quotation")}

        <div class="section-block">
          <h2>Investment &amp; Commercial Terms</h2>
          <div class="investment">
            <div class="investment-body">
              <p style="margin:0 0 10px;color:${MUTED};font-size:9.5pt;">
                ${esc(truncatePdfText(o.packageLabel || "Custom package (all inclusions above)", 160))}
              </p>
              <table>
                <tr><td>Subtotal</td><td class="right">${formatINR(o.subtotal)}</td></tr>
                ${
                  toNumber(o.discount) > 0
                    ? `<tr><td>Discount</td><td class="right">− ${formatINR(o.discount)}</td></tr>`
                    : ""
                }
                <tr><td>Taxes &amp; GST${toNumber(o.tax) > 0 ? "" : " (18%)"}</td><td class="right">${formatINR(o.tax)}</td></tr>
                <tr class="grand"><td>Total Investment</td><td class="right">${formatINR(o.total)}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${termsPage(o.terms, o.settings)}
  </body></html>`;
}

export function renderReceiptHtml(opts: {
  settings: SettingsLike;
  receiptNumber: string;
  customerName: string;
  quotationNumber: string;
  amount: unknown;
  paymentMethod: string;
  paymentDate: string;
  quotationTotal: unknown;
  previouslyPaid: unknown;
  totalPaid: unknown;
  balance: unknown;
}) {
  const o = opts;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyles()}</style></head><body>
    <div class="page">
      <div class="page-inner">
        ${brandHeader(o.settings, "Receipt")}
        <table class="meta-grid">
          <tr>
            <td style="width:48%;padding-right:10px;">
              <div class="meta-box">
                <div class="meta-row">
                  <p class="meta-label">Receipt No</p>
                  <p class="meta-value"><strong>${esc(o.receiptNumber)}</strong></p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Customer</p>
                  <p class="meta-value">${esc(truncatePdfText(o.customerName, 80))}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Quotation</p>
                  <p class="meta-value">${esc(o.quotationNumber)}</p>
                </div>
              </div>
            </td>
            <td style="width:52%;padding-left:10px;">
              <div class="meta-box">
                <div class="meta-row">
                  <p class="meta-label">Payment Received</p>
                  <p class="amount-hero">${formatINR(o.amount)}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Payment Method</p>
                  <p class="meta-value">${esc(o.paymentMethod)}</p>
                </div>
                <div class="meta-row">
                  <p class="meta-label">Payment Date</p>
                  <p class="meta-value">${esc(o.paymentDate)}</p>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <div class="section-block">
          <h2>Payment Summary</h2>
          <div class="investment">
            <div class="investment-body">
              <table>
                <tr><td>Quotation amount</td><td class="right">${formatINR(o.quotationTotal)}</td></tr>
                <tr><td>Previously paid</td><td class="right">${formatINR(o.previouslyPaid)}</td></tr>
                <tr><td>Total paid</td><td class="right">${formatINR(o.totalPaid)}</td></tr>
                <tr class="grand"><td>Balance</td><td class="right">${formatINR(o.balance)}</td></tr>
              </table>
            </div>
          </div>
        </div>
        <p class="footer-note">This receipt is proof of payment received by ${esc(o.settings.businessName)}.</p>
        ${bankBlock(o.settings)}
      </div>
    </div>
  </body></html>`;
}
