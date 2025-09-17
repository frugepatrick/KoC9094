// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import UpcomingEvents from "./components/UpcomingEvents";
import VolunteerHoursCard from "./components/VolunteerHoursCard";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container my-4">
      {!session?.user ? (
        <div className="text-center">
          <h1 className="h3 mb-3">Welcome</h1>
          <a className="btn btn-primary" href="/api/auth/signin">Sign in</a>
        </div>
      ) : (
        <div className="row g-4">
          {/* Profile */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 mb-3">Your Profile</h2>
                <dl className="row mb-0">
                  <dt className="col-4">Name</dt>
                  <dd className="col-8">{session.user.name ?? "—"}</dd>

                  <dt className="col-4">Member ID</dt>
                  <dd className="col-8">{session.user.memberId}</dd>

                  <dt className="col-4">Role</dt>
                  <dd className="col-8 text-capitalize">{session.user.role}</dd>
                </dl>
              </div>
            </div>
            <div className="row g-4">
</div>
          </div>

          {/* Upcoming Events (with Create button gated by role) */}
          <div className="col-12 col-lg-8">
            <UpcomingEvents title="Upcoming Events" limit={6} />
          </div>
              <div className="mt-4">
                <VolunteerHoursCard />
              </div>
        </div>
        
      )}
    </div>
  );
}
