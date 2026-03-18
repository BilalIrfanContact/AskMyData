"use client";

import { useRef, useState } from "react";

type CSVUploaderProps = {
  onUpload: (file: File) => void;
  isUploading: boolean;
};

export default function CSVUploader({ onUpload, isUploading }: CSVUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    onUpload(file);
  };

  return (
    <div
      className={`rounded-2xl border border-dashed bg-white/80 px-8 py-10 text-center transition ${
        dragActive ? "border-ocean shadow-glow" : "border-slate-200"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0] ?? null;
        handleFile(file);
      }}
    >
      <h2 className="text-2xl font-semibold">Upload a CSV to start</h2>
      <p className="mt-2 text-sm text-slate-600">
        Drag and drop your file here, or use the button below.
      </p>
      <button
        type="button"
        className="mt-6 rounded-full bg-ink text-white px-6 py-2 text-sm font-semibold transition hover:bg-ink/90"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Choose CSV File"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      <p className="mt-3 text-xs text-slate-500">Your file stays in memory for this session.</p>
    </div>
  );
}
