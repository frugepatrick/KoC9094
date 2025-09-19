import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function monthBoundsUTC(ym?: string) {
  const now = new Date();
  const [Y, M] = (ym || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-").map(Number);
  if (!Y || !M) throw new Error("Bad month param; expected YYYY-MM");
  const start = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(Y, M,     1, 0, 0, 0)); // exclusive
  return { start, end, ym: `${Y}-${String(M).padStart(2, "0")}` };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("month") || undefined;
    const debug = searchParams.get("debug") === "1";
    const { start, end, ym: resolved } = monthBoundsUTC(ym);

    const where: Prisma.VolunteerHourWhereInput = { date: { gte: start, lt: end } };

    // 1) group by member + category
    const grouped = await prisma.volunteerHour.groupBy({
      by: ["memberId", "category"],
      where,
      _sum: { hours: true },
      orderBy: [{ memberId: "asc" }, { category: "asc" }],
    });

    // 2) fetch member display info
    const memberIds = Array.from(new Set(grouped.map(g => g.memberId)));
    const members = memberIds.length
      ? await prisma.members.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, firstname: true, lastname: true }, // no email/description here
        })
      : [];
    const mIndex = new Map(members.map(m => [m.id, m]));

    // 3) for each group, get the latest description within the month
    //    (N+1; fine for small sets. if it grows, we can batch this later)
    const rows = await Promise.all(grouped.map(async (g) => {
      const latest = await prisma.volunteerHour.findFirst({
        where: {
          memberId: g.memberId,
          category: g.category,
          date: { gte: start, lt: end },
        },
        orderBy: [{ date: "desc" }, { id: "desc" }],
        select: { description: true },
      });

      const m = mIndex.get(g.memberId);
      const total = Number(g._sum?.hours ?? 0);
      const name = m ? `${m.firstname ?? ""} ${m.lastname ?? ""}`.trim() : "";

      return {
        memberId: g.memberId,
        memberName: name || `Member #${g.memberId}`,
        description: latest?.description ?? null, // <-- from hours, not members
        category: g.category,
        totalHours: Number.isFinite(total) ? total : 0,
      };
    }));

    const payload: any = { month: resolved, rows };
    if (debug) payload.debug = { utcRange: { start: start.toISOString(), end: end.toISOString() } };

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to build monthly-hours report", { status: 500 });
  }
}
