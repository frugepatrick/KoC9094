import { join } from "path";
import React from "react";

//create the Member
interface Member {
    firstName: string;
  lastName: string;
  joinDate: string;
  isActive: boolean;
  position: string;
  timeInPosition: string;
}
//constructthe function and send the parameters of Member 
//(can easily just send member: Member , but this way makes calling
// The individual attributes easier AKA: no Member.firstName)

export default function MemberCard({
    firstName,
    lastName,
    joinDate,
    isActive,
    position,
    timeInPosition,
  }: Member) {
    return (
      <div className="card mb-1 shadow-sm koc-card">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-2 fw-bold">
              {firstName} {lastName}
            </div>
            <div className="col-md-2">
              <small className="text-light">Joined:</small> {joinDate}
            </div>
            <div className="col-md-3">
              <strong>Position:</strong> {position}
            </div>
            <div className="col-md-3 text-start">
              <strong>Time:</strong> {timeInPosition}
            </div>
            <div className="col-md-2">
              <strong>Status:</strong>{" "}
              <span className={isActive ? "text-success" : "text-danger"}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  