/**
 * Google Slides API stub.
 *
 * In production this would use the googleapis SDK to create a real
 * presentation via the Google Slides API.  For now it returns mock data.
 */

export interface SlideInput {
  title: string;
  body: string;
  imageUrl?: string;
}

export interface PresentationResult {
  presentationId: string;
  presentationUrl: string;
  slides: { slideId: string; title: string }[];
}

/**
 * Create a Google Slides presentation (stub).
 *
 * @param title  - Presentation title
 * @param slides - Array of slide content objects
 * @returns Mock presentation metadata
 */
export async function createPresentation(
  title: string,
  slides: SlideInput[]
): Promise<PresentationResult> {
  // Simulate a short network delay
  await new Promise((r) => setTimeout(r, 100));

  const mockId = `mock-presentation-${Date.now()}`;

  return {
    presentationId: mockId,
    presentationUrl: `https://docs.google.com/presentation/d/${mockId}/edit`,
    slides: slides.map((s, i) => ({
      slideId: `slide-${i + 1}`,
      title: s.title,
    })),
  };
}
