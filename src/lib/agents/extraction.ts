/**
 * Extraction Agent (Agent 1)
 *
 * Analyzes raw document content and extracts structure, sections,
 * key topics, and headings. Produces a structured summary that
 * downstream agents use as their foundation.
 */

import { callClaude } from "../claude";

const SYSTEM_PROMPT = `You are an expert document analyst. Your task is to extract structure, sections, key topics, and headings from the provided documents. Output a structured summary with:

1. **Main Topics** — The primary subjects covered across all documents.
2. **Document Structure** — How the content is organized (chapters, sections, parts, etc.).
3. **Key Headings** — All significant headings and sub-headings in order.
4. **Relationships Between Sections** — How different sections relate to, build on, or contrast with each other.

Be thorough and precise. Preserve the original terminology from the documents. Format your output clearly with labeled sections so it can be consumed by subsequent analysis agents.`;

/**
 * Runs the Extraction Agent on the provided document content.
 *
 * @param apiKey - Anthropic API key
 * @param documentsContent - The concatenated text content of all uploaded documents
 * @returns A structured extraction summary
 */
export async function runExtractionAgent(
  apiKey: string,
  documentsContent: string
): Promise<string> {
  const userMessage = `Please analyze and extract the structure from the following documents:\n\n${documentsContent}`;

  return callClaude(apiKey, SYSTEM_PROMPT, userMessage);
}
