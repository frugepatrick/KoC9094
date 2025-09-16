export type FormatDateRangeOptions = {
  allDay?: boolean;                 // if true, ignore times
  tz?: string;                      // IANA timezone (e.g., "America/Chicago")
  locale?: string;                  // e.g., "en-US"
  includeWeekday?: boolean;         // show Mon/Tue…
  includeYear?: 'auto' | 'always' | 'never';
  includeLocation?: string;         // append " · @ {location}"
  timeFormat?: 'short' | 'medium';  // 'short' = hh:mm, 'medium' = hh:mm:ss
};

/** Human-friendly local date/time range */
export function formatDateRange(
  startTime: string | Date,
  endTime: string | Date,
  opts: FormatDateRangeOptions = {}
): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.log('Invalid Date returned');
    return 'Invalid date';
  }

  const locale = opts.locale || 'en-US';
  const timeZone = opts.tz;
  const includeWeekday = opts.includeWeekday ?? true;
  const includeYear = opts.includeYear ?? 'auto';
  const allDay = !!opts.allDay;
  const timeFmt = opts.timeFormat ?? 'short';

  // same-day check in TZ
  const sameDay = (a: Date, b: Date) => {
    const da = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(a)
      .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? ((acc[p.type] = p.value), acc) : acc), {});
    const db = new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(b)
      .reduce<Record<string, string>>((acc, p) => (p.type !== 'literal' ? ((acc[p.type] = p.value), acc) : acc), {});
    return da.year === db.year && da.month === db.month && da.day === db.day;
  };

  // year display
  const now = new Date();
  const crossYears = start.getFullYear() !== end.getFullYear();
  const currentYear = now.getFullYear();
  const needsYear =
    includeYear === 'always' ||
    (includeYear === 'auto' && (crossYears || start.getFullYear() !== currentYear || end.getFullYear() !== currentYear));

  // date/time formatters
  const baseDateOpts: Intl.DateTimeFormatOptions = {
    timeZone,
    month: 'short',
    day: 'numeric',
    ...(includeWeekday ? { weekday: 'short' } : {}),
    ...(needsYear ? { year: 'numeric' } : {}),
  };
  const fmtDate = (d: Date) => new Intl.DateTimeFormat(locale, baseDateOpts).format(d);

  const baseTimeOpts: Intl.DateTimeFormatOptions =
    timeFmt === 'medium'
      ? { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric' }
      : { timeZone, hour: 'numeric', minute: '2-digit' };
  const fmtTime = (d: Date) => new Intl.DateTimeFormat(locale, baseTimeOpts).format(d);

  const same = sameDay(start, end);
  let body = '';

  if (allDay) {
    if (same) {
      body = `${fmtDate(start)} · All day`;
    } else {
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
    if (end <= start) {
      body = `${fmtDate(start)} · ${fmtTime(start)}`;
    } else if (same) {
      const startT = fmtTime(start);
      const endT = fmtTime(end);
      const suffix = endT.split(' ').slice(-1)[0];
      const collapse = /[AP]M/i.test(suffix || '') && startT.endsWith(suffix);
      const startCompacted = collapse ? startT.replace(` ${suffix}`, '') : startT;
      body = `${fmtDate(start)} · ${startCompacted}–${endT}`;
    } else {
      body = `${fmtDate(start)}, ${fmtTime(start)} – ${fmtDate(end)}, ${fmtTime(end)}`;
    }
  }

  if (opts.includeLocation) {
    body += ` · @ ${opts.includeLocation}`;
  }
  return body;
}
