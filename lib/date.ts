export type FormatDateRangeOptions = {
  allDay?: boolean;                 // if true, ignore times and just show dates
  tz?: string;                      // timezone (e.g., "America/Chicago")
  locale?: string;                  // language/region formatting (e.g., "en-US")
  includeWeekday?: boolean;         // whether to show Mon/Tue, etc.
  includeYear?: 'auto' | 'always' | 'never'; // control if year is shown
  includeLocation?: string;         // append " · @ {location}" to the string
  timeFormat?: 'short' | 'medium';  // control how times are displayed
};

/** Human-friendly local date/time range */
export function formatDateRange(
  startTime: string | Date,         // start time of event
  endTime: string | Date,           // end time of event
  opts: FormatDateRangeOptions = {} // optional display settings
): string {
  // convert inputs into JS Date objects
  const start = new Date(startTime);
  const end = new Date(endTime);

  // check if either date is invalid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.log('Invalid Date returned');
    return 'Invalid date';
  }

  // pick up options or fall back to defaults
  const locale = opts.locale || 'en-US';
  const timeZone = opts.tz; // may be undefined, which means "use browser/system default"
  const includeWeekday = opts.includeWeekday ?? true; // default true
  const includeYear = opts.includeYear ?? 'auto';     // default "auto"
  const allDay = !!opts.allDay;
  const timeFmt = opts.timeFormat ?? 'short';

  // helper to check if two dates fall on the same day (respecting tz and locale)
  const sameDay = (a: Date, b: Date) => {
    const da = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(a)
      .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? ((acc[p.type] = p.value), acc) : acc), {});
    const db = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(b)
      .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? ((acc[p.type] = p.value), acc) : acc), {});
    return da.year === db.year && da.month === db.month && da.day === db.day;
  };

  // figure out if we need to show the year in output
  const now = new Date();
  const crossYears = start.getFullYear() !== end.getFullYear();
  const currentYear = now.getFullYear();
  const needsYear =
    includeYear === 'always' ||
    (includeYear === 'auto' && (crossYears || start.getFullYear() !== currentYear || end.getFullYear() !== currentYear));

  // build date formatter (month, day, weekday, year depending on options)
  const baseDateOpts: Intl.DateTimeFormatOptions = {
    timeZone,
    month: 'short',
    day: 'numeric',
    ...(includeWeekday ? { weekday: 'short' } : {}),
    ...(needsYear ? { year: 'numeric' } : {}),
  };
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(locale, baseDateOpts).format(d);

  // build time formatter (short = hh:mm, medium = hh:mm:ss)
  const baseTimeOpts: Intl.DateTimeFormatOptions =
    timeFmt === 'medium'
      ? { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric' }
      : { timeZone, hour: 'numeric', minute: '2-digit' };
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(locale, baseTimeOpts).format(d);

  const same = sameDay(start, end);
  let body = '';

  if (allDay) {
    // if all-day event
    if (same) {
      body = `${fmtDate(start)} · All day`;
    } else {
      // multi-day all-day event
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
    // timed event
    if (end <= start) {
      // invalid or zero-length range
      body = `${fmtDate(start)} · ${fmtTime(start)}`;
    } else if (same) {
      // same day event with start & end times
      const startT = fmtTime(start);
      const endT = fmtTime(end);
      // try to collapse "AM/PM" if both times have it
      const suffix = endT.split(' ').slice(-1)[0];
      const collapse = /[AP]M/i.test(suffix || '') && startT.endsWith(suffix);
      const startCompacted = collapse ? startT.replace(` ${suffix}`, '') : startT;
      body = `${fmtDate(start)} · ${startCompacted}–${endT}`;
    } else {
      // spans multiple days
      body = `${fmtDate(start)}, ${fmtTime(start)} – ${fmtDate(end)}, ${fmtTime(end)}`;
    }
  }

  // add location if provided
  if (opts.includeLocation) {
    body += ` · @ ${opts.includeLocation}`;
  }
  return body;
}
