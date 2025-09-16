import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // ensure your session includes memberId
    const memberId = (session.user as any).memberId;
    if (!memberId) return new NextResponse("Missing memberId on session", { status: 400 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      memberId,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    };

    const items = await prisma.volunteerHour.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }],
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

    // IMPORTANT: use memberId from session, not user.id
    const memberId = (session.user as any).memberId;
    if (!memberId) return new NextResponse("Missing memberId on session", { status: 400 });

    const { date, hours, notes } = await req.json();
    if (!date || typeof hours !== "number" || hours <= 0) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const created = await prisma.volunteerHour.create({
      data: {
        memberId,
        date: new Date(date),
        hours,
        description: notes ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
