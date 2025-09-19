import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---- Make this route always dynamic / never cached by Next ----
export const dynamic = "force-dynamic";  // disable static optimization
export const revalidate = 0;             // no ISR
export const fetchCache = "force-no-store";
export const runtime = "nodejs";         // avoid edge caching nuances

export async function GET() {
  try {
    // Use Prisma's connection (not the mysql2 pool)
    const rows = await prisma.$queryRawUnsafe<{ date: Date; notes: string }[]>(
      "SELECT `date`, `notes` FROM `meeting_notes` ORDER BY `date` DESC"
    );

    // Belt & suspenders: set no-cache headers for browsers/proxies/CDNs
    return NextResponse.json(rows ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Surrogate-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/getNotes (prisma) error:", err);
    // Keep the array shape so your UI doesn't crash; still no-store.
    return NextResponse.json([], {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Surrogate-Control": "no-store",
      },
    });
  }
}
