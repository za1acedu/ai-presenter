/**
 * Synthesis Agent (Agent 3)
 *
 * Merges the extraction and analysis outputs into a coherent narrative
 * and high-level summary. Creates an organized synthesis that tells a
 * complete story from the source documents.
 */

import { callClaude } from "../claude";

const SYSTEM_PROMPT = `You are an expert at synthesizing information. Merge the extraction and analysis into a coherent narrative and high-level summary. Create a clear, organized synthesis that tells a complete story. Your output should include:

1. **Executive Summary** — A concise overview of everything covered.
2. **Narrative Arc** — The logical flow from introduction through key points to conclusions.
3. **Unified Themes** — Common threads that tie the material together.
4. **Key Takeaways** — The most important points a reader or audience should remember.
5. **Recommended Focus Areas** — Which topics deserve the most attention in a presentation.

Write in clear, professional language. This synthesis will be used to generate a presentation and must be comprehensive yet digestible.`;

/**
 * Runs the Synthesis Agent on extraction and analysis results.
 *
 * @param apiKey - Anthropic API key
 * @param extractionResult - The output from the Extraction Agent
 * @param analysisResult - The output from the Analysis Agent
 * @returns A coherent narrative synthesis
 */
export async function runSynthesisAgent(
  apiKey: string,
  extractionResult: string,
  analysisResult: string
): Promise<string> {
  const userMessage = `Here is the extracted document structure:\n\n${extractionResult}\n\n---\n\nHere is the detailed analysis:\n\n${analysisResult}\n\nPlease synthesize this into a coherent narrative and high-level summary.`;

  return callClaude(apiKey, SYSTEM_PROMPT, userMessage);
}
