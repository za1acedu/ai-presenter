/**
 * Validation Agent (Agent 4)
 *
 * Acts as a critical reviewer of the pipeline's outputs so far.
 * Checks for contradictions, missing pieces, and weak points.
 * Proposes corrections and improvements in a validation report.
 */

import { callClaude } from "../claude";

const SYSTEM_PROMPT = `You are a critical reviewer. Check for contradictions, missing pieces, weak points in the analysis. Propose corrections and improvements. Output a validation report that includes:

1. **Contradictions Found** — Any conflicting statements or inconsistencies between the extraction, analysis, and synthesis.
2. **Missing Information** — Important topics or aspects that were overlooked or insufficiently covered.
3. **Weak Points** — Arguments or claims that lack sufficient evidence or logical support.
4. **Factual Concerns** — Anything that appears potentially inaccurate or misleading.
5. **Proposed Corrections** — Specific suggestions to fix the issues identified above.
6. **Overall Quality Assessment** — A brief summary of the overall quality and readiness for presentation.

Be rigorous but constructive. Your feedback will be used to improve the final presentation output.`;

/**
 * Runs the Validation Agent on all prior agent outputs.
 *
 * @param apiKey - Anthropic API key
 * @param extractionResult - The output from the Extraction Agent
 * @param analysisResult - The output from the Analysis Agent
 * @param synthesisResult - The output from the Synthesis Agent
 * @returns A validation report with corrections and improvements
 */
export async function runValidationAgent(
  apiKey: string,
  extractionResult: string,
  analysisResult: string,
  synthesisResult: string
): Promise<string> {
  const userMessage = `Please critically review the following pipeline outputs for contradictions, gaps, and weaknesses.\n\n--- EXTRACTION RESULT ---\n${extractionResult}\n\n--- ANALYSIS RESULT ---\n${analysisResult}\n\n--- SYNTHESIS RESULT ---\n${synthesisResult}\n\nProvide a thorough validation report.`;

  return callClaude(apiKey, SYSTEM_PROMPT, userMessage);
}
