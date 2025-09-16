// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /** User object your app uses */
  interface User {
    id: string;
    memberId: string;
    role: "member" | "officer" | "admin" | "delegate";
    name: string | null;
  }

  /** Session returned by useSession/getServerSession */
  interface Session {
    user: {
      id: string;
      memberId: string;
      role: "member" | "officer" | "admin" | "delegate";
      name: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Fields stored in the JWT token */
  interface JWT {
    id: string;
    memberId: string;
    role: "member" | "officer" | "admin" | "delegate";
    name: string | null;
  }
}
