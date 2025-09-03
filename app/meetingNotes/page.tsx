'use client';
// app/meetingNotes/page.tsx
import React from "react";
import {useState, useEffect} from 'react';
import MeetingNotes from "../components/MeetingNotes";
import PreviousNotes from "../components/PreviousNotes";
import Modal from '../components/Modal';

interface Note {
    date: string,
    notes: string
};

export default function MeetingNotesPage () {
    const [previousNotes, setPreviousNotes] = useState<Note[]>([]);
    const [ShowModal, setShowModal] = useState(false); //Creating a modal useState
    const [activeNote, setActiveNote] = useState<Note | null>(null);

    useEffect(() => {
        const fetchNotes =  async () => {
            const res = await fetch('/api/getNotes');
            const data = await res.json();
            setPreviousNotes(data);
        };
    fetchNotes();
        }, []);
        const openModal = (note: Note) => {
            setActiveNote(note);
            setShowModal(true);
          };
        
          const closeModal = () => {
            setActiveNote(null);
            setShowModal(false);
          };
        return (
            <div>
                <div>
                <MeetingNotes />
                </div>
        
                <div className="mt-5">
                <h2 className="text-2xl font-bold mb-4">Previous Meetings</h2>
                {previousNotes.map((note, idx) => (
                    <PreviousNotes
                    key={idx}
                    date={note.date}
                    note={note.notes}
                    onClick={() => openModal(note)}
                    />
                ))}
                </div>
                
                {ShowModal && activeNote && (
                    <>
                    {console.log("ACTIVE NOTE:", activeNote)}
                    <Modal
                        show={ShowModal}
                        onclose={closeModal}
                        title={`Meeting on ${new Date(activeNote.date).toDateString()}`}>
                        <div style={{ padding: '1rem' }}>
                            <div
                                style={{
                                    border: '1px solid blue',
                                    padding: '1rem',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: new DOMParser()
                                    .parseFromString(activeNote.notes, "text/html")
                                    .body.innerHTML,
                                }}
                            />
                        </div>
                    </Modal>
                    </>
                )}
            </div>
        );
}