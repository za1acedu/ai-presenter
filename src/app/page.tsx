"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "pdf": return "PDF";
    case "docx": return "DOC";
    case "txt": return "TXT";
    case "md": return "MD";
    case "csv": return "CSV";
    default: return "FILE";
  }
}

const ICON_COLORS: Record<string, string> = {
  PDF: "bg-red-500/20 text-red-400",
  DOC: "bg-blue-500/20 text-blue-400",
  TXT: "bg-slate-500/20 text-slate-400",
  MD: "bg-purple-500/20 text-purple-400",
  CSV: "bg-green-500/20 text-green-400",
  FILE: "bg-slate-500/20 text-slate-400",
};

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [tone, setTone] = useState("professional");
  const [domain, setDomain] = useState("general");
  const [targetSlides, setTargetSlides] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = async () => {
    if (files.length === 0) return;
    setIsRunning(true);
    setError("");

    try {
      // Step 1: Upload files to /api/documents/upload
      setProgress("Uploading files...");
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload files");
      }

      const uploadData = await uploadRes.json();
      const documentIds = (uploadData.documents as { id: string }[]).map((d) => d.id);

      // Step 2: Start analysis with document IDs
      setProgress("Starting analysis pipeline...");
      const analysisRes = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds,
          settings: { tone, domain, slidesCount: targetSlides },
        }),
      });

      if (!analysisRes.ok) {
        const data = await analysisRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start analysis");
      }

      const analysisData = await analysisRes.json();
      router.push(`/analysis/${analysisData.run.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setIsRunning(false);
      setProgress("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          AI Multi-Agent Document Presenter
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Upload documents and let AI agents analyze, synthesize, and create
          presentations for you.
        </p>
        <a
          href="/admin/login"
          className="mt-2 inline-block text-sm text-slate-600 transition-colors hover:text-slate-400"
        >
          Admin Panel
        </a>
      </div>

      {/* File Upload */}
      <section className="mb-8">
        <FileUpload onFilesSelected={handleFilesSelected} />
      </section>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Uploaded Files ({files.length})
          </h2>
          <div className="space-y-2">
            {files.map((file, index) => {
              const icon = getFileIcon(file.name);
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${ICON_COLORS[icon]}`}
                    >
                      {icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Analysis Settings */}
      <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Analysis Settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="business">Business</option>
              <option value="academic">Academic</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Target Slides</label>
            <input
              type="number"
              min={1}
              max={50}
              value={targetSlides}
              onChange={(e) => setTargetSlides(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
          {progress}
        </div>
      )}

      {/* Run Button */}
      <button
        onClick={handleRunAnalysis}
        disabled={files.length === 0 || isRunning}
        className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Starting Analysis...
          </span>
        ) : (
          "Run Deep Analysis"
        )}
      </button>
    </div>
  );
}
