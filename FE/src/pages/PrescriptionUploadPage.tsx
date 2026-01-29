import React, { useState } from "react"; import { FileUp, Upload } from 'lucide-react'
const PrescriptionUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const submit = () => {
    // placeholder upload
    alert("Prescription uploaded (placeholder)");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Tải đơn kính</h1>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4"
      />
      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={!file}
      >
        Tải lên
      </button>
    </div>
  );
};

export default PrescriptionUploadPage;
