'use client';
import { useEffect, useState } from "react";
import VolunteerHoursCard from "@/app/components/VolunteerHoursCard";

type Row = {
  memberId: string;                 // string, not number
  memberName: string;
  description: string | null;
  category: string;
  totalHours: number;
};

const LABELS: Record<string,string> = {
  COMMUNITY: "Community",
  FAITH: "Faith",
  LIFE: "Life",
  FAMILY: "Family",
  PATRIOTISM: "Patriotism",
};

function truncateWords(text: string, maxWords = 20) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

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
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
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
            <input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button className="btn btn-secondary mb-1" onClick={() => load()}>Refresh</button>
          <a className="btn btn-outline-primary mb-1" href={`/api/reports/monthly-report.csv?month=${encodeURIComponent(month)}`}>
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
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th style={{minWidth: 180}}>Member</th>
                      <th style={{minWidth: 320}}>Description</th>
                      <th>Category</th>
                      <th className="text-end">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const full = r.description ?? "";
                      const preview = full ? truncateWords(full, 20) : "";
                      return (
                        <tr key={`${r.memberId}-${r.category}`}>
                          <td>{r.memberName}</td>
                          <td title={full}>{preview}</td> {/* hover shows full */}
                          <td>{LABELS[r.category] ?? r.category}</td>
                          <td className="text-end">{r.totalHours.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <div>
        <VolunteerHoursCard mode="admin"/>
      </div>
    </div>
  );
}
