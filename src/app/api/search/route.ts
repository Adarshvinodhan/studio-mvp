import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";

export type SearchHit = {
  id: string;
  href: string;
  kind: "customer" | "quotation" | "catalogue";
  title: string;
  subtitle: string;
};

const LIMIT = 6;

/** Backs the ⌘K palette: one round trip across the three searchable models. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ hits: [] satisfies SearchHit[] });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [customers, quotations, packages] = await Promise.all([
    prisma.customer.findMany({
      where: { OR: [{ name: contains }, { phone: contains }, { email: contains }] },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
      select: { id: true, name: true, phone: true },
    }),
    prisma.quotation.findMany({
      where: {
        OR: [
          { quotationNumber: contains },
          { customer: { name: contains } },
          { event: { name: contains } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        quotationNumber: true,
        total: true,
        status: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.package.findMany({
      where: { name: contains },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
      select: { id: true, name: true, basePrice: true },
    }),
  ]);

  const hits: SearchHit[] = [
    ...customers.map((c) => ({
      id: c.id,
      href: `/customers/${c.id}`,
      kind: "customer" as const,
      title: c.name,
      subtitle: c.phone || "No phone on file",
    })),
    ...quotations.map((q) => ({
      id: q.id,
      href: `/quotations/${q.id}`,
      kind: "quotation" as const,
      title: q.quotationNumber,
      subtitle: `${q.customer.name} · ${formatINR(q.total)}`,
    })),
    ...packages.map((p) => ({
      id: p.id,
      href: `/catalogues/${p.id}`,
      kind: "catalogue" as const,
      title: p.name,
      subtitle: formatINR(p.basePrice),
    })),
  ];

  return NextResponse.json({ hits });
}
