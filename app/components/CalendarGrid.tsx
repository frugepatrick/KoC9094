'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useEvents, type EventRow } from '@/lib/events';
import { formatDateRange } from '@/lib/date';
// Bootstrap Modal (client-only)
import Modal from 'bootstrap/js/dist/modal';

// ===== Config =====
const TZ = 'America/Chicago';
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ===== Date helpers =====
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function sameYMD(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function ymdKey(date: Date, tz=TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(date)
    .reduce<Record<string,string>>((acc,p)=> p.type!=='literal' ? (acc[p.type]=p.value, acc) : acc, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function tzDay(date: Date, tz=TZ) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(date)
    .reduce<Record<string,string>>((acc,p)=> p.type!=='literal' ? (acc[p.type]=p.value, acc) : acc, {});
  return new Date(Number(parts.year), Number(parts.month)-1, Number(parts.day));
}
function monthGrid(viewDate: Date) {
  const firstOfMonth = startOfMonth(viewDate);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun
  const firstCell = new Date(firstOfMonth);
  firstCell.setDate(firstOfMonth.getDate() - firstWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    days.push(d);
  }
  const lastCell = days[41];
  const from = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate(), 0,0,0).toISOString();
  const to   = new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1, 0,0,0).toISOString();

  // Partition into 6 weeks
  const weeks: Date[][] = [];
  for (let r = 0; r < 6; r++) weeks.push(days.slice(r*7, r*7 + 7));
  return { weeks, from, to, firstOfMonth };
}

// ===== Lane packing for all-day bars =====
type Bar = { id:number; title:string; startCol:number; span:number; tooltip:string; source: EventRow };
function assignLanes(bars: Bar[]): Array<Bar & { lane:number }> {
  const sorted = [...bars].sort((a,b)=> a.startCol - b.startCol || b.span - a.span);
  const lanes: number[] = []; const placed: Array<Bar & { lane:number }> = [];
  for (const bar of sorted) {
    let lane = 0;
    while (true) {
      const lastEnd = lanes[lane] ?? -1;
      const barEnd = bar.startCol + bar.span - 1;
      if (bar.startCol > lastEnd) { lanes[lane] = barEnd; placed.push({...bar, lane}); break; }
      lane += 1;
    }
  }
  return placed;
}

export default function CalendarGrid() {
  const [cursor, setCursor] = useState<Date>(new Date());
  const { weeks, from, to, firstOfMonth } = useMemo(() => monthGrid(cursor), [cursor]);
  const { events, loading, error, reload } = useEvents({ from, to });

  // Modal state/refs
  const [selected, setSelected] = useState<EventRow | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const modalInstance = useRef<Modal | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      modalInstance.current = Modal.getOrCreateInstance(modalRef.current, { backdrop: true, focus: true });
    }
    return () => { modalInstance.current?.hide(); modalInstance.current = null; };
  }, []);

  const openEvent = (ev: EventRow) => {
    setSelected(ev);
    modalInstance.current?.show();
  };

  // Split events
  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay === true), [events]);
  const timedEvents  = useMemo(() => events.filter(e => e.isAllDay !== true), [events]);

  // Timed per day
  const timedByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of timedEvents) {
      const key = ymdKey(new Date(ev.startTime), TZ);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a,b)=> new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      map.set(k, arr);
    }
    return map;
  }, [timedEvents]);

  // Bars per week (all-day spanning)
  const barsPerWeek = useMemo(() => {
    return weeks.map((weekDays) => {
      const weekStart = tzDay(weekDays[0], TZ);
      const weekEnd   = tzDay(weekDays[6], TZ);
      const bars: Bar[] = [];

      for (const ev of allDayEvents) {
        const evStart = tzDay(new Date(ev.startTime), TZ);
        const evEnd   = tzDay(new Date(ev.endTime), TZ);
        if (evStart <= weekEnd && evEnd >= weekStart) {
          const sCol = Math.max(0, Math.floor((tzDay(evStart, TZ).getTime() - weekStart.getTime())/86400000));
          const eCol = Math.min(6, Math.floor((tzDay(evEnd, TZ).getTime()   - weekStart.getTime())/86400000));
          const span = Math.max(1, eCol - sCol + 1);
          bars.push({
            id: ev.id,
            title: ev.title,
            startCol: sCol,
            span,
            tooltip: formatDateRange(ev.startTime, ev.endTime, { tz: TZ, allDay: true, includeWeekday:false, includeYear:'auto', includeLocation: ev.location ?? undefined }),
            source: ev
          });
        }
      }
      return assignLanes(bars);
    });
  }, [weeks, allDayEvents]);

  const monthLabel = new Intl.DateTimeFormat('en-US', { month:'long', year:'numeric', timeZone: TZ }).format(firstOfMonth);
  const today = new Date();

  return (
    <div className="p-3">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 m-0">{monthLabel}</h2>
        <div className="btn-group">
          <button className="btn btn-outline-secondary" onClick={() => setCursor(new Date())}>Today</button>
          <button className="btn btn-outline-secondary" onClick={() => setCursor(addMonths(cursor, -1))}>←</button>
          <button className="btn btn-outline-secondary" onClick={() => setCursor(addMonths(cursor, 1))}>→</button>
        </div>
      </div>

      {/* Week header */}
      <div className="calendar-grid mb-1 text-muted fw-semibold small">
        {WEEKDAYS.map((d) => (<div key={d} className="px-2 py-1">{d}</div>))}
      </div>

      {/* 6 Weeks */}
      <div className="d-flex flex-column gap-2">
        {weeks.map((weekDays, wIdx) => {
          const inMonth = (d: Date) => d.getMonth() === firstOfMonth.getMonth();
          return (
            <div key={wIdx} className="position-relative rounded-3 overflow-hidden border bg-body">
              {/* Spanning all-day bars */}
              <div className="calendar-week-bars">
                {barsPerWeek[wIdx].map(bar => (
                  <button
                    key={`${bar.id}-${bar.lane}`}
                    type="button"
                    className="calendar-bar text-truncate btn btn-sm btn-outline-primary"
                    style={{ gridColumn: `${bar.startCol + 1} / span ${bar.span}`, gridRow: `${bar.lane + 1}` }}
                    title={bar.tooltip}
                    onClick={() => openEvent(bar.source)}
                  >
                    {bar.title}
                  </button>
                ))}
              </div>

              {/* Week cells */}
              <div className="calendar-grid">
                {weekDays.map((date, i) => {
                  const isToday = sameYMD(date, today);
                  const key = ymdKey(date, TZ);
                  const dayEvents = timedByDay.get(key) ?? [];
                  const show = dayEvents.slice(0, 2);
                  const overflow = dayEvents.length - show.length;

                  return (
                    <div key={i} className={`calendar-cell p-2 border bg-white ${inMonth(date) ? '' : 'bg-body-tertiary text-muted'}`}>
                      {/* date number row */}
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-secondary">{date.getDate()}</span>
                        {isToday && <span className="badge rounded-pill text-bg-secondary">Today</span>}
                      </div>

                      {/* timed events */}
                      <div className="d-flex flex-column gap-1 cell-body">
                        {show.map((ev) => {
                          const when = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour:'numeric', minute:'2-digit' })
                            .format(new Date(ev.startTime));
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              className="event-chip text-start"
                              title={formatDateRange(ev.startTime, ev.endTime, { tz: TZ, allDay:false, includeWeekday:false, includeYear:'auto', includeLocation: ev.location ?? undefined })}
                              onClick={() => openEvent(ev)}
                            >
                              <strong className="me-1">{ev.title}</strong>
                              <span className="time-span" style={{color: "#112866" }}>{when}</span>
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

      {/* Status */}
      {loading && <div className="mt-3 text-muted">Loading events…</div>}
      {error && (
        <div className="mt-3">
          <span className="text-danger">{error}</span>
          <button className="btn btn-outline-secondary btn-sm ms-2" onClick={reload}>Retry</button>
        </div>
      )}

      {/* Event Details Modal */}
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
              {/* Add action buttons here (Edit/Delete) if needed */}
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }
        /* Fixed height so one busy cell can't stretch the row */
        .calendar-cell {
          height: 110px;
          overflow: hidden;
        }
        .cell-body { overflow: hidden; }

        /* Bars overlay for all-day lanes */
        .calendar-week-bars {
          position: absolute;
          left: 0; right: 0; top: 0;
          padding: .25rem .25rem 0 .25rem;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: 22px;
          gap: 2px;
          z-index: 2;
        }
        .calendar-bar {
          font-size: .75rem;
          line-height: 20px;
          border-radius: .375rem;
          padding: 0 .5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        /* Compact single-line "chips" */
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
