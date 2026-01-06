'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

// Match your API shape
type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  isAllDay: boolean;
  startTime: string;  // 
  endTime: string;    // 
  createdBy: string;
};

function next30DaysRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 30);


  return { from: start.toISOString(), to: end.toISOString() };
}

// If you already have your own formatDateRange helper, you can import and use it.
// Here’s a tiny fallback formatter (weekday + month/day + times):
function fallbackFormatRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  const dFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const tFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
  if (s.toDateString() === e.toDateString()) {
    return `${dFmt.format(s)} · ${tFmt.format(s)}–${tFmt.format(e)}`;
  }
  return `${dFmt.format(s)}, ${tFmt.format(s)} – ${dFmt.format(e)}, ${tFmt.format(e)}`;
}

export default function UpcomingEvents({ title = "Upcoming Events", limit = 6 }: { title?: string; limit?: number }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === "admin" || role === "officer";

  const { from, to } = useMemo(next30DaysRange, []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load();}, []);
  //Setting this to prevent button double clicks later
  const [isSaving , setIsSaving] = useState(false);
  // Bootstrap modal (open/close via data attributes; optional programmatic close if bundle is present)
  const createModalRef = useRef<HTMLDivElement | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (isSaving) return;
    // Use FormData to capture the fields that are populated by user
    const fd = new FormData(e.currentTarget);
    // Capture the info from the payload.
    const startLocal = String(fd.get("startTime") || "");
    const endLocal = String(fd.get("endTime") || "");

    // Convert "YYYY-MM-DDTHH:mm" (local) -> Date -> ISO UTC string
    const startISO = new Date(startLocal).toISOString();
    const endISO = new Date(endLocal).toISOString();

    const payload = {
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || "").trim() || null,
      location: String(fd.get("location") || "").trim() || null,
      isAllDay: fd.get("isAllDay") === "on",
      startTime: startISO,   // ✅
      endTime: endISO,       // ✅
    };

    if (isNaN(new Date(startLocal).getTime()) || isNaN(new Date(endLocal).getTime())) {
      alert("Invalid start/end date");
    return;
}

    if (!payload.title) { alert("Title is required"); return; }
    if (!payload.startTime || !payload.endTime) { alert("Start/End are required"); return; }
    try {
      setIsSaving(true);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
          const msg = await res.text().catch(() => "");
          alert(`Failed to create event. ${msg || ""}`);
        return;
      } else {
        alert("Event Creation was Successful");
      }

      // Reset form
      form.reset();

      // If bootstrap JS is loaded globally, close the modal programmatically
      // (The global is available when you include bootstrap.bundle.js in layout)
      
        // @ts-ignore
        const Modal = (window as any)?.bootstrap?.Modal;
        if (Modal && createModalRef.current) {
          const instance = Modal.getOrCreateInstance(createModalRef.current);
          instance.hide();
        }
    } catch (err) {
        console.error("Unexpected error creating event", err);
        alert("Something went wrong while creating the event. Please try again.");
    }
    finally {
      // Set IsSaving back to faluse
      setIsSaving(false);
        //wait for the UI refresh
      await load();
  }    
} 
  // sorts by upcoming events first and also sets limit. Limit is set to 6 up above.
  const visible = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, limit);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="h5 m-0">{title}</h3>
          <div className="d-flex gap-2">
            <a className="btn btn-sm btn-outline-secondary" href="/calendar">Open Calendar</a>
            {canEdit && (
              <button
                className="btn btn-sm btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#createEventModal"
              >
                Create Event
              </button>
            )}
          </div>
        </div>

        {loading && <div className="text-muted">Loading…</div>}
        {error && <div className="text-danger">{error}</div>}
        {!loading && !error && visible.length === 0 && <div className="text-muted">No events in the next 30 days.</div>}

        <div className="list-group list-group-flush">
          {visible.map(ev => (
            <div key={ev.id} className="list-group-item">
              <div className="fw-semibold">{ev.title}</div>
              <div className="small text-muted">
                {fallbackFormatRange(ev.startTime, ev.endTime)}
                {ev.location ? ` · @ ${ev.location}` : null}
                {ev.isAllDay ? " · All day" : null}
              </div>
              {ev.description && <div className="small mt-1">{ev.description}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Modal (only rendered; opening is gated by canEdit button) */}
      <div
        className="modal fade"
        id="createEventModal"
        tabIndex={-1}
        aria-hidden="true"
        ref={createModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleCreate}>
              <div className="modal-header">
                <h5 className="modal-title">Create Event</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Title</label>
                  <input name="title" className="form-control" required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Location</label>
                  <input name="location" className="form-control" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-control" rows={3} />
                </div>
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label">Start</label>
                    <input name="startTime" type="datetime-local" className="form-control" required />
                  </div>
                  <div className="col">
                    <label className="form-label">End</label>
                    <input name="endTime" type="datetime-local" className="form-control" required />
                  </div>
                </div>
                <div className="form-check mt-2">
                  <input className="form-check-input" type="checkbox" id="isAllDay" name="isAllDay" />
                  <label className="form-check-label" htmlFor="isAllDay">All day</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Event"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
