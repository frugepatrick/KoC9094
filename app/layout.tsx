import Image from "next/image";
import "./globals.css";
import Link from "next/link";

// Page metadata
export const metadata = {
  title: "Knights of Columbus -- 9094",
  description: "Knights of Columbus Council 9094 member application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">

        {/* Header */}
        <header className="bg-white border-bottom shadow-sm py-3">
          <div className="row">
            <div className="col-3 container d-flex align-items-center">
              <Image
                src="/KoC_Logo.png"
                alt="Knights of Columbus"
                width={80}
                height={0}
                className="img-fluid"
                style={{ height: "auto", width: "auto", maxHeight: "80px" }}
              />
            </div>
            <div className="col-6">
              <h1 className="ms-4 h2 text-warning mb-0">
                Knights of Columbus Council 9094
              </h1>
            </div>
            <div className="col-3"> </div>
          </div>

        </header>

        {/* Navigation */}
        <nav className="">
          <div className="container d-flex justify-content-evenly w-100 py-2">
            <Link href="/" className="text-white text-decoration-none">
              Home
            </Link>
            <Link href="/members" className="text-white text-decoration-none">
              Members
            </Link>
            <Link href="/events" className="text-white text-decoration-none">
              Events
            </Link>
            <Link href="/about" className="text-white text-decoration-none">
              About
            </Link>
            <Link href="/meetingNotes" className="text-white text-decoration-none">
              Meeting Notes
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{backgroundColor: 'var(--KoCGrey)'}}>
          <div className="container my-4 flex-grow-1">
            {children}
          </div>
            
        </main>

        {/* Footer */}
        <footer className="text-white text-center py-3 mt-auto" style={{backgroundColor:'var(--KoCBlue)'}}>
          <p className="mb-0">
            &copy; 2025 Knights of Columbus Council 9094
          </p>
        </footer>
      </body>
    </html>
  );
}
