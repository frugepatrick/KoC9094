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
  const end = new Date(Date.UTC(Y, M, 1, 0, 0, 0));
  return { start, end, ym: `${Y}-${String(M).padStart(2, "0")}` };
}

function csvCell(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("month") || undefined;
  const { start, end, ym: resolved } = monthBoundsUTC(ym);

  const where: Prisma.VolunteerHourWhereInput = { date: { gte: start, lt: end } };

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

  const memberIdsNum = Array.from(new Set(submissions.map(s => Number(s.memberId))))
    .filter(n => Number.isInteger(n));

  const members = memberIdsNum.length
    ? await prisma.members.findMany({
        where: { memberid: { in: memberIdsNum } },
        select: { memberid: true, firstname: true, lastname: true },
      })
    : [];

  const mIndex = new Map(members.map(m => [String(m.memberid), m]));

  const header = [
    "Month",
    "Name",
    "Category",
    "Subcategory",
    "Description",
    "Number of Extra Volunteers",
    "Hours"
  ];

  const lines = [header.join(",")];

  for (const s of submissions) {
    const m = mIndex.get(String(s.memberId));
    const name = m ? `${m.firstname ?? ""} ${m.lastname ?? ""}`.trim() : `Member#: ${s.memberId}`;

    lines.push(
      [
        csvCell(resolved),
        csvCell(name),
        csvCell(s.category),
        csvCell(s.subcategory ?? ""),
        csvCell(s.description ?? ""),
        csvCell(s.numberOfVolunteers ?? 0),
        String(Number(s.hours ?? 0)),
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-hours-${resolved}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}