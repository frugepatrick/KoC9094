"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  notes: string | null;
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

function formatAge(dateString: string) {
  const created = new Date(dateString).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - created) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function OpenOrdersBoard() {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    audioRef.current = new Audio("/sounds/order-ping.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const fetchOpenOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/orders?status=OPEN", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch open orders");
      }

      const data: PosOrder[] = await res.json();

      const openOrders = data
        .filter((order) => order.status === "OPEN")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      const currentIds = new Set(openOrders.map((order) => order.id));
      const previousIds = previousIdsRef.current;

      const justArrivedIds = openOrders
        .filter((order) => !previousIds.has(order.id))
        .map((order) => order.id);

      if (previousIds.size > 0 && justArrivedIds.length > 0) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        setNewOrderIds((prev) => {
          const next = new Set(prev);
          for (const id of justArrivedIds) next.add(id);
          return next;
        });

        window.setTimeout(() => {
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            for (const id of justArrivedIds) next.delete(id);
            return next;
          });
        }, 3500);
      }

      previousIdsRef.current = currentIds;
      setOrders(openOrders);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load open orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenOrders();

    const interval = window.setInterval(() => {
      fetchOpenOrders();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchOpenOrders]);

  async function handleComplete(orderId: string) {
    try {
      setCompletingIds((prev) => new Set(prev).add(orderId));
      setOrders((prev) => prev.filter((order) => order.id !== orderId));

      const res = await fetch(`/api/pos/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete order");
      }

      fetchOpenOrders();
    } catch (err) {
      console.error(err);
      setError("Failed to complete order.");
      fetchOpenOrders();
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  const activeOrderCount = useMemo(() => orders.length, [orders]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="alert alert-secondary mb-0">Loading open orders...</div>
      </div>
    );
  }

  return (
    <section className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-1">Open Orders</h2>
          <p className="text-muted mb-0">
            Only open orders are shown here. New orders appear at the bottom.
          </p>
        </div>

        <div className="badge text-bg-dark fs-6 px-3 py-2">
          {activeOrderCount} open {activeOrderCount === 1 ? "order" : "orders"}
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {orders.length === 0 ? (
        <div className="alert alert-light border text-center py-5">
          <h4 className="mb-2">No open orders</h4>
          <div className="text-muted">
            New tickets will appear here automatically.
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          <AnimatePresence initial={false}>
            {orders.map((order) => {
              const isNew = newOrderIds.has(order.id);
              const isCompleting = completingIds.has(order.id);

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div
                    className={`card ${isNew ? "border-success" : ""}`}
                    style={{
                      opacity: isCompleting ? 0.6 : 1,
                      pointerEvents: isCompleting ? "none" : "auto",
                      boxShadow: isNew
                        ? "0 0 0 0.25rem rgba(25, 135, 84, 0.15)"
                        : undefined,
                    }}
                  >
                    <div className="card-body">
                      <div className="row g-4">
                        <div className="col-lg-9">
                          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                            <span className="badge text-bg-dark fs-4 px-3 py-2">
                              #{order.orderNumber}
                            </span>

                            {isNew ? (
                              <span className="badge text-bg-success px-3 py-2">
                                New
                              </span>
                            ) : null}

                            <span className="text-muted">
                              {formatAge(order.createdAt)}
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

                          <div className="card bg-light border-0 mb-3">
                            <div className="card-body">
                              <h6 className="card-title mb-3">Order Items</h6>

                              <div className="d-flex flex-column gap-2">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="border rounded p-3 bg-white"
                                  >
                                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                      <div>
                                        <div className="fw-bold fs-5">
                                          {item.quantity} ×{" "}
                                          {formatItemType(item.itemType)}
                                        </div>
                                        <div className="text-muted">
                                          Side: {formatSideType(item.sideType)}
                                        </div>
                                      </div>
                                    </div>

                                    {item.notes ? (
                                      <div className="alert alert-warning mt-3 mb-0 py-2">
                                        <strong>Item Note:</strong> {item.notes}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {order.notes ? (
                            <div className="alert alert-warning mb-0">
                              <strong>Order Notes:</strong> {order.notes}
                            </div>
                          ) : null}
                        </div>

                        <div className="col-lg-3 d-flex align-items-start">
                          <button
                            type="button"
                            onClick={() => handleComplete(order.id)}
                            disabled={isCompleting}
                            className="btn btn-success btn-lg w-100"
                          >
                            {isCompleting ? "Completing..." : "Mark Completed"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
