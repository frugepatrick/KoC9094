import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const role = (session.user as any).role;
  const isAdmin = role === "admin" || role === "officer";
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);

  const isDigits = /^\d+$/.test(q);

  const results = await prisma.members.findMany({
    where: isDigits
      ? { memberid: Number(q) }
      : {
          OR: [
            { firstname: { contains: q } },
            { lastname: { contains: q } },
            // optional: if you want email search
            { email: { contains: q } },
          ],
        },
    select: { id: true, memberid: true, firstname: true, lastname: true },
    take: 10,
    orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
  });

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
