"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AgentProgress from "@/components/AgentProgress";
import PresentationView from "@/components/PresentationView";

type AgentStatus = "pending" | "running" | "done" | "failed";

interface Agent {
  name: string;
  status: AgentStatus;
}

const AGENT_NAMES = ["Extraction", "Analysis", "Synthesis", "Validation", "Presentation"];
const AGENT_FIELDS = ["agent1_result", "agent2_result", "agent3_result", "agent4_result", "agent5_result"] as const;

const TABS = ["Summary", "Extraction", "Analysis", "Synthesis", "Presentation"] as const;
type Tab = (typeof TABS)[number];

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [run, setRun] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${id}`);
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const json = await res.json();
      setRun(json.run ?? json);
      setFetchError("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load analysis";
      setFetchError(message);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Poll while running
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const interval = setInterval(fetchAnalysis, 2000);
    return () => clearInterval(interval);
  }, [run?.status, fetchAnalysis]);

  const handleGenerateSlides = async () => {
    setIsGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to generate slides");
      }
      await fetchAnalysis();
      setActiveTab("Presentation");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setGenError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (fetchError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading analysis...
        </div>
      </div>
    );
  }

  // Derive agent statuses from the run's agent result fields
  const agents: Agent[] = AGENT_NAMES.map((name, i) => {
    const field = AGENT_FIELDS[i];
    const hasResult = !!run[field];

    let status: AgentStatus = "pending";
    if (run.status === "failed" && !hasResult) {
      // Find the first agent without a result — that's the one that failed
      const firstEmpty = AGENT_FIELDS.findIndex((f) => !run[f]);
      if (i === firstEmpty) status = "failed";
      else if (i < firstEmpty) status = "done";
    } else if (run.status === "completed") {
      status = "done";
    } else if (hasResult) {
      status = "done";
    } else if (run.status === "running") {
      // First pending agent is "running"
      const firstEmpty = AGENT_FIELDS.findIndex((f) => !run[f]);
      if (i === firstEmpty) status = "running";
    }

    return { name, status };
  });

  const isCompleted = run.status === "completed";
  const isFailed = run.status === "failed";

  // Map tab names to data
  const tabData: Record<string, string | null> = {
    Summary: run.agent4_result || run.agent3_result || null, // validation or synthesis
    Extraction: run.agent1_result || null,
    Analysis: run.agent2_result || null,
    Synthesis: run.agent3_result || null,
  };

  const presentation = run.final_presentation_json;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <a
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
          <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
          <p className="mt-1 text-sm text-slate-400">ID: {id}</p>
        </div>
        <div>
          {isCompleted && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-300">Completed</span>
          )}
          {isFailed && (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300">Failed</span>
          )}
          {run.status === "running" && (
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-300">Running</span>
          )}
        </div>
      </div>

      {/* Agent Progress */}
      <section className="mb-8">
        <AgentProgress agents={agents} />
      </section>

      {/* Error */}
      {run.error_message && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {run.error_message}
        </div>
      )}

      {/* Results Tabs — show when at least one agent has results */}
      {(isCompleted || run.agent1_result) && (
        <section>
          {/* Tab bar */}
          <div className="mb-6 flex gap-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
            {activeTab !== "Presentation" && (
              <div>
                {tabData[activeTab] ? (
                  <pre className="whitespace-pre-wrap text-sm text-slate-300">
                    {tabData[activeTab]}
                  </pre>
                ) : (
                  <p className="text-slate-500">No data available yet for this step.</p>
                )}
              </div>
            )}

            {activeTab === "Presentation" && (
              <div>
                {presentation ? (
                  <>
                    <PresentationView presentation={presentation} />
                    <div className="mt-6 text-center">
                      {genError && (
                        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                          {genError}
                        </div>
                      )}
                      <button
                        onClick={handleGenerateSlides}
                        disabled={isGenerating}
                        className="rounded-xl bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:opacity-50"
                      >
                        {isGenerating ? "Generating Slides..." : "Generate Slides (Nano Banana + Google Slides)"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500">Presentation not generated yet.</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
