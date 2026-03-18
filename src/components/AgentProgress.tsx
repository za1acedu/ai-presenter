"use client";

type AgentStatus = "pending" | "running" | "done" | "failed";

interface Agent {
  name: string;
  status: AgentStatus;
}

interface AgentProgressProps {
  agents: Agent[];
}

const AGENT_ICONS: Record<string, JSX.Element> = {
  Extraction: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Analysis: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  Synthesis: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
  Validation: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Presentation: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
    </svg>
  ),
};

const STATUS_STYLES: Record<AgentStatus, string> = {
  pending: "bg-slate-800 border-slate-700 text-slate-500",
  running: "bg-blue-950/60 border-blue-500/50 text-blue-300 animate-pulse-blue",
  done: "bg-green-950/40 border-green-500/50 text-green-300",
  failed: "bg-red-950/40 border-red-500/50 text-red-300",
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  pending: "Pending",
  running: "Running...",
  done: "Complete",
  failed: "Failed",
};

const STATUS_DOT: Record<AgentStatus, string> = {
  pending: "bg-slate-500",
  running: "bg-blue-400",
  done: "bg-green-400",
  failed: "bg-red-400",
};

export default function AgentProgress({ agents }: AgentProgressProps) {
  const doneCount = agents.filter((a) => a.status === "done").length;
  const progress = Math.round((doneCount / agents.length) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={`rounded-xl border p-4 transition-all duration-300 ${STATUS_STYLES[agent.status]}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="opacity-80">
                {AGENT_ICONS[agent.name] ?? AGENT_ICONS.Analysis}
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[agent.status]}`} />
            </div>
            <h3 className="text-sm font-semibold">{agent.name}</h3>
            <p className="mt-1 text-xs opacity-70">{STATUS_LABELS[agent.status]}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Overall Progress</span>
          <span className="font-mono text-slate-300">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
