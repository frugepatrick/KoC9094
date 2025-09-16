 'use client';

/** The shape of an event coming from /api/events */
export type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  isAllDay: boolean | null;
  startTime: string;      // e.g. "2025-09-21 08:00:00"
  endTime: string;        // same format
  createdBy: string;
};

type FormatDateRangeOptions = {
  allDay?: boolean; //if true, ignore times
  tz?: string; //this will house the timezone (America/Chicago)
  locale?: string; //eg en-US
  includeWeekday?: boolean; // Do you want to show mon/tues/etc
  includeYear?: 'auto' | 'always' | 'never';
  includeLocation?: string; //If included append - @{location}
  timeFormat?: 'short' | 'medium'; // 2:00 pm  | 2:00:15 PM
};

/** Helper: format a local date/time range nicely for display */
export function formatDateRange(startTime: string | Date, endTime: string | Date, opts: FormatDateRangeOptions = {}): string {
  // (pseudocode)
    const start = new Date(startTime);
    const end = new Date(endTime);
    //Make sure we get something that isn't a number
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log('Invalid Date returned')
        return 'Invalid date';
    }

    // Defaults (probably can just set these. Not sure if I will choose different ever)
    const locale = opts.locale || 'en-US';
    const timeZone = opts.tz;
    const includeWeekday = opts.includeWeekday ?? true;
    const includeYear = opts.includeYear ?? 'auto';
    const allDay = !!opts.allDay; //Evaluates truthy or falsy of allDay value
    const timeFmt = opts.timeFormat ?? 'short';

    //first check if it is the same day:
    const sameDay = (a: Date, b: Date) => {
        // Intl.DateTimeFormat (locale {timezone , year, month, day})
        const da = new Intl.DateTimeFormat(locale, {timeZone, year: 'numeric', month: '2-digit' , day: '2-digit' }).formatToParts(a)
            .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? (acc[p.type] = p.value, acc) : acc), {}); 
        const db = new Intl.DateTimeFormat(locale, {timeZone, year: 'numeric', month: '2-digit' , day: '2-digit' }).formatToParts(b)
            .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? (acc[p.type] = p.value, acc) : acc), {});
        return da.year === db.year && da.month === db.month && da.day === db.day;
    }

    // 3) Year display decision
  const now = new Date();
  const crossYears = start.getFullYear() !== end.getFullYear();
  const currentYear = now.getFullYear();
  const needsYear =
    includeYear === 'always' ||
    (includeYear === 'auto' && (crossYears || start.getFullYear() !== currentYear || end.getFullYear() !== currentYear));

  // 4) Build date formatter for the “header” part
  const baseDateOpts: Intl.DateTimeFormatOptions = {
    timeZone,
    month: 'short',
    day: 'numeric',
    ...(includeWeekday ? { weekday: 'short' } : {}),
    ...(needsYear ? { year: 'numeric' } : {}),
  };
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(locale, baseDateOpts).format(d);

  // 5) Time formatter
  const baseTimeOpts: Intl.DateTimeFormatOptions =
    timeFmt === 'medium'
      ? { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric' }
      : { timeZone, hour: 'numeric', minute: '2-digit' };
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(locale, baseTimeOpts).format(d);


  // if same day: "Sep 21, 2025 · 8:00 AM – 11:00 AM"
  // else: "Sep 21, 2025 8:00 AM – Sep 22, 2025 11:00 AM"
  
  // return the formatted string
const same = sameDay(start, end);
  let body = '';

  if (allDay) {
    if (same) {
      // "Mon, Sep 8 · All day"
      body = `${fmtDate(start)} · All day`;
    } else {
      // Multi-day all-day compression
      // If same month/year: "Sep 8–10"
      // Else: use full explicit range "Dec 30, 2025 – Jan 2, 2026"
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth && !needsYear) {
        const startDay = new Intl.DateTimeFormat(locale, { timeZone, month: 'short', day: 'numeric' }).format(start);
        const endDayOnly = new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric' }).format(end);
        body = `${startDay}–${endDayOnly}`;
      } else {
        body = `${fmtDate(start)} – ${fmtDate(end)}`;
      }
    }
  } else {
    // Not all-day
    if (end <= start) {
      // zero or negative duration → single timestamp
      body = `${fmtDate(start)} · ${fmtTime(start)}`;
    } else if (same) {
      // "Mon, Sep 8 · 2:00–3:30 PM"
      const startT = fmtTime(start);
      const endT = fmtTime(end);
      // Optional: collapse AM/PM if locale uses it (simple heuristic):
      // If endT ends with "AM/PM" and startT ends with same suffix, drop from startT.
      const suffix = endT.split(' ').slice(-1)[0];
      const collapse =
        /[AP]M/i.test(suffix || '') && startT.endsWith(suffix);
      const startCompacted = collapse ? startT.replace(` ${suffix}`, '') : startT;
      body = `${fmtDate(start)} · ${startCompacted}–${endT}`;
    } else {
      // Cross-day range with times
      body = `${fmtDate(start)}, ${fmtTime(start)} – ${fmtDate(end)}, ${fmtTime(end)}`;
    }
  }

  // 7) Append location if provided
  if (opts.includeLocation) {
    body += ` · @ ${opts.includeLocation}`;
  }

  return body;
}


function toBool(v: boolean | null | undefined) {
  return v === true;
}

function monthRangeISO(d = new Date()) {
  // from = first day 00:00:00, to = first day of next month 00:00:00 (exclusive)
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
  // Your API expects "YYYY-MM-DD HH:mm:ss" or ISO? You showed "2025-09-21 08:00:00".
  // We’ll send ISO and let the API accept it; if not, swap to a custom formatter.
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

/** Network call: fetch events from your API (optionally with from/to) */
export async function fetchEvents(params?: { from?: string; to?: string }): Promise<EventRow[]> {
  const url = new URL('/api/events', typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (params?.from) url.searchParams.set('from', params.from);
  if (params?.to) url.searchParams.set('to', params.to);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to load events (${res.status}) ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as EventRow[]) : [];
}


/** React hook: load events, expose loading/error/data + a refetch */
import { useEffect, useState, useCallback } from "react";
export function useEvents(range?: { from?: string; to?: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(range);
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [range?.from, range?.to]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, reload: load };
}

/** Minimal EventItem "component" to render one event row */
export function EventItem({ ev }: { ev: EventRow }) {
  const allDay = toBool(ev.isAllDay);
  const when = formatDateRange(ev.startTime, ev.endTime, {
    tz: 'America/Chicago',
    allDay,
    includeWeekday: true,
    includeYear: 'auto',
    includeLocation: ev.location ?? undefined,
    timeFormat: 'short',
  });

  return (
    <div className="rounded-xl border border-gray-200 p-3 mb-2">
      <div className="font-bold">{ev.title}</div>
      <div className="text-sm text-gray-600">{when}</div>
      {ev.description && <div className="text-sm mt-1">{ev.description}</div>}
    </div>
  );
}

/** Page component: uses the hook and maps events to EventItem */
export default function CalendarPage() {
  const defaultRange = monthRangeISO();
  const { events, loading, error, reload } = useEvents(defaultRange);

  if (loading) return <div className="p-4 text-gray-600">Loading events…</div>;
  if (error) return (
    <div className="p-4">
      <div className="text-red-600 mb-2">{error}</div>
      <button className="px-3 py-1 rounded bg-gray-900 text-white" onClick={reload}>Retry</button>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Upcoming Events</h2>
      {events.length === 0 && <div className="text-gray-600">No events found.</div>}
      {events.map((ev) => (
        <EventItem key={ev.id} ev={ev} />
      ))}
    </div>
  );
}