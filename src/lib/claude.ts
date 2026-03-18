/**
 * Claude API Client Wrapper
 *
 * Provides a reusable function to call the Anthropic Messages API
 * using fetch. Used by all agents in the pipeline.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicError {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

/**
 * Calls the Claude API with a system prompt and user message.
 *
 * @param apiKey  - Anthropic API key
 * @param systemPrompt - The system-level instruction for the model
 * @param userMessage  - The user message / input data
 * @returns The text content of the assistant's response
 * @throws Error if the API call fails or returns an unexpected format
 */
export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Claude API key is missing or empty.");
  }

  const messages: AnthropicMessage[] = [
    { role: "user", content: userMessage },
  ];

  let response: Response;

  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      }),
    });
  } catch (networkError) {
    throw new Error(
      `Network error calling Claude API: ${
        networkError instanceof Error ? networkError.message : String(networkError)
      }`
    );
  }

  if (!response.ok) {
    let errorMessage = `Claude API returned status ${response.status}`;
    try {
      const errorBody: AnthropicError = await response.json();
      if (errorBody?.error?.message) {
        errorMessage += `: ${errorBody.error.message}`;
      }
    } catch {
      // Could not parse error body — use generic message
    }
    throw new Error(errorMessage);
  }

  let data: AnthropicResponse;

  try {
    data = await response.json();
  } catch {
    throw new Error("Failed to parse Claude API response as JSON.");
  }

  const textBlock = data.content?.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error(
      "Claude API response did not contain a text block."
    );
  }

  return textBlock.text;
}
