'use client';

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type HourRow = {
  id: number;
  memberId: number | string;
  date?: string; 
  workdate?: string;            // ISO
  hours: string | number;       // Prisma Decimal may come as string; cast to number
  description: string | null;
  category: "COMMUNITY" | "FAITH" | "LIFE" | "FAMILY" | "PATRIOTISM";
  createdAt: string;
};

export default function VolunteerHoursCard() {
  const { data: session } = useSession();
  const [rows, setRows] = useState<HourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  // default range: current year
  const { from, to } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
  }, []);

  function parseDateLike(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();

  // "2025-09-14"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s);
  // millis
  const n = Number(s);
  if (Number.isFinite(n)) return new Date(n);

  return null;
}


  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/hours?from=${from}&to=${to}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load hours (${res.status})`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load hours");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const totalHours = rows.reduce((acc, r) => acc + Number(r.hours || 0), 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;    
    const fd = new FormData(e.currentTarget);

    const payload = {
      workDate: String(fd.get("workDate") || ""),
      hours: Number(fd.get("hours") || 0),
      description: String(fd.get("description") || "") || null,
      category: String(fd.get("category") || "" || null,)
    };
    if (!payload.workDate || !payload.hours) {
      alert("Please provide a date and hours.");
      return;
    }
    const res = await fetch("/api/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(`Failed to submit hours. ${msg || ""}`);
      return;
    }
    form.reset();
    load();
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="h5 m-0">Volunteer Hours</h3>
          <span className="badge text-bg-primary">Total YTD: {totalHours.toFixed(2)}</span>
        </div>

        {loading && <div className="text-muted">Loading…</div>}
        {err && <div className="text-danger">{err}</div>}

        {!!session?.user && (
          <>
            <button
              className="btn btn-sm btn-primary mb-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#addHoursCollapse"
              aria-expanded="false"
              aria-controls="addHoursCollapse"
            >
              Add Hours
            </button>

            <div className="collapse mb-3" id="addHoursCollapse">
              <form onSubmit={handleSubmit}>
                <div className="row g-2">
                  <div className="col-2 col-md-3">
                    <label className="form-label">Date</label>
                    <input name="workDate" type="date" className="form-control" required />
                  </div>
                  <div className="col-2 col-md-3">
                    <label className="form-label">Total Hours</label>
                    <input name="hours" type="number" step="0.25" min="0" className="form-control" required />
                  </div>
                  <div className="col-2 col-md-3">
                    <label className="form-label">Category</label>
                    <select name="category" className="form-select" required defaultValue="">
                      <option value="" disabled>Select a category…</option>
                      <option value="COMMUNITY">Community</option>
                      <option value="FAITH">Faith</option>
                      <option value="LIFE">Life</option>
                      <option value="FAMILY">Family</option>
                      <option value="PATRIOTISM">Patriotism</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Description (optional)</label>
                    <input name="description" className="form-control" placeholder="What did you work on?" />
                  </div>
                </div>
                <div className="mt-2">
                  <button className="btn btn-primary" type="submit">Submit</button>
                </div>
              </form>
            </div>
          </>
        )}

      {!loading && rows.length > 0 && (
        <div className="list-group list-group-flush">
          {rows.slice(0, 5).map((r) => {
            const dt = parseDateLike((r as any).date ?? (r as any).workDate ?? r.createdAt);
            return (
              <div key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">
                    {dt ? dt.toLocaleDateString() : "—"} · {Number(r.hours || 0).toFixed(2)} hrs
                  </div>
                  {r.description && <div className="small text-muted">{r.description}</div>}
                </div>
                {/* no status pill anymore */}
              </div>
            );
          })}
        </div>
)}


        {!loading && rows.length === 0 && (
          <div className="text-muted">No hours submitted yet.</div>
        )}
      </div>
    </div>
  );
}
