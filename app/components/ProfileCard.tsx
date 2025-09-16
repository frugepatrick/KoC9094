'use client';

type Profile = {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  subtitle?: string; // e.g., "Grand Knight" or "Member"
};

export default function ProfileCard({ name, email, role, avatarUrl, subtitle }: Profile) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body d-flex align-items-center">
        <img
          src={avatarUrl || 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + encodeURIComponent(name)}
          alt={name}
          className="rounded-circle me-3"
          style={{ width: 56, height: 56, objectFit: 'cover' }}
        />
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="mb-0">{name}</h5>
              {subtitle && <div className="text-muted small">{subtitle}</div>}
            </div>
            {role && <span className="badge text-bg-secondary">{role}</span>}
          </div>
          {email && <div className="text-muted small mt-1">{email}</div>}
        </div>
      </div>
    </div>
  );
}
