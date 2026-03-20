"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PosItemType = "FISH" | "SHRIMP" | "COMBO";
type PosSideType = "POTATO_SALAD" | "COLESLAW";
type PosOrderStatus = "OPEN" | "COMPLETED" | "CANCELLED";

type PosOrderItem = {
  id: string;
  itemType: PosItemType;
  sideType: PosSideType;
  quantity: number;
  createdAt: string;
  notes?: string | null;
};

type PosOrder = {
  id: string;
  serviceDate: string;
  orderNumber: number;
  customerName: string | null;
  status: PosOrderStatus;
  submittedBy: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: PosOrderItem[];
};

function formatItemType(itemType: PosItemType) {
  switch (itemType) {
    case "FISH":
      return "Fish";
    case "SHRIMP":
      return "Shrimp";
    case "COMBO":
      return "Combo";
    default:
      return itemType;
  }
}

function formatSideType(sideType: PosSideType) {
  switch (sideType) {
    case "POTATO_SALAD":
      return "Potato Salad";
    case "COLESLAW":
      return "Coleslaw";
    default:
      return sideType;
  }
}

function formatTime(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CompletedOrdersBoard() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/pos/orders?status=COMPLETED", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch completed orders");
      }

      const data: PosOrder[] = await res.json();

      const completedOrders = data
        .filter((order) => order.status === "COMPLETED")
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.updatedAt).getTime() -
            new Date(a.completedAt || a.updatedAt).getTime(),
        );

      setOrders(completedOrders);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load completed orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    fetchCompletedOrders();
  }, [expanded, fetchCompletedOrders]);

  const completedCount = useMemo(() => orders.length, [orders]);

  return (
    <div className="mt-4">
      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h3 className="h5 mb-1">Completed Orders</h3>
              <p className="text-muted mb-0">
                View completed orders from today if the kitchen needs to
                double-check something.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-secondary fs-6">
                {completedCount} completed
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "Hide Completed Orders" : "Show Completed Orders"}
              </button>
            </div>
          </div>

          {expanded ? (
            <div className="mt-4">
              {loading ? (
                <div className="alert alert-light border mb-0">
                  Loading completed orders...
                </div>
              ) : error ? (
                <div className="alert alert-danger mb-0">{error}</div>
              ) : orders.length === 0 ? (
                <div className="alert alert-light border mb-0">
                  No completed orders yet today.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {orders.map((order) => (
                    <div key={order.id} className="card border-success-subtle">
                      <div className="card-body">
                        <div className="row g-4">
                          <div className="col-lg-9">
                            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                              <span className="badge text-bg-dark fs-5 px-3 py-2">
                                #{order.orderNumber}
                              </span>
                              <span className="badge text-bg-success px-3 py-2">
                                Completed
                              </span>
                              <span className="text-muted">
                                {formatTime(order.completedAt)}
                              </span>
                            </div>

                            <div className="row mb-3">
                              <div className="col-md-6 mb-2 mb-md-0">
                                <strong>Customer:</strong>{" "}
                                {order.customerName || "Walk-up"}
                              </div>
                              <div className="col-md-6">
                                <strong>Submitted by:</strong>{" "}
                                {order.submittedBy || "Unknown"}
                              </div>
                            </div>

                            <div className="card bg-light border-0">
                              <div className="card-body">
                                <h6 className="card-title mb-3">Order Items</h6>

                                <div className="d-flex flex-column gap-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="border rounded p-3 bg-white"
                                    >
                                      <div className="fw-bold fs-5">
                                        {item.quantity} ×{" "}
                                        {formatItemType(item.itemType)}
                                      </div>
                                      <div className="text-muted">
                                        Side: {formatSideType(item.sideType)}
                                      </div>

                                      {item.notes ? (
                                        <div className="alert alert-warning mt-3 mb-0 py-2">
                                          <strong>Item Note:</strong>{" "}
                                          {item.notes}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="col-lg-3">
                            <div className="border rounded p-3 bg-light">
                              <div className="small text-muted mb-1">
                                Completed At
                              </div>
                              <div className="fw-semibold">
                                {formatTime(order.completedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
