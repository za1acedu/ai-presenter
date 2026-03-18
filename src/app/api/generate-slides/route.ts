import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { supabaseServer as supabase } from "@/db/client";
import { generateImage } from "@/lib/nanoBanana";
import { createPresentation, SlideInput } from "@/lib/slides";

export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { runId } = body as { runId?: string };

    if (!runId) {
      return NextResponse.json(
        { error: "runId is required" },
        { status: 400 }
      );
    }

    // Fetch the analysis run
    const { data: run, error: runError } = await supabase
      .from("analysis_runs")
      .select("*")
      .eq("id", runId)
      .eq("owner_id", admin.sub)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: "Analysis run not found" },
        { status: 404 }
      );
    }

    if (!run.final_presentation_json) {
      return NextResponse.json(
        { error: "Analysis run has no final presentation data yet" },
        { status: 400 }
      );
    }

    // Fetch Nano Banana API key from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("nano_banana_api_key")
      .eq("owner_id", admin.sub)
      .single();

    const nanoBananaKey = settings?.nano_banana_api_key ?? "mock-key";

    // Parse the presentation JSON produced by our Presentation Agent
    const presentation = run.final_presentation_json as {
      title?: string;
      slides?: {
        type?: string;
        title?: string;
        content?: string;
        image_prompt?: string;
      }[];
    };

    const slidesWithImages: (SlideInput & { imageUrl: string; imagePrompt: string })[] = [];

    for (const slide of presentation.slides ?? []) {
      const imageUrl = await generateImage(
        slide.image_prompt ?? `Illustration for: ${slide.title}`,
        nanoBananaKey
      );

      slidesWithImages.push({
        title: slide.title ?? "Untitled Slide",
        body: slide.content ?? "",
        imageUrl,
        imagePrompt: slide.image_prompt ?? "",
      });
    }

    // Mock Google Slides API call
    const presentationResult = await createPresentation(
      presentation.title ?? "Untitled Presentation",
      slidesWithImages
    );

    return NextResponse.json({
      message: "Slides generation stubbed — integrate real APIs to create actual slides",
      presentation: presentationResult,
      slides: slidesWithImages,
    });
  } catch (err) {
    console.error("Generate slides error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
