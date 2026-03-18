"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSettings from "@/components/AdminSettings";
import RunHistory from "@/components/RunHistory";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        setIsAuthed(true);
      } catch {
        router.push("/admin/login");
      } finally {
        setIsChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (isChecking || !isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Checking authentication...
        </div>
      </div>
    );
  }

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
            Home
          </a>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/admin/login");
          }}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          Logout
        </button>
      </div>

      {/* Settings */}
      <section className="mb-8">
        <AdminSettings />
      </section>

      {/* Run History */}
      <section>
        <RunHistory />
      </section>
    </div>
  );
}
