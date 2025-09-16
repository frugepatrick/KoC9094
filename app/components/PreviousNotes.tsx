import React from "react";

interface PreviousNote {
    date: string | Date;
    note: string | null | undefined;
    onClick : () => void;   
};

export default function PreviousNotes ({date, note, onClick} : PreviousNote) {
    //Splitting the note so that it doesn't read the whole note in the preview
    const truncatedNote = typeof note === "string" //make sure it is a string
    //if So get rid of any html
    ? note.replace(/<\/?[^>]+(>|$)/g, "").split(" ").slice(0, 10).join(" ") + "..."
    //else this diplayed
    : "No Preview Available";
    const parsed = new Date(date);
    const displayDate = isNaN(parsed.getTime()) ? "Invalid Date"
    : parsed.toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
    return (
        <div className="card p-4 hover:bg-gray-100 cursor-pointer" onClick={onClick}>
            <h3 className="mt-10 text-lg font-semibold" style={{color: 'var(--KoCBlue)'}}>{displayDate}</h3>
            <div className="col-4"> {truncatedNote}</div>
        </div>
    )
}