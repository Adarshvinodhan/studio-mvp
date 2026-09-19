# Camtrio Studio MVP

Photography business management for Camtrio Weddings — catalogues, quotations, payments, and branded PDFs.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Puppeteer (PDF generation)
- Single-admin auth via env credentials

## Setup

1. Copy env file and fill values:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL` — Postgres connection string (e.g. Neon)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `AUTH_SECRET` — long random string

2. Install dependencies:

```bash
npm install
```

3. Create tables and seed Camtrio data:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Core concepts

| Concept | Meaning |
|---------|---------|
| Catalogue | Reusable package the photographer sells |
| Quotation | Customer-specific copy of items (independent of catalogue) |
| Payment | Separate transaction against a quotation |
| Receipt | Proof PDF for one payment |

Paid amount = sum of payments. Balance = quotation total − paid.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed settings + Premium package + sample customer |
| `npm run db:generate` | Regenerate Prisma client |

## Notes

- Uploads and generated PDFs are stored under `uploads/`
- PDF download: `/api/pdf?type=quotation|catalogue|receipt&id=...`
- PDF preview (opens in browser): `/api/pdf?type=...&id=...&disposition=inline`
- Receipts are created automatically when a payment is recorded
