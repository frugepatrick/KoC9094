// lib/rbac.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export type Role = "member" | "officer" | "admin" | "delegate";

export async function requireRole(allowed: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Response("Unauthorized", { status: 401 });
  const role = session.user.role as Role;
  if (!allowed.includes(role)) throw new Response("Forbidden", { status: 403 });
  return session; // has user.id, memberId, role, name
}