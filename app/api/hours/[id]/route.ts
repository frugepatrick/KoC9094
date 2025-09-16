import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const id = Number(params.id);
    if (!Number.isInteger(id)) return new NextResponse("Bad id", { status: 400 });

    const body = await req.json();
    const { date, hours, notes } = body;

    // Ensure user owns this row (admins can be allowed below if you want)
    const existing = await prisma.volunteerHour.findUnique({ where: { id } });
    if (!existing) return new NextResponse("Not found", { status: 404 });
    if (existing.memberId !== session.user.id /* && session.user.role !== 'admin' */) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await prisma.volunteerHour.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(typeof hours === "number" ? { hours } : {}),
        ...(body.hasOwnProperty("notes") ? { notes: notes ?? null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
