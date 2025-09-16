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

  const memberIds = grouped.map(g => g.memberId);
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, firstname: true, lastname: true, email: true },
  });
  const mIndex = new Map(members.map(m => [m.id, m]));

  const header = ["Month","Member ID","Name","Email","Total Hours"];
  const lines = [header.join(",")];
  for (const g of grouped) {
    const m = mIndex.get(g.memberId);
    const name = m ? `${m.firstname} ${m.lastname}`.trim() : `Member #${g.memberId}`;
    const email = m?.email || "";
    const total = Number(g._sum.hours ?? 0).toFixed(2);
    lines.push([resolved, String(g.memberId), `"${name.replaceAll('"','""')}"`, email, total].join(","));
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-hours-${resolved}.csv"`,
    },
  });
}
