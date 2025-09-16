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
//Upsert the data based on the date
/*
******************************************************* Example: (purpose of syntax) ****************************************************************************
🔹 Why the backticks ( ` … ` )?

Backticks in MySQL/MariaDB are like double quotes in Postgres or square brackets in SQL Server.

They’re used to escape identifiers (table names, column names).

You need them here because date is also a reserved word in SQL. Without backticks, MySQL could confuse date the column with the DATE data type.

So:

SELECT date FROM meeting_notes   -- ❌ might error
SELECT `date` FROM meeting_notes -- ✅ explicit “this is the column name”

🔹 Placeholders (the ?)

With mysql2, you don’t use $1, $2 like Postgres. Instead you use ?.

Each ? is replaced with the next item in the array you pass.
🔹🔹🔹
await pool.execute(
  'INSERT INTO meeting_notes (`date`, `notes`) VALUES (?, ?)',
  [date, notes]
);
If date = "2025-09-04" and notes = "Discussed new members", mysql2 sends:
INSERT INTO meeting_notes (`date`, `notes`)
VALUES ('2025-09-04', 'Discussed new members');
🔹🔹🔹
*/

await pool.execute(
  `INSERT INTO \`meeting_notes\` (\`date\`, \`notes\`)
    VALUES (?,?)
    ON DUPLICATE KEY UPDATE \`notes\` = VALUES(\`notes\`)`, 
  [date, notes]
);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}