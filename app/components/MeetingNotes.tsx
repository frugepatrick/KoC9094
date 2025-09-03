import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

export default function MeetingNotes() {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [date, setDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: `
    <h3><u>Call to Order By:</u></h3><p><br/></p>
    <h3><u>Role Call:</u></h3>
    <li>Grand Knight: </li> 
    <li>Chaplain: </li>
    <li>Recorder: </li>
    <h3><u>Opening Prayer By:</u></h3><p><br/></p>
    <h3><u>Approve Minutes of Prior Meeting:</u></h3><p><br/></p>
    <h3><u>Chaplain's Message:</u></h3><p><br/></p>
    <h3><u>Grand Knight's Report:</u></h3><p><br/></p>
    <h3><u>Financial Report:</u></h3><p><br/></p>
    <h3><u>Membership Report:</u></h3><p><br/></p>
    <h3><u>Faith:</u></h3><p><br/></p>
    <h3><u>Family:</u></h3><p><br/></p>
    <h3><u>Community:</u></h3><p><br/></p>
    <h3><u>Fourth Degree Report:</u></h3><p><br/></p>
    <h3><u>Field Agent Report:</u></h3><p><br/></p>
    <h3><u>District Deputy Report:</u></h3><p><br/></p>
    <h3><u>Unfinished Business:</u></h3><p><br/></p>
    <h3><u>New Business</u></h3><p><br/></p>
    <h3><u>Good of the Order:</u></h3>    
    <h2><li>Family of the Quarter </li></h2><p>-</p>
    <h2><li>Knight Of The Quarter </li></h2><p>-</p>
    <h2><li>Prayers for the Following: </li></h2><p>-</p>
    <h3><u>Lectures Reflection:</u></h3><p><br/></p>
    <h3><u>Grand Knight's Summary:</u></h3><p><br/></p>    
    <h3><u>Closing Prayer</u></h3><p><br/></p>
    <h3><u>Closing Meeting At:</u></h3><p><br/></p>
    <h3><u>Next Meeting:</u></h3><p><br/></p>
    <h3><u>Recorder:</u></h3><p><br/></p>
    <h3><u>Motions</u></h3><p><br/></p>
    <h3><u>Extra Notes</u></h3><p><br/></p>
    `,
  }, [editorLoaded]); // Editor will reinit after client-only mount

  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  const handleSave = async () => {
    const content = editor?.getHTML();
    try {
      const response = await fetch('/api/saveNote', {
        method: 'Post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({date, notes: content }),
      });
      const result = await response.json();
      
      if(response.ok) {
        alert('Meeting Notes Saved');
      }else {
        alert('Error:' + result.error)
      }
    }
    catch(error) {
        console.error('Failed to save notes:', error);
        alert('Something went wrong saving the notes.');
    }

    console.log({ date, notes: content });
    alert("Saved!");
  }
  const handleSendTestEmail = async () => {
    try {
      const res = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toLocaleDateString(),
          notes: '<p>This is a test email from the Knights app. ✅</p>',
          to: 'fruge.patrick@gmail.com',
        }),
      });
  
      // Check content-type first to avoid parsing non-JSON
      const contentType = res.headers.get('content-type') || '';
      const isJSON = contentType.includes('application/json');
  
      const data = isJSON ? await res.json() : { error: 'Unexpected response format.' };
  
      if (res.ok) {
        alert('Email sent successfully!');
      } else {
        alert(`Email failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Client-side error:', err);
      alert('Something went wrong sending the test email.');
    }
  };
  

  return (
    <div className="card p-4">
      <h3>New Meeting Notes</h3>
      <div className="mb-3">
        <label className="form-label">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Notes:</label>
        <div className="border rounded p-2" style={{ minHeight: "300px" }}>
          {editor ? <EditorContent editor={editor} /> : <p>Loading editor...</p>}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        Save Notes
      </button>
      <button
      onClick={handleSendTestEmail} className="p-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
        Send Test Email
      </button>
    </div>
  );
}