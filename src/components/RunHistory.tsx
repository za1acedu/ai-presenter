"use client";

import { useState, useEffect } from "react";

interface Run {
  id: string;
  status: string;
  created_at: string;
  document_count: number;
}

const STATUS_BADGE: Record<string, string> = {
  running: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
  pending: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) + "..." : id;
}

export default function RunHistory() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analysis");
        if (res.ok) {
          const data = await res.json();
          setRuns(data.runs ?? data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <p className="text-sm text-slate-500">Loading run history...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Run History</h2>

      {runs.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No analysis runs yet. Upload documents to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="pb-3 pr-4 font-medium text-slate-400">ID</th>
                <th className="pb-3 pr-4 font-medium text-slate-400">Status</th>
                <th className="pb-3 pr-4 font-medium text-slate-400">Created</th>
                <th className="pb-3 pr-4 font-medium text-slate-400">Documents</th>
                <th className="pb-3 font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const badgeClass =
                  STATUS_BADGE[run.status] ?? STATUS_BADGE.pending;
                return (
                  <tr
                    key={run.id}
                    className="border-b border-slate-700/30 last:border-0"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                      {shortId(run.id)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {formatDate(run.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {run.document_count}
                    </td>
                    <td className="py-3">
                      <a
                        href={`/analysis/${run.id}`}
                        className="text-blue-400 transition-colors hover:text-blue-300"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
