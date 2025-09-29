// api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Helper: who is allowed to mutate events.
 * Returns true only for 'admin' or 'officer' roles.
 */
function canMutate(role?: string | null) {
  return role === "admin" || role === "officer";
}

/**
 * Helper: validate path param 'id' and coerce to number.
 * Throws a Response(400) if the value isn't an integer.
 * (Throwing a Response lets callers `catch` and return it directly.)
 */
function toId(v: string) {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Response("Bad id", { status: 400 });
  return n;
}

/**
 * GET /api/events/[id]
 * Fetch a single event row by numeric id.
 * - 404 if not found
 * - 500 on unexpected errors
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = toId(params.id);
    const ev = await prisma.event.findUnique({ where: { id } });
    if (!ev) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json(ev);
  } catch (err) {
    if (err instanceof Response) return err; // return the 400 from toId()
    console.error("GET /api/events/[id] error", err);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

/**
 * PATCH /api/events/[id]
 * Update selected fields of an existing event (in-place UPDATE).
 * Security:
 *  - requires a signed-in session
 *  - requires role admin/officer (see canMutate)
 *
 * Body allows partial updates. Only whitelisted fields are copied into `data`.
 * startTime/endTime are validated as Date; rejects invalid timestamps.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate and authorize
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    if (!canMutate(session.user.role)) return new NextResponse("Forbidden", { status: 403 });

    const id = toId(params.id);
    const body = await req.json();

    // Build an update payload only from fields that were provided
    const data: any = {};
    if (body.title !== undefined)       data.title = String(body.title);
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.location !== undefined)    data.location = body.location ?? null;
    if (body.isAllDay !== undefined)    data.isAllDay = !!body.isAllDay;

    if (body.startTime !== undefined) {
      // NOTE: new Date(string) depends on the string format:
      //  - "2025-09-23T10:00:00Z" is parsed as UTC
      //  - "2025-09-23T10:00" (no 'Z') is parsed as LOCAL TIME on the server
      // Consider always sending ISO with timezone to avoid drift.
      const d = new Date(body.startTime);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
      data.startTime = d;
    }

    if (body.endTime !== undefined) {
      const d = new Date(body.endTime);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid endTime" }, { status: 400 });
      data.endTime = d;
    }

    // No-op PATCH -> return ok without hitting the DB
    if (Object.keys(data).length === 0) return NextResponse.json({ ok: true });

    // Update the existing row IN PLACE (overwrites prior values)
    const ev = await prisma.event.update({ where: { id }, data });
    return NextResponse.json(ev);
  } catch (err) {
    if (err instanceof Response) return err; // e.g., 400 from toId()
    console.error("PATCH /api/events/[id] error", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id]
 * Hard-delete the event row.
 * Security mirrors PATCH: session + role check.
 * Returns 204 on success.
 */
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
