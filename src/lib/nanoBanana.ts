/**
 * Nano Banana image-generation API stub.
 *
 * In production this would call the real Nano Banana API endpoint.
 * For now it returns a deterministic placeholder URL.
 */

/**
 * Generate an image for the given prompt (stub).
 *
 * @param prompt - Text description of the desired image
 * @param apiKey - Nano Banana API key (unused in stub)
 * @returns A mock image URL
 */
export async function generateImage(
  prompt: string,
  apiKey: string
): Promise<string> {
  // Simulate a short network delay
  await new Promise((r) => setTimeout(r, 50));

  // Return a deterministic placeholder based on the prompt
  const encoded = encodeURIComponent(prompt.slice(0, 120));
  return `https://nanobanana.example.com/mock/image?prompt=${encoded}&key=${apiKey.slice(-4)}`;
}
