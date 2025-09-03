'use client';

import React, { useState } from 'react';
import Modal from '../app/components/Modal';

export default function ModalTestPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-6">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setShowModal(true)}
      >
        Show Modal
      </button>

      <Modal
        show={showModal}
        onclose={() => setShowModal(false)}
        title="Test Modal"
      >
        <p>This is a test modal content.</p>
        <p>Click the X to close it.</p>
        <div className="h-[1000px]">This forces scroll for testing height!</div>
      </Modal>
    </div>
  );
}