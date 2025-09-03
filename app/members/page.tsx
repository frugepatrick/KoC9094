import React from "react";
import MemberCard from "../components/MemberCard";

// app/members/page.tsx

const members = [
    {
      firstName: 'Jimmy',
      lastName: 'Ladner',
      joinDate: '2008-01-01',
      isActive: true,
      position: 'Grand Knight',
      timeInPosition: '06-01-2023',
    },
    {
      firstName: 'Matt',
      lastName: 'Delahousey',
      joinDate: '2014-01-01',
      isActive: true,
      position: 'Deputy Grand Knight',
      timeInPosition: '06-08-2022',
    },
    {
      firstName: 'Patrick',
      lastName: 'Fruge',
      joinDate: '2025-01-01',
      isActive: true,
      position: 'Recorder',
      timeInPosition: '2025-06-06',
    },
    {
      firstName: 'David',
      lastName: 'Seymour',
      joinDate: '1980-01-01',
      isActive: true,
      position: '',
      timeInPosition: '',
    },
    {
      firstName: 'Stephen',
      lastName: 'Dunn',
      joinDate: '2018-01-01',
      isActive: false,
      position: '',
      timeInPosition: '',
    },
  ];
  

export default function MembersPage() {
  //Generic function that allows for sort of anything we want (Obj, Parameter)
  function sortMembers<T>(arr: T[], property: keyof T): T[] {
    return [...arr].sort((a, b) =>
      String(a[property]).localeCompare(String(b[property]))
    );
  }
  // Create variable and call function. Pass it the obj and the Last Name
  const sortedMembers = sortMembers(members, "lastName");
  
    return (
      <div className="row">
        <div className="col-4" >
            <h2>
              Member Directory
            </h2>
        </div>
        <div className="col-2"></div>
        <div className="col-6">
          search: <input placeholder="lookup a fellow brother"></input>
        </div>       

        {sortedMembers.map((member, index) => (
          <MemberCard key={index} {...member}/> // ...member means send all attr instead of calling each individually
        ))}
      </div>
    );
  }
  