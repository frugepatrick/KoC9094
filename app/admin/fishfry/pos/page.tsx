// app/admin/fishfry/pos/page.tsx
import Link from "next/link";

export default function FishFryPosHomePage() {
  return (
    <main
      className="container d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="row w-100 text-center">
        {/* LEFT - Kitchen */}
        <div className="col-md-6 mb-4 mb-md-0">
          <h2 className="mb-4">Are you in the Kitchen?</h2>

          <Link
            href="/admin/fishfry/pos/kitchen"
            className="btn btn-primary btn-lg w-100 py-4"
          >
            Go to Kitchen
          </Link>
        </div>

        {/* RIGHT - Order Taking */}
        <div className="col-md-6">
          <h2 className="mb-4">Are you Taking Orders?</h2>

          <Link
            href="/admin/fishfry/pos/order-entry"
            className="btn btn-primary btn-lg w-100 py-4"
          >
            Take Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
