/**
 * Presentation Agent (Agent 5)
 *
 * Takes all prior agent outputs plus user settings (tone, domain,
 * slide count) and designs a slide-based presentation. Returns
 * structured JSON with slide definitions including image prompts.
 */

import { callClaude } from "../claude";

export interface PresentationSlide {
  type: "title" | "content" | "summary";
  title: string;
  content: string;
  image_prompt: string;
}

export interface PresentationResult {
  title: string;
  slides: PresentationSlide[];
}

export interface PresentationSettings {
  tone: string;
  domain: string;
  slidesCount: number;
}

export interface AllAgentResults {
  extraction: string;
  analysis: string;
  synthesis: string;
  validation: string;
}

const SYSTEM_PROMPT = `You are a presentation designer. Based on the complete analysis, design a presentation with slides. For each slide provide:

- **type**: one of "title", "content", or "summary"
- **title**: the slide heading
- **content**: bullet points separated by | (pipe character)
- **image_prompt**: a descriptive prompt suitable for AI image generation that would create an illustration for this slide

The first slide should be of type "title" and the last slide should be of type "summary". All other slides should be of type "content".

Output ONLY valid JSON in this exact format (no markdown code fences, no extra text):
{
  "title": "Presentation Title",
  "slides": [
    {
      "type": "title",
      "title": "...",
      "content": "bullet one|bullet two|bullet three",
      "image_prompt": "..."
    }
  ]
}`;

/**
 * Runs the Presentation Agent to generate a structured slide deck.
 *
 * @param apiKey - Anthropic API key
 * @param allResults - Outputs from all four prior agents
 * @param settings - User preferences for tone, domain, and slide count
 * @returns Parsed presentation JSON with title and slides array
 */
export async function runPresentationAgent(
  apiKey: string,
  allResults: AllAgentResults,
  settings: PresentationSettings
): Promise<PresentationResult> {
  const userMessage = `Create a presentation with exactly ${settings.slidesCount} slides.

Tone: ${settings.tone}
Domain: ${settings.domain}

--- EXTRACTION ---
${allResults.extraction}

--- ANALYSIS ---
${allResults.analysis}

--- SYNTHESIS ---
${allResults.synthesis}

--- VALIDATION NOTES ---
${allResults.validation}

Generate the presentation as valid JSON.`;

  const rawResponse = await callClaude(apiKey, SYSTEM_PROMPT, userMessage);

  // The model might wrap the JSON in markdown code fences — strip them
  let jsonString = rawResponse.trim();
  if (jsonString.startsWith("```")) {
    // Remove opening fence (with optional language tag) and closing fence
    jsonString = jsonString
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?\s*```\s*$/, "");
  }

  let parsed: PresentationResult;

  try {
    parsed = JSON.parse(jsonString);
  } catch (parseError) {
    throw new Error(
      `Failed to parse Presentation Agent output as JSON: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }\n\nRaw output:\n${rawResponse}`
    );
  }

  // Basic shape validation
  if (!parsed.title || !Array.isArray(parsed.slides)) {
    throw new Error(
      'Presentation Agent output is missing required fields ("title" and "slides" array).'
    );
  }

  for (let i = 0; i < parsed.slides.length; i++) {
    const slide = parsed.slides[i];
    if (!slide.type || !slide.title || slide.content === undefined || !slide.image_prompt) {
      throw new Error(
        `Slide ${i + 1} is missing one or more required fields (type, title, content, image_prompt).`
      );
    }
  }

  return parsed;
}
