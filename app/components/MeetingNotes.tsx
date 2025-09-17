'use client';

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useSession } from "next-auth/react";

export default function MeetingNotes() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canEdit = role === "admin" || role === "officer";

  const [editorLoaded, setEditorLoaded] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const editor = useEditor(
    {
      editable: canEdit,
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ],
      content: `
        <h3><u>Call to Order By:</u></h3><p></p>
        <h3><u>Opening Prayer By:</u></h3><p></p>

        <h3><u>Role Call:</u></h3>
        <ul>
          <li>Grand Knight -</li><li>Chaplain -</li><li>Deputy Grand Knight -</li>
          <li>Chancellor -</li><li>Recorder -</li><li>Financial Sec -</li>
          <li>Treasurer -</li><li>Lecturer -</li><li>Advocate -</li>
          <li>Warden -</li><li>Inside Guard -</li><li>Outside Guard -</li>
          <li>Trustee (1st) -</li><li>Trustee (2nd) -</li><li>Trustee (3rd) -</li>
        </ul>

        <h3><u>Approve Minutes of Prior Meeting:</u></h3><p></p>
        <h3><u>Chaplain's Message:</u></h3><p></p>
        <h3><u>Grand Knight's Report:</u></h3><p></p>

        <h3><u>Financial Report:</u></h3>
        <ul>
          <li>Started: $</li><li>Deposits: $</li><li>pig = $</li>
          <li>Raffle Drawing = $</li><li>Owed Priest ed = $</li>
          <li>Owed Raffle Drawings = $</li><li>Owe Supreme = $</li>
          <li>Other Owed = $</li><li>Owed State: $</li>
          <li>Actual ending Balance = $</li>
        </ul>

        <h3><u>Membership Report:</u></h3><p></p>
        <ul><li>Total members:</li><li>New members:</li></ul>

        <h3><u>Faith:</u></h3><p></p>
        <h3><u>Family:</u></h3><p></p>
        <h3><u>Community:</u></h3><p></p>
        <h3><u>Fourth Degree Report:</u></h3><p></p>
        <h3><u>Field Agent Report:</u></h3><p></p>
        <h3><u>District Deputy Report:</u></h3><p></p>

        <h3><u>Unfinished Business:</u></h3><p></p>
        <h3><u>New Business:</u></h3><p></p>

        <h3><u>Good of the Order:</u></h3>
        <ul>
          <li>Family of the Quarter</li>
          <li>Knight Of The Quarter</li>
          <li>Prayers for the Following:</li>
        </ul><p></p>

        <h3><u>Lecturer's Reflection:</u></h3><p></p>
        <h3><u>Grand Knight's Summary:</u></h3><p></p>
        <h3><u>Closing Prayer:</u></h3><p></p>
        <h3><u>Closing Meeting At:</u></h3><p></p>
        <h3><u>Next Meeting:</u></h3><p></p>
        <h3><u>Recorder:</u></h3><p></p>
        <h3><u>Motions:</u></h3><p></p>
        <h3><u>Extra Notes:</u></h3><p></p>
      `,
    },
    [editorLoaded, canEdit]
  );

  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  async function handleSave() {
    const content = editor?.getHTML() ?? "";
    try {
      const res = await fetch("/api/saveNote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, notes: content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Error: ${data.error || "Failed to save notes"}`);
        return;
      }
      alert("Meeting Notes Saved");
    } catch (err) {
      console.error("Failed to save notes:", err);
      alert("Something went wrong saving the notes.");
    }
  }

  async function handleSendTestEmail() {
    try {
      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toLocaleDateString(),
          notes: "<p>This is a test email from the Knights app. ✅</p>",
          to: "fruge.patrick@gmail.com",
        }),
      });
      const isJSON = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJSON ? await res.json() : { error: "Unexpected response format." };

      if (res.ok) alert("Email sent successfully!");
      else alert(`Email failed: ${data.error || res.statusText}`);
    } catch (err) {
      console.error("Client-side error:", err);
      alert("Something went wrong sending the test email.");
    }
  }

  // Non-editors: hide the editor entirely
  if (!canEdit) {
    return null;
  }

  // Editors: show a collapsed card with toggle
  return (
    <div className="card">
      <div className="card-body">
        {/* Toggle */}
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="h5 m-0">New Meeting Notes</h3>
          <button
            className="btn btn-outline-primary btn-sm"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#newNotesCollapse"
            aria-expanded="false"
            aria-controls="newNotesCollapse"
          >
            Toggle Editor
          </button>
        </div>

        {/* Collapsible content */}
        <div className="collapse mt-3" id="newNotesCollapse">
          <div className="mb-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Notes</label>
            <div className="border rounded p-2" style={{ minHeight: "300px" }}>
              {editor ? (
                <EditorContent editor={editor} />
              ) : (
                <p className="text-muted m-0">Loading editor…</p>
              )}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={handleSave}>
              Save Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
