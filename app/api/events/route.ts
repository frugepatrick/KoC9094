import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// roles in your app: "member" | "officer" | "admin" | "delegate"
function canMutate(role?: string | null) {
  return role === "admin" || role === "officer";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to)   where.startTime.lt  = new Date(to);
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    // Dates serialize to ISO; client can format
    return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /api/events error", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (!canMutate(session.user.role)) return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json();

    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const startTime = body.startTime ? new Date(body.startTime) : null;
    const endTime   = body.endTime   ? new Date(body.endTime)   : null;
    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: "Valid startTime and endTime are required" }, { status: 400 });
    }

    const ev = await prisma.event.create({
      data: {
        title,
        description: body.description ?? null,
        location: body.location ?? null,
        isAllDay: !!body.isAllDay,
        startTime,
        endTime,
        createdBy: session.user.memberId, // your DB stores memberId
        createdAt: new Date(),
      },
    });

    return NextResponse.json(ev, { status: 201 });
  } catch (err) {
    console.error("POST /api/events error", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
