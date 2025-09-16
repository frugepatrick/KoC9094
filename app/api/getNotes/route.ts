import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface NoteRow extends RowDataPacket {
    date: string | Date;
    notes: string;
};
export async function GET() {
  try {
    console.log("Connecting to DB...")
    // Destructure rows from the [rows, fields] tuple
    const [rows] = await pool.execute<NoteRow[]>(
      'SELECT `date`, `notes` FROM `meeting_notes` ORDER BY `date` DESC'
    );
    return NextResponse.json(rows ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error){
        console.error('DB Error: ' + error);
        return NextResponse.json([], { status: 200 });
    }
}