// app/admin/fishfry/pos/kitchen/page.tsx
"use client";

import Link from "next/link";
import OpenOrdersBoard from "@/app/components/fishfry/open-orders-board";
import CompletedOrdersBoard from "@/app/components/fishfry/completed-orders-board";

export default function FishFryKitchenPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kitchen Open Orders
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Live view of open fish fry orders
            </p>
          </div>

          <Link
            href="/admin/fishfry/pos"
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Back
          </Link>
        </div>

        <OpenOrdersBoard />
        <CompletedOrdersBoard />
      </div>
    </main>
  );
}
