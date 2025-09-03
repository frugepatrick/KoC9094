// app/api/saveNote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('POOL TYPE:', typeof pool);
    console.log('pool.query:', pool.query);

    const { date, notes } = await req.json();
//Check that both a date and notes exist
    if (!date || !notes) {
      return NextResponse.json({ error: 'Missing date or notes' }, { status: 400 });
    }
//Now check if a row exists for that date
const existing = await pool.query(
    'SELECT id FROM meeting_notes WHERE date = $1',
    [date]
);
if(existing.rows.length > 0) {
    //if it already exists -- update it
    await pool.query(
        'UPDATE meeting_notes SET notes = $1 WHERE date = $2',
        [notes, date]
    );
} else {
    //Doesnt exist already
    const query = 'INSERT INTO meeting_notes (date, notes) VALUES ($1, $2)';
    await pool.query(query, [date, notes]);
}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}