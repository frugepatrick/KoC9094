'use client';

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from 'react-hot-toast';

type HourRow = {
  id: number;
  memberId: number | string;
  date?: string; 
  workdate?: string;            // ISO
  hours: string | number;       // Prisma Decimal may come as string; cast to number
  description: string | null;
  category: "COMMUNITY" | "FAITH" | "LIFE" | "FAMILY" | "PATRIOTISM";
  subcategory?: string | null;
  createdAt: string;
};

type MemberHit = {
  id: string;
  memberid: number;
  firstname: string;
  lastname: string;
};

type Category = HourRow["category"];

type HoursCreatePayload = {
  workDate: string;
  hours: number;
  description: string | null;
  category: Category;
  subcategory?: string | null;
  memberId?: string;
};

  const SUBCATEGORIES: Record<
    HourRow["category"], 
    {value: string; label: string}[]
    > = {
      FAITH: [
        {value: "Into the Breach", label: "Into the Breach"},
        {value: "Pilgrim Icon Program", label: "Pilgrim Icon Program"},
        {value: "Build the Domestic Church Kiosk", label: "Build the Domestic Church Kiosk"},
        {value: "Rosary", label: "Rosary"},
        {value: "Spiritual Reflection", label: "Spiritual Reflection"},
        {value: "Holy Hour", label: "Holy Hour"},
        {value: "Sacramental Gifts", label: "Sacramental Gifts"},
        {value: "RSVP", label: "RSVP"},
        {value: "Other", label: "Other"}
      ],
      COMMUNITY: [
        {value: "Family of the Month", label: "Family of the Month"},
        {value: "Keep Christ in Christmas", label: "Keep Christ in Christmas"},
        {value: "Family Fully Alive", label: "Family Fully Alive"},
        {value: "Consecration to the Holy Family", label: "Consecration to the Holy Family"},
        {value: "Family Prayer Night", label: "Family Prayer Night"},
        {value: "Good Friday Family Promotion", label: "Good Friday Family Promotion"},
        {value: "Food for Families", label: "Food for Families"},
        {value: "Other", label: "Other"}
      ],
      LIFE: [
        {value: "Disaster Prepardeness", label: "Disaster Prepardeness"},
        {value: "Free Throw Championship", label: "Free Throw Championship"},
        {value: "Soccer Challenge", label: "Soccer Challenge"},
        {value: "Helping Hands", label: "Helping Hands"},
        {value: "Catholic Citizenship Essay Contest", label: "Catholic Citizenship Essay Contest"},
        {value: "Coats for Kids", label: "Coats for Kids"},
        {value: "Global Wheelchair", label: "Global Wheelchair"},
        {value: "Habitat for Humanity", label: "Habitat for Humanity"},
        {value: "Other", label: "Other"},
      ],
      FAMILY: [
        {value: "Christian Refugee Relief", label: "Christian Refugee Relief"},
        {value: "Silver Rose", label: "Silver Rose"},
        {value: "Pregnancy Center Support/ ASAP", label: "Pregnancy Center Support/ ASAP"},
        {value: "Novena for Life", label: "Novena for Life"},
        {value: "Mass for People with Special Needs", label: "Mass for People with Special Needs"},
        {value: "March for Life", label: "March for Life"},
        {value: "Special Olympics", label: "Special Olympics"},
        {value: "Ultrasound Initiative", label: "Ultrasound Initiative"},
        {value: "Other", label: "Other"},
      ],
      PATRIOTISM: [
        {value: "Other", label: "Other"},
      ]
    };

export default function VolunteerHoursCard({mode = "user"} : {mode?: "user" | "admin"}) {

  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canUseAdminMode = mode === "admin" && (role === "admin" || role === "officer");

  const [rows, setRows] = useState<HourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // controlled form state
  const [category, setCategory] = useState<Category | "">("");
  const [subcategory, setSubcategory] = useState<string>("");
  // Reset subcat when you change cat
  useEffect(() => {
    setSubcategory("");
    }, [category]);

  //show subcategory based on category
  const subcategoryOptions = category ? SUBCATEGORIES[category] : [];

  //admin search state
  const [memberQuery, setMemberQuery] = useState("");
  const [memberHits, setMemberHits] = useState<MemberHit[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberHit | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
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

  // Debounced member search (admin only)
  useEffect(() => {
    if (!canUseAdminMode) return;

    const q = memberQuery.trim();
    if (q.length < 2) {
      setMemberHits([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setMemberLoading(true);
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (!res.ok) {
          setMemberHits([]);
          return;
        }
        const data = await res.json();
        setMemberHits(Array.isArray(data) ? data : []);
      } finally {
        setMemberLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [memberQuery, canUseAdminMode]);

  const totalHours = rows.reduce((acc, r) => acc + Number(r.hours || 0), 0);

  function getWorkDate(r: HourRow): Date | null {
  // handle common variants your API might return
  return (
    parseDateLike((r as any).workDate) || // if API returns workDate (camelCase)
    parseDateLike(r.workdate) ||          // if your type uses workdate
    parseDateLike(r.date) ||              // fallback
    null
  );
}

  const sortedRows = useMemo(() => {
  return [...rows].sort((a, b) => {
    const ad = getWorkDate(a)?.getTime() ?? 0;
    const bd = getWorkDate(b)?.getTime() ?? 0;
    return bd - ad;
  });
}, [rows]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;    
    const fd = new FormData(e.currentTarget);

    const payload: HoursCreatePayload = {
      workDate: String(fd.get("workDate") || ""),
      hours: Number(fd.get("hours") || 0),
      description: String(fd.get("description") || "") || null,
      category: String(fd.get("category") || "") as Category,      
    };

    if (canUseAdminMode) {
      payload.subcategory = String(fd.get("subcategory") || "" || null);
      // choose what to store in volunteer_hours.member_id
      // If you want to store the KofC member number:
      payload.memberId = selectedMember ? String(selectedMember.memberid) : "";
    }
    if (!canUseAdminMode) {
      payload.subcategory = "Other";
    }
    if (!payload.workDate || !payload.hours || !payload.category) {
      alert("Please provide a date, hours, and category.");
      return;
    }
    if (canUseAdminMode && (!payload.subcategory || !payload.memberId)) {
      alert("Admin: please select member + subcategory.");
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
    toast.success("Volunteer Hours Creation was Successful");
    form.reset();
    setCategory("");
    setSubcategory("");
    setMemberQuery("");
    setMemberHits([]);
    setSelectedMember(null);
    load();
  }

  const showList = mode !== "admin"; //hide the list of current hours on the admin "hours report" page

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
                  <div className="col-12 col-sm-4 col-md-3">
                    <label className="form-label">Date</label>
                    <input name="workDate" type="date" className="form-control" required />
                  </div>

                  <div className="col-12 col-sm-4 col-md-3">
                    <label className="form-label">Total Hours</label>
                    <input name="hours" type="number" step="0.25" min="0" className="form-control" required />
                  </div>

                  <div className="col-12 col-sm-4 col-md-3">
                    <label className="form-label">Category</label>
                    <select
                      name="category"
                      className="form-select"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                    >
                      <option value="" disabled>Select a category…</option>
                      <option value="COMMUNITY">Community</option>
                      <option value="FAITH">Faith</option>
                      <option value="LIFE">Life</option>
                      <option value="FAMILY">Family</option>
                      <option value="PATRIOTISM">Patriotism</option>
                    </select>
                  </div>

                  {canUseAdminMode && (
                    <div className="col-12 col-sm-4 col-md-3">
                      <label className="form-label">Subcategory</label>
                      <select
                        name="subcategory"
                        className="form-select"
                        required
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        disabled={!category}
                      >
                        <option value="" disabled>
                          {category ? "Select a subcategory…" : "Select a category first…"}
                        </option>
                        {subcategoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-12 col-md-6">
                    <label className="form-label">Description</label>
                    <input name="description" className="form-control" placeholder="What did you work on?" required />
                  </div>

                  {canUseAdminMode && (
                    <div className="col-12 col-md-6">
                      <label className="form-label">Member</label>
                      <input
                        className="form-control"
                        placeholder="Search member name or member #…"
                        value={memberQuery}
                        onChange={(e) => {
                          setMemberQuery(e.target.value);
                          setSelectedMember(null);
                        }}
                      />

                      {!!memberLoading && <div className="small text-muted mt-1">Searching…</div>}

                      {!selectedMember && memberHits.length > 0 && (
                        <div className="list-group mt-1">
                          {memberHits.map((m) => (
                            <button
                              type="button"
                              key={m.id}
                              className="list-group-item list-group-item-action"
                              onClick={() => {
                                setSelectedMember(m);
                                setMemberHits([]);
                                setMemberQuery(`${m.firstname} ${m.lastname} (${m.memberid})`);
                              }}
                            >
                              {m.firstname} {m.lastname} ({m.memberid})
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedMember && (
                        <div className="small text-muted mt-1">
                          Selected: <strong>{selectedMember.firstname} {selectedMember.lastname}</strong> — Member #{selectedMember.memberid}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <button className="btn btn-primary" type="submit">Submit</button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* List of vol hours for this year */}

        {showList && !loading && !err && (
          <div className="mt-2">
            {sortedRows.length === 0 ? (
              <div className="text-muted">No hours logged.</div>
            ) : (
              sortedRows.map((r) => {
                const date =
                  r.workdate ||
                  r.date ||
                  "";

                return (
                  <div key={r.id} className="border-top py-2">
                    <div className="fw-semibold">
                      {date
                        ? new Date(date).toLocaleDateString()
                        : "—"}{" "}
                      · {Number(r.hours).toFixed(2)} hrs · {Number(r.hours).toFixed(2)} hrs
                    </div>

                    {r.description && (
                      <div className="text-muted small">
                        {r.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}   
       
      </div>
    </div>
  );
}
