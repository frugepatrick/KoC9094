'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // optional tweaks
        duration: 5000,
        style: { zIndex: 9999 },
      }}
    />
  );
}