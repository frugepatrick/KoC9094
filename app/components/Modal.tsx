import React from 'react';

interface ModalProps {
  show: boolean;
  onclose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ show, onclose, title, children }: ModalProps) {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'white',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '8px',
          padding: '1rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onclose}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            fontSize: '1.5rem',
            color: '#666',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>

        {title && <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{title}</h2>}

        <div style={{ fontSize: '1rem' }}>{children}</div>
      </div>
    </div>
  );
}
