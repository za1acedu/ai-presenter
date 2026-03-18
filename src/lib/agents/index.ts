/**
 * Pipeline Controller
 *
 * Orchestrates the 5-agent AI pipeline sequentially:
 *   1. Extraction — pulls structure from documents
 *   2. Analysis  — deep analytical review
 *   3. Synthesis — merges into coherent narrative
 *   4. Validation — critical review and corrections
 *   5. Presentation — generates slide deck JSON
 *
 * Each agent's result is persisted to the analysis_runs row as it
 * completes, providing real-time progress visibility. On success the
 * final presentation JSON is stored; on failure the error is recorded.
 */

import { supabaseServer as supabase } from "../../db/client";
import { runExtractionAgent } from "./extraction";
import { runAnalysisAgent } from "./analysis";
import { runSynthesisAgent } from "./synthesis";
import { runValidationAgent } from "./validation";
import { runPresentationAgent, PresentationSettings } from "./presentation";

/**
 * Updates a specific agent result column on the analysis_runs row.
 */
async function updateAgentResult(
  runId: string,
  agentColumn: string,
  result: string
): Promise<void> {
  const { error } = await supabase
    .from("analysis_runs")
    .update({ [agentColumn]: result, updated_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) {
    throw new Error(
      `Failed to update ${agentColumn} for run ${runId}: ${error.message}`
    );
  }
}

/**
 * Marks the run as failed with an error message.
 */
async function markRunFailed(runId: string, errorMessage: string): Promise<void> {
  await supabase
    .from("analysis_runs")
    .update({
      status: "failed",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

/**
 * Marks the run as completed with the final presentation JSON.
 */
async function markRunCompleted(
  runId: string,
  presentationJson: object
): Promise<void> {
  const { error } = await supabase
    .from("analysis_runs")
    .update({
      status: "completed",
      final_presentation_json: presentationJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(
      `Failed to mark run ${runId} as completed: ${error.message}`
    );
  }
}

/**
 * Fetches the Claude API key from the settings table for the run's owner.
 */
async function fetchApiKey(runId: string): Promise<string> {
  // First get the owner_id from the run
  const { data: run, error: runError } = await supabase
    .from("analysis_runs")
    .select("owner_id, settings")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    throw new Error(
      `Failed to fetch run ${runId}: ${runError?.message ?? "not found"}`
    );
  }

  // Fetch the API key from settings
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("claude_api_key")
    .eq("owner_id", run.owner_id)
    .single();

  if (settingsError || !settings) {
    throw new Error(
      `Failed to fetch settings for owner ${run.owner_id}: ${
        settingsError?.message ?? "not found"
      }`
    );
  }

  if (!settings.claude_api_key) {
    throw new Error("Claude API key is not configured in settings.");
  }

  return settings.claude_api_key;
}

/**
 * Fetches the run settings (tone, domain, slides_count) from the analysis_runs row.
 */
async function fetchRunSettings(
  runId: string
): Promise<PresentationSettings> {
  const { data: run, error } = await supabase
    .from("analysis_runs")
    .select("settings")
    .eq("id", runId)
    .single();

  if (error || !run) {
    throw new Error(
      `Failed to fetch run settings for ${runId}: ${error?.message ?? "not found"}`
    );
  }

  const s = run.settings as Record<string, unknown> | null;

  return {
    tone: (s?.tone as string) || "professional",
    domain: (s?.domain as string) || "general",
    slidesCount: (s?.slides_count as number) || 10,
  };
}

/**
 * Downloads document content from Supabase storage and concatenates it.
 */
async function fetchDocumentsContent(
  documentIds: string[]
): Promise<string> {
  const parts: string[] = [];

  for (const docId of documentIds) {
    // Get the document metadata
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_name, storage_path")
      .eq("id", docId)
      .single();

    if (docError || !doc) {
      throw new Error(
        `Failed to fetch document ${docId}: ${docError?.message ?? "not found"}`
      );
    }

    // Download the file content from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(
        `Failed to download document "${doc.file_name}" from storage: ${
          downloadError?.message ?? "no data returned"
        }`
      );
    }

    const text = await fileData.text();
    parts.push(`=== Document: ${doc.file_name} ===\n\n${text}`);
  }

  if (parts.length === 0) {
    throw new Error("No documents to process.");
  }

  return parts.join("\n\n---\n\n");
}

/**
 * Runs the full 5-agent AI pipeline for a given analysis run.
 *
 * @param runId - The UUID of the analysis_runs row
 * @param documentIds - Array of document UUIDs to process
 */
export async function runPipeline(
  runId: string,
  documentIds: string[]
): Promise<void> {
  try {
    // Mark run as running
    await supabase
      .from("analysis_runs")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", runId);

    // Fetch prerequisites
    const [apiKey, documentsContent, settings] = await Promise.all([
      fetchApiKey(runId),
      fetchDocumentsContent(documentIds),
      fetchRunSettings(runId),
    ]);

    // ── Agent 1: Extraction ──────────────────────────────────────
    const extractionResult = await runExtractionAgent(apiKey, documentsContent);
    await updateAgentResult(runId, "agent1_result", extractionResult);

    // ── Agent 2: Analysis ────────────────────────────────────────
    const analysisResult = await runAnalysisAgent(
      apiKey,
      documentsContent,
      extractionResult
    );
    await updateAgentResult(runId, "agent2_result", analysisResult);

    // ── Agent 3: Synthesis ───────────────────────────────────────
    const synthesisResult = await runSynthesisAgent(
      apiKey,
      extractionResult,
      analysisResult
    );
    await updateAgentResult(runId, "agent3_result", synthesisResult);

    // ── Agent 4: Validation ──────────────────────────────────────
    const validationResult = await runValidationAgent(
      apiKey,
      extractionResult,
      analysisResult,
      synthesisResult
    );
    await updateAgentResult(runId, "agent4_result", validationResult);

    // ── Agent 5: Presentation ────────────────────────────────────
    const presentationResult = await runPresentationAgent(
      apiKey,
      {
        extraction: extractionResult,
        analysis: analysisResult,
        synthesis: synthesisResult,
        validation: validationResult,
      },
      settings
    );
    await updateAgentResult(
      runId,
      "agent5_result",
      JSON.stringify(presentationResult)
    );

    // ── Complete ─────────────────────────────────────────────────
    await markRunCompleted(runId, presentationResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`Pipeline failed for run ${runId}:`, message);
    await markRunFailed(runId, message);
  }
}
