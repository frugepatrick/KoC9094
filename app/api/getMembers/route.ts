import {NextResponse} from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface MemberRow extends RowDataPacket {
    id: string;
    memberId: number;
    firstName: string;
    lastName: string;
    email: string | null;
    joinDate: string | null;
    position: string | null;
    address: string | null;
    homePhone: string | null;
    cellPhone: string | null;
    suffix: string | null;
}

export async function GET() {
    try {
        console.log("Attempting to return list of members...");
        //Select from our DB
        const [rows] = await pool.query<MemberRow[]> (
        `
            SELECT
            id,
            CAST(memberid AS CHAR) AS memberId,
            firstname AS firstName,
            lastname  AS lastName,
            position,
            DATE_FORMAT(joindate, '%Y-%m-%d') AS joinDate,
            email,
            address,
            homePhone,
            cellPhone,
            suffix
            
            FROM members
            ORDER BY lastname, firstname
        `
        );
        // return the json or empty array/tuple
        return NextResponse.json(rows ?? [], {
            //don't cache the response
            headers: {"Cache-Control": "no-store"},
        /*  
            Cache-Control: max-age=3600 → “This response is fresh for 1 hour.”
            Cache-Control: no-cache → “Always check with the server before using a cached version.”
            Cache-Control: no-store → “Never save this response at all. Always fetch fresh.” 
        */
            status:200,
            
        });
    } catch (err) {
        // logging detailed error on the server side
        console.error("GET /api/getMembers error: ", err);
        //display basic error response on client side
        return NextResponse.json({error: "Failed to load members"}, {status: 500});
    }
}