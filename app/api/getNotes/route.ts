import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query
        (
            'SELECT date, notes FROM meeting_notes ORDER BY date DESC'
        );
        return NextResponse.json(result.rows);
    }
    catch (error){
        console.error('DB Error: ' + error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}