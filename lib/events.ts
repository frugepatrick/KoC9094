'use client';

import { useEffect, useState, useCallback } from 'react';

export type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  isAllDay: boolean | null;
  startTime: string; // e.g. "2025-09-21 08:00:00" or ISO
  endTime: string;   // e.g. "2025-09-21 10:00:00" or ISO
  createdBy: string;
};

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
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [range?.from, range?.to]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, reload: load };
}
