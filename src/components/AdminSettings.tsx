"use client";

import { useState, useEffect } from "react";

interface Settings {
  claude_api_key: string;
  google_api_key: string;
  nano_banana_api_key: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    claude_api_key: "",
    google_api_key: "",
    nano_banana_api_key: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const s = data.settings ?? data;
          setSettings({
            claude_api_key: s.claude_api_key ?? "",
            google_api_key: s.google_api_key ?? "",
            nano_banana_api_key: s.nano_banana_api_key ?? "",
          });
        }
      } catch {
        // ignore load errors
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save settings");
      }
      setFeedback({ type: "success", message: "Settings saved successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message ?? "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  const fields: { key: keyof Settings; label: string }[] = [
    { key: "claude_api_key", label: "Claude API Key" },
    { key: "google_api_key", label: "Google API Key" },
    { key: "nano_banana_api_key", label: "Nano Banana API Key" },
  ];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">API Settings</h2>
      <div className="space-y-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {label}
            </label>
            <input
              type="password"
              value={settings[key]}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, [key]: e.target.value }))
              }
              placeholder={`Enter ${label}`}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
