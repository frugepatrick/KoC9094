"use client";

import Link from "next/link";
import { useState } from "react";

type ItemType = "FISH" | "SHRIMP" | "COMBO";
type SideType = "POTATO_SALAD" | "COLESLAW";

type OrderItemInput = {
  itemType: ItemType;
  sideType: SideType;
  quantity: number | "";
  notes: string;
};

const FOOD_OPTIONS: { value: ItemType; label: string }[] = [
  { value: "FISH", label: "Fish" },
  { value: "SHRIMP", label: "Shrimp" },
  { value: "COMBO", label: "Combo" },
];

const SIDE_OPTIONS: { value: SideType; label: string }[] = [
  { value: "POTATO_SALAD", label: "Potato Salad" },
  { value: "COLESLAW", label: "Coleslaw" },
];

function createBlankItem(): OrderItemInput {
  return {
    itemType: "FISH",
    sideType: "POTATO_SALAD",
    quantity: "",
    notes: "",
  };
}

export default function FishFryOrderEntryPage() {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<OrderItemInput[]>([createBlankItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateItem<K extends keyof OrderItemInput>(
    index: number,
    field: K,
    value: OrderItemInput[K],
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, createBlankItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const cleanedItems = items.map((item) => ({
        itemType: item.itemType,
        sideType: item.sideType,
        quantity: Number(item.quantity),
        notes: item.notes.trim() || null,
      }));

      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim() || null,
          items: cleanedItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit order");
      }

      setSuccessMessage(`Order #${data.orderNumber} submitted successfully.`);
      setCustomerName("");
      setItems([createBlankItem()]);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1">Order Entry</h1>
          <p className="text-muted mb-0">
            Enter order details and submit to kitchen
          </p>
        </div>

        <Link href="/admin/fishfry/pos" className="btn btn-outline-secondary">
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            <div className="mb-4">
              <label className="form-label fw-semibold">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="form-control form-control-lg"
              />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-semibold mb-0">
                  Order Items
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-primary"
                >
                  Add Item
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded p-3 bg-light">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Food Type</label>
                        <select
                          value={item.itemType}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "itemType",
                              e.target.value as ItemType,
                            )
                          }
                          className="form-select form-select-lg"
                        >
                          {FOOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Side</label>
                        <select
                          value={item.sideType}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "sideType",
                              e.target.value as SideType,
                            )
                          }
                          className="form-select form-select-lg"
                        >
                          {SIDE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              e.target.value === ""
                                ? ""
                                : Math.max(1, Number(e.target.value)),
                            )
                          }
                          className="form-control form-control-lg"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Item Notes</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) =>
                            updateItem(index, "notes", e.target.value)
                          }
                          placeholder="Example: extra crispy, no slaw, sauce on side"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="mt-3 text-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="btn btn-outline-danger"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {successMessage ? (
              <div className="alert alert-success">{successMessage}</div>
            ) : null}

            {errorMessage ? (
              <div className="alert alert-danger">{errorMessage}</div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-success btn-lg w-100"
            >
              {submitting ? "Submitting..." : "Submit Order"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
