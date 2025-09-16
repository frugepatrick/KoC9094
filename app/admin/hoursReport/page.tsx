'use client';
import { useEffect, useState } from "react";

type Row = { memberId: number; memberName: string; email: string | null; totalHours: number; };

export default function MonthlyHoursReport() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(m = month) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reports/monthly-hours?month=${encodeURIComponent(m)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${text || "Failed to load monthly report"}`);
      }
      const data = await res.json().catch(() => ({}));
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e: any) {
      console.error("monthly-hours load error:", e);
      setErr(e?.message || "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const grandTotal = rows.reduce((a, r) => a + (r.totalHours || 0), 0);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex gap-2 align-items-end mb-3">
          <div>
            <label className="form-label">Month</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary mb-1" onClick={() => load()}>Refresh</button>
          <a className="btn btn-outline-primary mb-1" href={`/api/reports/monthly-hours.csv?month=${encodeURIComponent(month)}`}>
            Download CSV
          </a>
        </div>

        {loading && <div className="text-muted">Loading…</div>}
        {err && <div className="text-danger">{err}</div>}

        {!loading && !err && (
          <>
            <div className="mb-2 fw-semibold">Grand Total: {grandTotal.toFixed(2)} hrs</div>
            {rows.length === 0 ? (
              <div className="text-muted">No hours found for {month}.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th className="text-end">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.memberId}>
                        <td>{r.memberName}</td>
                        <td>{r.email || ""}</td>
                        <td className="text-end">{r.totalHours.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
