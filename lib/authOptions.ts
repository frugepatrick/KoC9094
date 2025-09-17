import { type NextAuthOptions, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  memberId: string;
  name: string | null;
  role: "member" | "officer" | "admin" | "delegate";
  password_hash: string | null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Council Login",
      credentials: {
        memberId: { label: "Member ID", type: "text", placeholder: "ex:5555555" },
        password:  { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.memberId || !credentials.password) return null;
          const [rows] = await pool.query<UserRow[]>(
            `SELECT id, CAST(memberId AS CHAR) AS memberId, name, role, password_hash
             FROM users WHERE memberId = ? LIMIT 1`,
            [String(credentials.memberId)]
          );
          const user = rows?.[0];
          if (!user?.password_hash) return null;
          const ok = await bcrypt.compare(credentials.password, user.password_hash);
          if (!ok) return null;

          const signedInUser: User = {
            id: String(user.id),
            memberId: user.memberId,
            name: user.name,
            role: user.role,
          };
          return signedInUser;
        } catch (e) {
          console.error("Authorize error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.memberId = (user as any).memberId;
        token.role = (user as any).role;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        memberId: token.memberId as string,
        role: token.role as "member" | "officer" | "admin" | "delegate",
        name: (token.name as string | null),
      } as any;
      return session;
    },
  },
  pages: { signIn: "/signin" },
};
