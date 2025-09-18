import React from "react";
import styles from "./MemberCard.module.css";

export interface MemberCardProps {
  id: string;
  memberId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  joinDate: string | null;
  position: string | null;
  address: string | null;
  homePhone: string | null;
  cellPhone: string | null;
  suffix: string | null;
}
export default function MemberCard({
  id,
  memberId,
  firstName,
  lastName,
  email,
  joinDate,
  position,
  address,
  homePhone,
  cellPhone,
  suffix,
}: MemberCardProps) {
  return (
    <div className={`card mb-1 shadow-sm ${styles.kocCard}`}>
      <div className={`card-body ${styles.kocCardBody}`}>
        <div className="row align-items-center">
          <div className={`col-md-2 fw-bold ${styles.memberName}`}>
            {firstName} {lastName}
          </div>
          <div className="col-md-3">
            <strong>Position:</strong> {position ?? "Member"}
          </div>
          <div className="col-md-3 text-start">
            <strong>MemberId:</strong> {memberId ?? "-"}
          </div>
          <div className="col-md-3 text-start">
            <strong>Email:</strong> {email ?? "-"}
          </div>
        </div>

        {/* Collapsible details */}
        <details className="mt-2">
          <summary className="cursor-pointer text-end">More details</summary>
          <div className={`mt-2 p-2 ${styles.kocCardDetails}`}>
            <div className="row align-items-center">
              <div className="col-md-4">
                <strong>Join Date:</strong>{" "}
                <span className={styles.value}>{joinDate ?? "-"}</span>
              </div>
              <div className="col-md-4 text-start">
                <strong>Home Phone:</strong>{" "}
                <span className={styles.value}>{homePhone ?? "-"}</span>
              </div>
              <div className="col-md-4 text-start">
                <strong>Cell Phone:</strong>{" "}
                <span className={styles.value}>{cellPhone ?? "-"}</span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
