import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// kill caching anywhere this runs
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const CATS = ["COMMUNITY","FAITH","LIFE","FAMILY","PATRIOTISM"] as const;
type Cat = (typeof CATS)[number];

// Helper: build [from, to] as an inclusive date range on date
function rangeFilter(from?: string | null, to?: string | null) {
  if (!from || !to) return {};
  const gte = new Date(`${from}T00:00:00Z`);
  const toStart = new Date(`${to}T00:00:00Z`);
  const lt = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
  return { date: { gte, lt } };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const memberId = (session.user as any).memberId;
    if (!memberId) return new NextResponse("Missing memberId on session", { status: 400 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const items = await prisma.volunteerHour.findMany({
      where: { memberId, ...rangeFilter(from, to) },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      select: { id: true, date: true, hours: true, description: true, memberId: true, category: true, createdAt: true },
    });

    return NextResponse.json(items, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } });
  } catch (e) {
    console.error(e);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const memberId = (session.user as any).memberId;
    if (!memberId) return new NextResponse("Missing memberId on session", { status: 400 });

    // Expect: { workDate: string(YYYY-MM-DD or ISO), hours: number, description?: string, category: "COMMUNITY"|"FAITH"|... }
    const { workDate, hours, description, category } = await req.json();

    if (!workDate || typeof hours !== "number" || hours <= 0) {
      return new NextResponse("Bad Request: invalid workDate/hours", { status: 400 });
    }
    const cat = String(category || "").toUpperCase() as Cat;
    if (!CATS.includes(cat)) {
      return new NextResponse("Bad Request: invalid category", { status: 400 });
    }

    const created = await prisma.volunteerHour.create({
      data: {
        memberId,
        date: new Date(/^\d{4}-\d{2}-\d{2}$/.test(workDate) ? `${workDate}T00:00:00Z` : workDate),
        hours,
        description: description ?? null,
        category: cat,
      },
      select: { id: true, date: true, hours: true, description: true, memberId: true, category: true, createdAt: true },
    });

    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
