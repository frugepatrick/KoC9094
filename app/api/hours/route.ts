import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: build [from, to] as an inclusive date range on workDate
function rangeFilter(from?: string | null, to?: string | null) {
  if (!from || !to) return {};
  // Interpret inputs as YYYY-MM-DD in UTC; make "to" inclusive by using next day (half-open interval)
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
      where: {
        memberId,
        ...rangeFilter(from, to),
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      // select specific fields if needed
      // select: { id: true, workDate: true, hours: true, description: true, memberId: true, createdAt: true },
    });

    return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
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

    // Expect the same keys the client sends:
    const { workDate, hours, description } = await req.json();

    // Validate minimal shape
    if (!workDate || typeof hours !== "number" || hours <= 0) {
      return new NextResponse("Bad Request: invalid workDate/hours", { status: 400 });
    }

    const created = await prisma.volunteerHour.create({
      data: {
        memberId,
        date: new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(workDate)
            ? `${workDate}T00:00:00Z`
            : workDate
        ),
        hours,
        description: description ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
