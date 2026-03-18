/**
 * Analysis Agent (Agent 2)
 *
 * Takes the original document content plus the extraction summary
 * and performs deep analytical work: identifying arguments, patterns,
 * relationships between topics, and key claims.
 */

import { callClaude } from "../claude";

const SYSTEM_PROMPT = `You are an expert analytical thinker. Given document content and extracted structure, analyze arguments, patterns, relationships between topics, and key claims. Provide detailed analytical notes that include:

1. **Core Arguments** — The main arguments or theses presented.
2. **Patterns & Trends** — Recurring themes, patterns, or trends across the content.
3. **Topic Relationships** — How different topics connect, support, or contradict each other.
4. **Key Claims & Evidence** — Important claims made and the evidence or reasoning behind them.
5. **Strengths & Weaknesses** — Notable strong points and potential gaps in the content.

Be objective and thorough. Your analysis will feed into synthesis and validation stages.`;

/**
 * Runs the Analysis Agent on document content and extraction results.
 *
 * @param apiKey - Anthropic API key
 * @param documentsContent - The concatenated text content of all uploaded documents
 * @param extractionResult - The output from the Extraction Agent
 * @returns Detailed analytical notes
 */
export async function runAnalysisAgent(
  apiKey: string,
  documentsContent: string,
  extractionResult: string
): Promise<string> {
  const userMessage = `Here is the original document content:\n\n${documentsContent}\n\n---\n\nHere is the extracted structure from the Extraction Agent:\n\n${extractionResult}\n\nPlease provide a detailed analysis of the content.`;

  return callClaude(apiKey, SYSTEM_PROMPT, userMessage);
}
