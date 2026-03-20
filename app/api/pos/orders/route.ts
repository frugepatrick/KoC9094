import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { PosOrderStatus, Prisma } from "@prisma/client";

function canMutate(role?: string | null) {
  return role === "admin" || role === "officer" || role === "member";
}

type PosOrderItemInput = {
  itemType: "FISH" | "SHRIMP" | "COMBO";
  sideType: "POTATO_SALAD" | "COLESLAW";
  quantity: number;
  notes?: string | "";
};

function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfTomorrow(today: Date) {
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  return d;
}

function getSqlDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") ?? "OPEN";

    const validStatuses = ["OPEN", "COMPLETED", "CANCELLED"] as const;
    const status = validStatuses.includes(
      statusParam as (typeof validStatuses)[number],
    )
      ? (statusParam as PosOrderStatus)
      : "OPEN";

    const today = getStartOfToday();
    const tomorrow = getStartOfTomorrow(today);

    const orders = await prisma.posOrder.findMany({
      where: {
        status,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/pos/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!canMutate(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const items = (body.items ?? []) as PosOrderItemInput[];

    if (!items.length) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    const invalidItem = items.find(
      (item) =>
        !item.itemType ||
        !item.sideType ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1,
    );

    if (invalidItem) {
      return NextResponse.json(
        {
          error:
            "Each item must include a valid item type, side, and quantity.",
        },
        { status: 400 },
      );
    }

    const today = getStartOfToday();
    const sqlToday = getSqlDateString(today);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await prisma.$queryRaw<
          Array<{ maxOrderNumber: number | null }>
        >`
          SELECT MAX(order_number) AS maxOrderNumber
          FROM orders
          WHERE service_date = ${sqlToday}
        `;

        const nextOrderNumber = (result[0]?.maxOrderNumber ?? 0) + 1;

        const ord = await prisma.posOrder.create({
          data: {
            serviceDate: today,
            orderNumber: nextOrderNumber,
            customerName: body.customerName?.trim() || null,
            status: "OPEN",
            submittedBy: session.user.name ?? "unknown",
            items: {
              create: items.map((item) => ({
                itemType: item.itemType,
                sideType: item.sideType,
                quantity: Number(item.quantity),
                notes: item.notes?.trim() || "",
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return NextResponse.json(
          {
            id: ord.id,
            orderNumber: ord.orderNumber,
            status: ord.status,
          },
          { status: 201 },
        );
      } catch (error) {
        const isUniqueError =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";

        if (isUniqueError && attempt < maxAttempts) {
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json(
      { error: "Failed to create order after multiple attempts." },
      { status: 500 },
    );
  } catch (err) {
    console.error("POST /api/pos/orders", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
