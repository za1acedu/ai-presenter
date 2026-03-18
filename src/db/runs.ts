import { SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface RunSettings {
  tone?: string;
  domain?: string;
  slides_count?: number;
  [key: string]: unknown;
}

export interface AnalysisRun {
  id: string;
  owner_id: string;
  status: RunStatus;
  agent1_result: string | null;
  agent2_result: string | null;
  agent3_result: string | null;
  agent4_result: string | null;
  agent5_result: string | null;
  final_presentation_json: Record<string, unknown> | null;
  error_message: string | null;
  settings: RunSettings;
  created_at: string;
  updated_at: string;
}

export interface CreateRunParams {
  owner_id: string;
  settings?: RunSettings;
}

// ----------------------------------------------------------------
// Data access functions
// ----------------------------------------------------------------

/**
 * Create a new analysis run (defaults to 'pending' status).
 */
export async function createRun(
  supabase: SupabaseClient,
  params: CreateRunParams
): Promise<AnalysisRun> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .insert({
      owner_id: params.owner_id,
      settings: params.settings ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as AnalysisRun;
}

/**
 * Update the status of a run. Optionally set an error message when
 * transitioning to the 'failed' status.
 */
export async function updateRunStatus(
  supabase: SupabaseClient,
  runId: string,
  status: RunStatus,
  errorMessage?: string | null
): Promise<AnalysisRun> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage !== undefined) {
    updates.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from("analysis_runs")
    .update(updates)
    .eq("id", runId)
    .select()
    .single();

  if (error) throw error;
  return data as AnalysisRun;
}

/**
 * Store the result produced by a specific agent (1-5).
 */
export async function updateAgentResult(
  supabase: SupabaseClient,
  runId: string,
  agentNumber: 1 | 2 | 3 | 4 | 5,
  result: string
): Promise<AnalysisRun> {
  const column = `agent${agentNumber}_result` as const;

  const { data, error } = await supabase
    .from("analysis_runs")
    .update({
      [column]: result,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw error;
  return data as AnalysisRun;
}

/**
 * Store the final presentation JSON produced by the pipeline.
 */
export async function setFinalPresentation(
  supabase: SupabaseClient,
  runId: string,
  presentationJson: Record<string, unknown>
): Promise<AnalysisRun> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .update({
      final_presentation_json: presentationJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw error;
  return data as AnalysisRun;
}

/**
 * Fetch a single run by its ID.
 */
export async function getRunById(
  supabase: SupabaseClient,
  runId: string
): Promise<AnalysisRun | null> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // row not found
    throw error;
  }
  return data as AnalysisRun;
}

/**
 * Fetch all runs belonging to a given owner, most recent first.
 */
export async function getRunsByOwnerId(
  supabase: SupabaseClient,
  ownerId: string
): Promise<AnalysisRun[]> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AnalysisRun[];
}
