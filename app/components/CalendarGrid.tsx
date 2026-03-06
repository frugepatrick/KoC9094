'use client';

/**
 * Monthly calendar grid component
 * - Renders a 6x7 (42-day) month view
 * - Shows "all-day" events directly under the date number (inside each cell)
 * - Shows timed events as chips under the all-day chips
 * - Click any event to open a Bootstrap modal with details
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useEvents, type EventRow } from '@/lib/events';
import { formatDateRange } from '@/lib/date';
import Modal from 'bootstrap/js/dist/modal'; // Bootstrap Modal (client-only)
import { useSession } from 'next-auth/react';

// ===== Config =====
const TZ = 'America/Chicago';
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ===== Date helpers =====

/** Returns a Date set to the first day of the month for d (local time) */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Returns a Date set to the first day of (month + n) relative to d (local time) */
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** True if two dates share the same local YYYY-MM-DD */
function sameYMD(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

/** Stable YYYY-MM-DD key for a given date in a specific time zone (avoids DST surprises) */
function ymdKey(date: Date, tz=TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(date)
    .reduce<Record<string,string>>((acc,p)=> p.type!=='literal' ? (acc[p.type]=p.value, acc) : acc, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Convert Date to a "midnight local day" in the given time zone */
function tzDay(date: Date, tz=TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(date)
    .reduce<Record<string,string>>((acc,p)=> p.type!=='literal' ? (acc[p.type]=p.value, acc) : acc, {});
  return new Date(Number(parts.year), Number(parts.month)-1, Number(parts.day));
}

/**
 * Build the 6x7 month grid for viewDate.
 * Returns:
 *  - weeks: Date[][] (6 rows x 7 columns)
 *  - from/to: ISO window covering all 42 cells ([from, to))
 *  - firstOfMonth: Date (local)
 */
function monthGrid(viewDate: Date) {
  const firstOfMonth = startOfMonth(viewDate);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun

  // First cell = Sunday of the week containing the 1st of the month
  const firstCell = new Date(firstOfMonth);
  firstCell.setDate(firstOfMonth.getDate() - firstWeekday);

  // Collect 42 consecutive days
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    days.push(d);
  }

  const lastCell = days[41];

  // Event fetch window [from, to) in ISO (local midnight boundaries)
  const from = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate(), 0,0,0).toISOString();
  const to   = new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1, 0,0,0).toISOString();

  // Partition into 6 weeks (rows)
  const weeks: Date[][] = [];
  for (let r = 0; r < 6; r++) weeks.push(days.slice(r*7, r*7 + 7));

  return { weeks, from, to, firstOfMonth };
}

// ===== Edit Event Form Component =====
function EditEventForm({ event, onSave, onCancel }: { 
  event: EventRow; 
  onSave: (updates: Partial<EventRow>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    startTime: event.startTime,
    endTime: event.endTime,
    isAllDay: event.isAllDay || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert datetime-local values (local time) to UTC ISO strings for storage
    const updates = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };
    onSave(updates);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format datetime for input field (local time, not UTC)
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="edit-title" className="form-label">Title *</label>
        <input
          type="text"
          className="form-control"
          id="edit-title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="edit-description" className="form-label">Description</label>
        <textarea
          className="form-control"
          id="edit-description"
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="edit-location" className="form-label">Location</label>
        <input
          type="text"
          className="form-control"
          id="edit-location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="edit-isAllDay"
            checked={formData.isAllDay}
            onChange={(e) => handleChange('isAllDay', e.target.checked)}
          />
          <label className="form-check-label" htmlFor="edit-isAllDay">
            All day event
          </label>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="edit-startTime" className="form-label">Start Time *</label>
          <input
            type="datetime-local"
            className="form-control"
            id="edit-startTime"
            value={formatDateTime(formData.startTime)}
            onChange={(e) => handleChange('startTime', e.target.value)}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="edit-endTime" className="form-label">End Time *</label>
          <input
            type="datetime-local"
            className="form-control"
            id="edit-endTime"
            value={formatDateTime(formData.endTime)}
            onChange={(e) => handleChange('endTime', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </div>
    </form>
  );
}

export default function CalendarGrid() {
  // Cursor controls which month is shown
  const [cursor, setCursor] = useState<Date>(new Date());

  // Session for role checking
  const { data: session } = useSession();
  const canEdit = session?.user?.role === 'admin' || session?.user?.role === 'officer';

  // Build month grid + event fetch window when cursor changes
  const { weeks, from, to, firstOfMonth } = useMemo(() => monthGrid(cursor), [cursor]);

  // Fetch events for the 42-day window
  const { events, loading, error, reload } = useEvents({ from, to });

  // ===== Modal state/refs (Bootstrap) =====
  const [selected, setSelected] = useState<EventRow | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const modalInstance = useRef<Modal | null>(null);

  // ===== Edit modal state =====
  const [editing, setEditing] = useState<EventRow | null>(null);
  const editModalRef = useRef<HTMLDivElement | null>(null);
  const editModalInstance = useRef<Modal | null>(null);

  // ===== Success banner state =====
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (modalRef.current) {
      modalInstance.current = Modal.getOrCreateInstance(modalRef.current, { backdrop: true, focus: true });
    }
    if (editModalRef.current) {
      editModalInstance.current = Modal.getOrCreateInstance(editModalRef.current, { backdrop: true, focus: true });
      // Reset editing state when edit modal is hidden
      editModalRef.current.addEventListener('hidden.bs.modal', () => {
        setEditing(null);
      });
    }
    return () => { 
      modalInstance.current?.hide(); 
      modalInstance.current = null; 
      editModalInstance.current?.hide();
      editModalInstance.current = null;
    };
  }, []);

  /** Open details modal for an event */
  const openEvent = (ev: EventRow) => {
    setSelected(ev);
    modalInstance.current?.show();
  };

  /** Open edit modal for an event */
  const openEdit = (ev: EventRow) => {
    setEditing(ev);
    modalInstance.current?.hide(); // Hide the view modal
    editModalInstance.current?.show();
  };

  /** Handle updating an event */
  const handleUpdateEvent = async (updatedEvent: Partial<EventRow>) => {
    if (!editing) return;

    try {
      const response = await fetch(`/api/events/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Refresh events
      reload();
      editModalInstance.current?.hide();
      setEditing(null);
      
      // Show success banner
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  // ===== Split events into all-day vs timed =====
  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay === true), [events]);
  const timedEvents  = useMemo(() => events.filter(e => e.isAllDay !== true), [events]);

  /**
   * Group all-day events by YYYY-MM-DD (in our TZ),
   * so they render INSIDE each day cell directly under the date number.
   * We also mark whether the slice is the start or end of a multi-day span
   * to round the chip corners nicely across days.
   */
  const allDayByDay = useMemo(() => {
    const map = new Map<string, Array<{ ev: EventRow; isStart: boolean; isEnd: boolean }>>();
    if (allDayEvents.length === 0) return map;

    // Visible grid range (local days)
    const firstDay = tzDay(weeks[0][0], TZ);
    const lastDay  = tzDay(weeks[5][6], TZ);

    for (const ev of allDayEvents) {
      const evStart = tzDay(new Date(ev.startTime), TZ);
      const evEnd   = tzDay(new Date(ev.endTime), TZ);

      // Clamp to visible grid
      const start = evStart < firstDay ? firstDay : evStart;
      const end   = evEnd   > lastDay  ? lastDay  : evEnd;

      // Walk each day the event spans (inclusive)
      for (
        let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        const key = ymdKey(d, TZ);
        const arr = map.get(key) ?? [];
        arr.push({
          ev,
          isStart: sameYMD(d, evStart),
          isEnd: sameYMD(d, evEnd),
        });
        map.set(key, arr);
      }
    }

    // Stable ordering per-day (optional; here: by title)
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.ev.title.localeCompare(b.ev.title));
      map.set(k, arr);
    }
    return map;
  }, [allDayEvents, weeks]);

  /**
   * Group TIMED events by YYYY-MM-DD, sorted by start time,
   * so we can render up to 2 in the cell and show "+N more"
   */
  const timedByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of timedEvents) {
      const key = ymdKey(new Date(ev.startTime), TZ);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    // Sort each day's events by start time
    for (const [k, arr] of map.entries()) {
      arr.sort((a,b)=> new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      map.set(k, arr);
    }
    return map;
  }, [timedEvents]);

  // Toolbar label (e.g., "September 2025")
  const monthLabel = new Intl.DateTimeFormat('en-US', { month:'long', year:'numeric', timeZone: TZ }).format(firstOfMonth);
  const today = new Date();

  return (
    <div className="p-3">
      {/* ===== Toolbar: month + navigation ===== */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 m-0">{monthLabel}</h2>
        <div className="btn-group">
          <button className="btn btn-outline-secondary" onClick={() => setCursor(new Date())}>Today</button>
          <button className="btn btn-outline-secondary" onClick={() => setCursor(addMonths(cursor, -1))}>←</button>
          <button className="btn btn-outline-secondary" onClick={() => setCursor(addMonths(cursor, 1))}>→</button>
        </div>
      </div>

      {/* ===== Success Banner ===== */}
      {showSuccess && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Event updated successfully!
          <button type="button" className="btn-close" onClick={() => setShowSuccess(false)} aria-label="Close"></button>
        </div>
      )}

      {/* ===== Week header row (Sun..Sat) ===== */}
      <div className="calendar-grid mb-1 text-muted fw-semibold small">
        {WEEKDAYS.map((d) => (<div key={d} className="px-2 py-1">{d}</div>))}
      </div>

      {/* ===== 6 Weeks ===== */}
      <div className="d-flex flex-column gap-2">
        {weeks.map((weekDays, wIdx) => {
          const inMonth = (d: Date) => d.getMonth() === firstOfMonth.getMonth();

          return (
            <div key={wIdx} className="position-relative rounded-3 overflow-hidden border bg-body">
              {/* No overlay bar at top — everything lives inside the cells */}

              {/* Week grid (7 columns) */}
              <div className="calendar-grid">
                {weekDays.map((date, i) => {
                  const isToday = sameYMD(date, today);
                  const key = ymdKey(date, TZ);

                  // Collect events for this specific day
                  const dailyAllDay = allDayByDay.get(key) ?? [];
                  const dayEvents   = timedByDay.get(key) ?? [];

                  // Timed events: show top 2 chips, then "+N more"
                  const show = dayEvents.slice(0, 2);
                  const overflow = dayEvents.length - show.length;

                  return (
                    <div key={i} className={`calendar-cell p-2 border bg-white ${inMonth(date) ? '' : 'bg-body-tertiary text-muted'}`}>
                      {/* Date number row */}
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-secondary">{date.getDate()}</span>
                        {isToday && <span className="badge rounded-pill text-bg-secondary">Today</span>}
                      </div>

                      {/* All-day events: directly under the date number (inside the cell) */}
                      <div className="d-flex flex-column gap-1">
                        {dailyAllDay.map(({ ev, isStart, isEnd }) => (
                          <button
                            key={`allday-${ev.id}-${key}`}
                            type="button"
                            className="allday-chip text-start"
                            title={formatDateRange(ev.startTime, ev.endTime, {
                              tz: TZ,
                              allDay: true,
                              includeWeekday: false,
                              includeYear: 'auto',
                              includeLocation: ev.location ?? undefined
                            })}
                            onClick={() => openEvent(ev)}
                            style={{
                              // Rounded ends on the first/last day of a multi-day span
                              borderTopLeftRadius: isStart ? '999px' : '6px',
                              borderBottomLeftRadius: isStart ? '999px' : '6px',
                              borderTopRightRadius: isEnd ? '999px' : '6px',
                              borderBottomRightRadius: isEnd ? '999px' : '6px',
                            }}
                          >
                            <strong className="me-1">{ev.title}</strong>
                          </button>
                        ))}
                      </div>

                      {/* Timed events (chips) */}
                      <div className="d-flex flex-column gap-1 cell-body mt-1">
                        {show.map((ev) => {
                          const when = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour:'numeric', minute:'2-digit' })
                            .format(new Date(ev.startTime));
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              className="event-chip text-start"
                              title={formatDateRange(ev.startTime, ev.endTime, {
                                tz: TZ, allDay:false, includeWeekday:false, includeYear:'auto',
                                includeLocation: ev.location ?? undefined
                              })}
                              onClick={() => openEvent(ev)}
                            >
                              <strong className="me-1">{ev.title}</strong>
                              <span className="time-span" style={{ color: '#112866' }}>{when}</span>
                            </button>
                          );
                        })}
                        {overflow > 0 && <div className="small text-muted">+{overflow} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Status ===== */}
      {loading && <div className="mt-3 text-muted">Loading events…</div>}
      {error && (
        <div className="mt-3">
          <span className="text-danger">{error}</span>
          <button className="btn btn-outline-secondary btn-sm ms-2" onClick={reload}>Retry</button>
        </div>
      )}

      {/* ===== Event Details Modal ===== */}
      <div className="modal fade" ref={modalRef} tabIndex={-1} aria-labelledby="eventModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="eventModalLabel">{selected?.title ?? 'Event'}</h5>
              <button type="button" className="btn-close" onClick={() => modalInstance.current?.hide()} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {selected && (
                <>
                  <div className="mb-2">
                    <i className="bi bi-calendar-event me-2" aria-hidden="true"></i>
                    <span className="fw-semibold">
                      {formatDateRange(selected.startTime, selected.endTime, {
                        tz: TZ,
                        allDay: selected.isAllDay === true,
                        includeWeekday: true,
                        includeYear: 'auto',
                      })}
                    </span>
                  </div>
                  {selected.location && (
                    <div className="mb-2">
                      <i className="bi bi-geo-alt me-2" aria-hidden="true"></i>
                      <span>{selected.location}</span>
                    </div>
                  )}
                  {selected.description && (
                    <div className="mb-2">
                      <i className="bi bi-card-text me-2" aria-hidden="true"></i>
                      <div className="text-body">{selected.description}</div>
                    </div>
                  )}
                  <div className="text-muted small">
                    <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
                    Created by: {selected.createdBy}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => modalInstance.current?.hide()}>Close</button>
              {canEdit && (
                <button type="button" className="btn btn-primary" onClick={() => selected && openEdit(selected)}>Edit</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Event Edit Modal ===== */}
      <div className="modal fade" ref={editModalRef} tabIndex={-1} aria-labelledby="editEventModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editEventModalLabel">Edit Event</h5>
              <button type="button" className="btn-close" onClick={() => editModalInstance.current?.hide()} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {editing && <EditEventForm event={editing} onSave={handleUpdateEvent} onCancel={() => editModalInstance.current?.hide()} />}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Styles ===== */}
      <style jsx>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        /* Fixed height so one busy cell can't stretch the row (tweak as needed) */
        .calendar-cell {
          height: 110px;
          overflow: hidden;
        }
        .cell-body { overflow: hidden; }

        /* All-day chips (full-width, one line) */
        .allday-chip {
          color: #ffffff;
          background-color: #112866;         /* slightly lighter than timed chips */
          font-size: .78rem;
          line-height: 1.1rem;
          padding: .12rem .5rem;
          border: 1px solid var(--bs-border-color);
          border-radius: 6px;                 /* ends get overridden per-day for spans */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        /* Timed event chips */
        .event-chip {
          color: #112866;
          background-color: #f7b718;
          font-size: .78rem;
          line-height: 1.1rem;
          padding: .12rem .4rem;
          border: 1px solid var(--bs-border-color);
          border-radius: .5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .calendar-cell .event-chip span.time-span {
          color: #112866;
        }
      `}</style>
    </div>
  );
}
