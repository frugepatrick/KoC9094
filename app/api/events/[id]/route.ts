import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function canMutate(role?: string | null) {
  return role === "admin" || role === "officer";
}

function toId(v: string) {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Response("Bad id", { status: 400 });
  return n;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = toId(params.id);
    const ev = await prisma.event.findUnique({ where: { id } });
    if (!ev) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(ev);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/events/[id] error", err);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (!canMutate(session.user.role)) return new NextResponse("Forbidden", { status: 403 });

    const id = toId(params.id);
    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined)       data.title = String(body.title);
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.location !== undefined)    data.location = body.location ?? null;
    if (body.isAllDay !== undefined)    data.isAllDay = !!body.isAllDay;
    if (body.startTime !== undefined) {
      const d = new Date(body.startTime);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
      data.startTime = d;
    }
    if (body.endTime !== undefined) {
      const d = new Date(body.endTime);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid endTime" }, { status: 400 });
      data.endTime = d;
    }

    if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

    const ev = await prisma.event.update({ where: { id }, data });
    return NextResponse.json(ev);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("PATCH /api/events/[id] error", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (!canMutate(session.user.role)) return new NextResponse("Forbidden", { status: 403 });

    const id = toId(params.id);
    await prisma.event.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("DELETE /api/events/[id] error", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
