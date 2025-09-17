import NextAuth, { Awaitable, NextAuthOptions, RequestInternal, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";
import type { RowDataPacket } from "mysql2";

//Give the shape of the row in `users` table
interface UserRow extends RowDataPacket {
    id: number;
    memberId: string;
    name: string | null;	
    role: "member" | "officer" | "admin" | "delegate"; //enum just list the possibilities
    password_hash: string | null; //default = KOC9094!2025
}

const authOptions : NextAuthOptions = ({
    session: {strategy: "jwt"},
    providers: [
        Credentials({
            name: "Council Login",
            credentials: {
                memberId: { label: "Member ID", type: "text", placeholder: "ex:5555555" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    //if either don't match, return null
                    if (!credentials?.memberId || !credentials.password) {
                        console.log("Login missing credentials...");
                        return null;
                    }    
                
                    //find the user by memberId
                    const [rows] = await pool.query<UserRow[]>(
                        `SELECT id, CAST(memberId AS CHAR) AS memberId, name, role, password_hash FROM users WHERE memberId = ? LIMIT 1`,
                        [String(credentials.memberId)]
                    );
                    //setting variable for the user
                    const user = rows?.[0];
                    if (!user || !user.password_hash ) { 
                        console.warn("Login Failed: User not found or no password");
                        return null;
                    }
                    //verify the password
                    const ok = await bcrypt.compare(credentials.password, user.password_hash);
                    if (!ok) {
                        console.warn("Login Failed: Bad Password")
                        return null;
                    }
                        

                    //return the minimal user object to identify user for the JWT
                    //keep small as good practice for speed and for not sticking unnecessary data in it for security reasons
                    //already verified the password so no need to put here.
                    const signedInUser: User ={
                    id: String(user.id),
                    memberId: user.memberId,
                    name: user.name,
                    role: user.role,
                    };
                    console.log("Successful Login");
                    return signedInUser;   
                }
                catch (e) {
                    console.error("Authorize error:", e);
                    return null;            
                }
            },
        }),
    ],
    //establishing the token for callbacks. Remember that each page will require verification. Create token with JWT that will auth on each page.
    callbacks: {
        async jwt({token, user}) {
            //when user logs in, copy the fields into the token
            if (user) {
                token.id = user.id;
                token.memberId = user.memberId;
                token.role = user.role;
                token.name = user.name ?? token.name;                
            }
            return token;
        },
        //translate the token into the session for storing as a cookie
        async session({ session, token }) {
            session.user = {
            id: token.id as string,
            memberId: token.memberId as string,
            role: token.role as "member" | "officer" | "admin" | "delegate",
            name: (token.name as string | null),
            }
            return session;
        },
    },
pages: {
  signIn: "/signin",
},
});
const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};