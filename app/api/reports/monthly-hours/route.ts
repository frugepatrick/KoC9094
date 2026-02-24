import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function monthBoundsUTC(ym?: string) {
  const now = new Date();
  const [Y, M] = (ym || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  if (!Y || !M) throw new Error("Bad month param; expected YYYY-MM");

  const start = new Date(Date.UTC(Y, M - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(Y, M, 1, 0, 0, 0)); // exclusive
  return { start, end, ym: `${Y}-${String(M).padStart(2, "0")}` };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("month") || undefined;
    const debug = searchParams.get("debug") === "1";
    const { start, end, ym: resolved } = monthBoundsUTC(ym);

    const where: Prisma.VolunteerHourWhereInput = { date: { gte: start, lt: end } };

    // Pull all submissions (no grouping)
    const submissions = await prisma.volunteerHour.findMany({
      where,
      orderBy: [{ date: "asc" }, { id: "asc" }],
      select: {
        id: true,
        date: true,
        memberId: true,
        category: true,
        subcategory: true,
        description: true,
        numberOfVolunteers: true,
        hours: true,
      },
    });

    // Fetch member names for those submissions
    const memberIdsNum = Array.from(new Set(submissions.map(s => Number(s.memberId))))
      .filter(n => Number.isInteger(n));

    const members = memberIdsNum.length
      ? await prisma.members.findMany({
          where: { memberid: { in: memberIdsNum } },
          select: { memberid: true, firstname: true, lastname: true },
        })
      : [];

    const mIndex = new Map(members.map(m => [String(m.memberid), m]));

    const rows = submissions.map(s => {
      const m = mIndex.get(String(s.memberId));
      const name = m ? `${m.firstname ?? ""} ${m.lastname ?? ""}`.trim() : "";
      return {
        ...s,
        memberName: name || `Member#: ${s.memberId}`,
      };
    });

    const payload: any = { month: resolved, rows };
    if (debug) payload.debug = { utcRange: { start: start.toISOString(), end: end.toISOString() } };

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return new NextResponse(e?.message || "Failed to build monthly-hours report", { status: 500 });
  }
}