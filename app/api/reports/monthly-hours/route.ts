import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// UTC month bounds to avoid tz off-by-one
function monthBoundsUTC(ym?: string) {
  const now = new Date();
  const [Y, M] = (ym || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  if (!Y || !M) throw new Error("Bad month param; expected YYYY-MM");
  const start = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(Y, M, 1, 0, 0, 0)); // first day of next month (exclusive)
  return { start, end, ym: `${Y}-${String(M).padStart(2, "0")}` };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("month") || undefined;
    const debug = searchParams.get("debug") === "1";
    const { start, end, ym: resolved } = monthBoundsUTC(ym);

    // Your column is `date` (NOT NULL)
    const where: Prisma.VolunteerHourWhereInput = {
      date: { gte: start, lt: end },
    };

    const [anyCount, rangeCount] = await Promise.all([
      prisma.volunteerHour.count(),
      prisma.volunteerHour.count({ where }),
    ]);

    const grouped = await prisma.volunteerHour.groupBy({
      by: ["memberId"],
      where,
      _sum: { hours: true },
      orderBy: { memberId: "asc" },
    });

    const memberIds = grouped.map(g => g.memberId);
    const members = memberIds.length
      ? await prisma.members.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, firstname: true, lastname: true, email: true }, // your fields
        })
      : [];
    const mIndex = new Map(members.map(m => [m.id, m]));

    const rows = grouped.map(g => {
      const m = mIndex.get(g.memberId);
      const total = Number(g._sum?.hours ?? 0);
      const name = m ? `${m.firstname ?? ""} ${m.lastname ?? ""}`.trim() : "";
      return {
        memberId: g.memberId,
        memberName: name || `Member #${g.memberId}`,
        email: m?.email ?? null,
        totalHours: Number.isFinite(total) ? total : 0,
      };
    });

    const payload: any = { month: resolved, rows };
    if (debug) payload.debug = { utcRange: { start: start.toISOString(), end: end.toISOString() }, table: { anyCount, rangeCount } };

    return NextResponse.json(payload);
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to build monthly-hours report", { status: 500 });
  }
}
