// app/layout.tsx (Server Component)
import Image from "next/image";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import Providers from "@/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path if different

export const metadata = {
  title: "Knights of Columbus -- 9094",
  description: "Knights of Columbus Council 9094 member application",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const adminOrOfficer = role === "admin" || role === "officer";

  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">
        <Providers>
          <header className="bg-white border-bottom shadow-sm py-3">
            <div className="row">
              <div className="col-3 container d-flex align-items-center">
                <Image src="/KoC_Logo.png" alt="Knights of Columbus" width={80} height={0}
                  className="img-fluid" style={{ height: "auto", width: "auto", maxHeight: "80px" }} />
              </div>
              <div className="col-6">
                <h1 className="ms-4 h2 text-warning mb-0">Knights of Columbus Council 9094</h1>
              </div>
              <div className="col-3" />
            </div>
          </header>

          <nav>
            <div className="container d-flex justify-content-evenly w-100 py-2">
              <Link href="/" className="text-white text-decoration-none">Home</Link>
              <Link href="/members" className="text-white text-decoration-none">Members</Link>
              <Link href="/calendar" className="text-white text-decoration-none">Calendar</Link>
              <Link href="/about" className="text-white text-decoration-none">About</Link>
              <Link href="/meetingNotes" className="text-white text-decoration-none">Meeting Notes</Link>
              {adminOrOfficer && (
                <Link href="/admin/hoursReport" className="text-white text-decoration-none">Hours Report</Link>
              )}
            </div>
          </nav>

          <main style={{ backgroundColor: "var(--KoCGrey)" }}>
            <div className="container my-4 flex-grow-1">{children}</div>
          </main>

          <footer className="text-white text-center py-3 mt-auto" style={{ backgroundColor: "var(--KoCBlue)" }}>
            <p className="mb-0">© 2025 Knights of Columbus Council 9094</p>
          </footer>
        </Providers>

        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
