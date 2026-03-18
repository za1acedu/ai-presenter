import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { supabaseServer as supabase } from "@/db/client";
import { runPipeline } from "@/lib/agents";

// ---------- POST: start a new analysis run ----------

export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentIds, settings } = body as {
      documentIds?: string[];
      settings?: { tone?: string; domain?: string; slidesCount?: number };
    };

    if (!documentIds?.length) {
      return NextResponse.json(
        { error: "documentIds array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Create the analysis run
    const { data: run, error: runError } = await supabase
      .from("analysis_runs")
      .insert({
        owner_id: admin.sub,
        status: "running",
        settings: {
          tone: settings?.tone ?? "professional",
          domain: settings?.domain ?? "general",
          slides_count: settings?.slidesCount ?? 10,
        },
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("Failed to create analysis run:", runError);
      return NextResponse.json(
        { error: "Failed to create analysis run" },
        { status: 500 }
      );
    }

    // Link the documents to this run
    const { error: linkError } = await supabase
      .from("documents")
      .update({ run_id: run.id })
      .in("id", documentIds);

    if (linkError) {
      console.error("Failed to link documents:", linkError);
    }

    // Fire-and-forget: start the real 5-agent pipeline in the background
    runPipeline(run.id, documentIds).catch((err) =>
      console.error(`Pipeline failed for run ${run.id}:`, err)
    );

    return NextResponse.json({ run }, { status: 201 });
  } catch (err) {
    console.error("Analysis POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------- GET: list runs for the authenticated admin ----------

export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: runs, error } = await supabase
      .from("analysis_runs")
      .select("*")
      .eq("owner_id", admin.sub)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch runs:", error);
      return NextResponse.json(
        { error: "Failed to fetch analysis runs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ runs });
  } catch (err) {
    console.error("Analysis GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
