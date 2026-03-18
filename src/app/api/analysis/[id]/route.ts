import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { supabaseServer as supabase } from "@/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Fetch the analysis run
    const { data: run, error } = await supabase
      .from("analysis_runs")
      .select("*")
      .eq("id", id)
      .eq("owner_id", admin.sub)
      .single();

    if (error || !run) {
      return NextResponse.json(
        { error: "Analysis run not found" },
        { status: 404 }
      );
    }

    // Fetch linked documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("run_id", id);

    return NextResponse.json({ run, documents: documents ?? [] });
  } catch (err) {
    console.error("Analysis [id] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
