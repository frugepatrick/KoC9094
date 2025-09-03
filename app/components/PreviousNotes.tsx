import React from "react";

interface PreviousNote {
    date: string;
    note: string;
    onClick : () => void;   
};

export default function PreviousNotes ({date, note, onClick} : PreviousNote) {
    //Splitting the note so that it doesn't read the whole note in the preview
    const truncatedNote = typeof note === "string" //make sure it is a string
    //if So split it (future will remove html stuff here)
    ? //note.replace(/<\/?[^>]+(>|$)/g, "").split(" ").slice(0, 10).join(" ") + "..."
    note.split(" ").slice(0, 10).join(" ") + "..."
    //else this diplayed
    : "No Preview Available";
    return (
        <div className="card p-4 hover:bg-gray-100 cursor-pointer" onClick={onClick}>
            <h3 className="mt-10 text-lg font-semibold" style={{color: 'var(--KoCBlue)'}}>Previous Notes</h3>
            <div className="col-2"> {date} </div>
            <div className="col-4"> {truncatedNote}</div>
        </div>
    )
}