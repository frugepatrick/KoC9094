import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { PosOrderStatus } from "@prisma/client";

function canMutate(role?: string | null) {
  return role === "admin" || role === "officer" || role === "member";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!canMutate(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const status = body.status as PosOrderStatus;

    const validStatuses: PosOrderStatus[] = ["OPEN", "COMPLETED", "CANCELLED"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 },
      );
    }

    const updated = await prisma.posOrder.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/fishfry/pos/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}