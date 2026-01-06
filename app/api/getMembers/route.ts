import {NextResponse} from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        console.log("Attempting to return list of members...");
        //Select from our DB
        const members = await prisma.members.findMany({
            select: {
                id: true,
                memberid: true,
                firstname: true,
                lastname: true,
                position: true,
                joindate: true,
                email: true,
                address: true,
                homePhone: true,
                cellPhone: true,
                suffix: true,
            },
            orderBy: [{lastname: "asc"}, {firstname:"asc"}],
        });

        const rows = members.map((m) => ({
            id: m.id,
            memberid: m.memberid,                // rename
            firstname: m.firstname,
            lastname: m.lastname,
            email: m.email,
            joinDate: m.joindate
                ? m.joindate.toISOString().slice(0, 10)
                : null,
            position: m.position,
            address: m.address,
            homePhone: m.homePhone,
            cellPhone: m.cellPhone,
            suffix: m.suffix,
        }));
        console.log("first row:", rows?.[0]);
        // return the json or empty array/tuple
        return NextResponse.json(rows, {
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