import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function monthBounds(ym?: string) {
  const now = new Date();
  const [Y, M] = (ym || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`).split("-").map(Number);
  const start = new Date(Y, (M - 1), 1, 0, 0, 0);
  const end   = new Date(Y, (M - 1) + 1, 1, 0, 0, 0);
  return { start, end, ym: `${Y}-${String(M).padStart(2,"0")}` };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("month") || undefined;
  const { start, end, ym: resolved } = monthBounds(ym);

  const grouped = await prisma.volunteerHour.groupBy({
    by: ["memberId"],
    where: { date: { gte: start, lt: end } },
    _sum: { hours: true },
    orderBy: { memberId: "asc" },
  });

  const memberIdsRaw = Array.from(new Set(grouped.map(g => g.memberId)));

    // Coerce to numbers for Prisma (since members.memberid is Int)
  const memberIdsNum = memberIdsRaw
  .map(v => (typeof v === "number" ? v : Number(String(v))))
  .filter(n => Number.isInteger(n)); // keep only valid ints

  const members = await prisma.members.findMany({
    where: { memberid: { in: memberIdsNum } },
    select: { memberid: true, firstname: true, lastname: true },
  });
  const mIndex = new Map(members.map(m => [String(m.memberid), m]));

  const header = ["Month","Member ID","Name","Total Hours"];
  const lines = [header.join(",")];

  for (const g of grouped) {
    const m = mIndex.get(String(g.memberId));
    const name = m ? `${m.firstname} ${m.lastname}`.trim() : `Member#: ${g.memberId}`;
    const total = Number(g._sum.hours ?? 0).toFixed(2);
    lines.push([resolved, String(g.memberId), `"${name.replaceAll('"','""')}"`, total].join(","));
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-hours-${resolved}.csv"`,
    },
  });
}
