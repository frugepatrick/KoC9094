// app/layout.tsx (Server Component)
import Image from "next/image";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import Providers from "@/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
      <head>
          {/* Creating apple icons for saving webpage as a icon on phone homescreen */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Bootstrap CSS */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="d-flex flex-column min-vh-100">
        <Providers>
          {/* Navbar */}
          <nav className="navbar navbar-expand-lg navbar-dark border-bottom shadow-sm">
            <div className="container-fluid">
              {/* Brand: logo + title */}
              <Link href="/" className="navbar-brand d-flex align-items-center text-decoration-none">
                <Image
                  src="/KoC_Logo_No_Words.png"
                  alt="Knights of Columbus"
                  width={64}
                  height={64}
                  unoptimized
                  priority
                  className="img-fluid"
                  style={{ height: "auto", width: "auto", maxHeight: 64 }}
                />
                <span className="ms-3 mb-0 text-warning fw-semibold lh-sm d-none d-sm-inline">
                  Knights of Columbus<br className="d-none d-md-inline" />
                  <span className="d-inline d-md-none">Council 9094</span>
                  <span className="d-none d-md-inline"> Council 9094</span>
                </span>
              </Link>

              {/* Mobile toggler */}
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              {/* Collapsible links */}
              <div className="collapse navbar-collapse" id="navbarNav" >
                <ul className="navbar-nav" >
                  <li className="nav-item" >
                    <Link href="/" className="nav-link fw-bold">Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/members" className="nav-link fw-bold">Members</Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/calendar" className="nav-link fw-bold">Calendar</Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/about" className="nav-link fw-bold">About</Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/meetingNotes" className="nav-link fw-bold">Meeting Notes</Link>
                  </li>
                  {adminOrOfficer && (
                    <li className="nav-item">
                      <Link href="/admin/hoursReport" className="nav-link fw-bold">Hours Report</Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </nav>

          {/* Main */}
          <main style={{ backgroundColor: "var(--KoCGrey)" }}>
            <div className="container my-4 flex-grow-1">{children}</div>
          </main>

          {/* Footer */}
          <footer className="text-white text-center py-3 mt-auto" style={{ backgroundColor: "var(--KoCBlue)" }}>
            <p className="mb-0">© 2025 Knights of Columbus Council 9094</p>
          </footer>
        </Providers>

        {/* Bootstrap JS (bundle includes Popper) */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
