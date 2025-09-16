'use client';
import React, { useEffect, useState } from "react";
import MemberCard, { MemberCardProps } from "../components/MemberCard";

// Match what your API actually returns! Adjust if your API uses firstname/lastname etc.
type MemberRow = {
  id: string;
  memberId: number;          // string if DB column is VARCHAR
  firstName: string;
  lastName: string;
  email: string | null;
  joinDate: string | null;   // "YYYY-MM-DD"
  position: string | null;
  address: string | null;
  homePhone: string | null;
  cellPhone: string | null;
  suffix: string | null;
};

// Generic sorter by property
function sortMembers<T>(arr: T[], property: keyof T): T[] {
  return [...arr].sort((a, b) =>
    String(a[property]).localeCompare(String(b[property]))
  );
}

// Optional helper for determining time in position if we can't get from KOC report
function monthsBetween(yyyyMmDd: string): string {
  const start = new Date(yyyyMmDd + "T00:00:00");
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0 && rem > 0) return `${years}y ${rem}m`;
  if (years > 0) return `${years}y`;
  return `${months}m`;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        console.log("Attempting to return members from DB...");
        // ✅ Make sure this path matches your API folder exactly:
        // e.g., app/api/members/route.ts  -> "/api/members"
        const res = await fetch("/api/getMembers", { cache: "no-store" });
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []); //setting the members to the array
      } catch (e) {
        console.error("Failed to fetch members", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // run once

  // Search
  const filtered = q
    ? members.filter((m) => {
        const hay = `${m.firstName} ${m.lastName} ${m.memberId} ${m.email ?? "-"}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : members;

  // Sort AFTER filtering so the shown list is sorted
  const sorted = sortMembers(filtered, "lastName");

  if (loading) return <div className="p-4">Loading Members....</div>;

  return (
  <div className="row">
    <div className="col-4">
      <h2>Member Directory</h2>
    </div>

    <div className="col-2" />

    <div className="col-6">
      <input
        className="form-control w-full max-w-md"
        placeholder="Search name, memberID, or email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>
    <div className="row"><br></br></div>

      <div className="row">
        <div className="col-12">

        {sorted.map((m) => {
          const cardProps: MemberCardProps = {
            firstName: m.firstName,
            lastName: m.lastName,
            joinDate: m.joinDate ?? "-",
            position: m.position ?? "Member",
            memberId: m.memberId ?? "-",
            email: m.email ?? "-",
            id: m.id,
            address: m.address ?? "-",
            homePhone: m.homePhone ?? "-",
            cellPhone: m.cellPhone ?? "-",
            suffix: m.suffix ?? "",
          };
          return <MemberCard key={m.id} {...cardProps} />;
        })}

        {sorted.length === 0 && (
          <div className="text-muted mt-2">No members found.</div>
        )}
      </div>
      </div>
      
    </div> 
  );       
}            
