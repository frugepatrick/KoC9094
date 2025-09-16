'use client';

import { formatDateRange } from '@/lib/date';
import type { EventRow } from '@/lib/events';

export default function EventItem({ ev }: { ev: EventRow }) {
  const allDay = ev.isAllDay === true;
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
      <div className="font-semibold">{ev.title}</div>
      <div className="text-sm text-gray-600">{when}</div>
      {ev.description && <div className="text-sm mt-1">{ev.description}</div>}
    </div>
  );
}
