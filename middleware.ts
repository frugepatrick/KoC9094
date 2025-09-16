// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // protect EVERYTHING except:
    // - next-auth endpoints
    // - static assets & next internals
    // - the custom /signin page
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|public|signin).*)",
  ],
};
