"use client";

import { useState, useCallback, useRef } from "react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".csv"];

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf":
      return "\u{1F4C4}";
    case "docx":
      return "\u{1F4DD}";
    case "txt":
      return "\u{1F4C3}";
    case "md":
      return "\u{1F4D1}";
    case "csv":
      return "\u{1F4CA}";
    default:
      return "\u{1F4CE}";
  }
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAccepted = (file: File) => {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    return ACCEPTED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
  };

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const valid = Array.from(fileList).filter(isAccepted);
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
        isDragOver
          ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10"
          : "border-slate-600 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        <svg
          className={`h-12 w-12 transition-colors ${
            isDragOver ? "text-blue-400" : "text-slate-500"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.822 3.652A3.75 3.75 0 0118 19.5H6.75z"
          />
        </svg>
        <p className="text-lg font-medium text-slate-300">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-slate-500">
          or click to browse &mdash; PDF, DOCX, TXT, MD, CSV
        </p>
      </div>
    </div>
  );
}
