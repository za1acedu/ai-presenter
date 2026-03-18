import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { supabaseServer as supabase } from "@/db/client";

/**
 * Mask an API key, showing only the last 4 characters.
 * e.g. "sk-abc123XYZ9999" -> "***********9999"
 */
function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 4) return "****";
  return "*".repeat(key.length - 4) + key.slice(-4);
}

// ---------- GET ----------

export async function GET(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .eq("owner_id", admin.sub)
      .single();

    if (error || !settings) {
      // No settings row yet – return empty defaults
      return NextResponse.json({
        settings: {
          claude_api_key: null,
          google_api_key: null,
          nano_banana_api_key: null,
        },
      });
    }

    // Mask sensitive keys before sending to the client
    return NextResponse.json({
      settings: {
        ...settings,
        claude_api_key: maskKey(settings.claude_api_key),
        google_api_key: maskKey(settings.google_api_key),
        nano_banana_api_key: maskKey(settings.nano_banana_api_key),
      },
    });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------- PUT ----------

export async function PUT(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { claude_api_key, google_api_key, nano_banana_api_key } = body as {
      claude_api_key?: string;
      google_api_key?: string;
      nano_banana_api_key?: string;
    };

    // Build the update payload – only include fields that were provided
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (claude_api_key !== undefined) updateFields.claude_api_key = claude_api_key;
    if (google_api_key !== undefined) updateFields.google_api_key = google_api_key;
    if (nano_banana_api_key !== undefined)
      updateFields.nano_banana_api_key = nano_banana_api_key;

    // Upsert: create if not exists, update if exists
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("owner_id", admin.sub)
      .single();

    let settings;
    let error;

    if (existing) {
      const result = await supabase
        .from("settings")
        .update(updateFields)
        .eq("owner_id", admin.sub)
        .select()
        .single();
      settings = result.data;
      error = result.error;
    } else {
      // Insert requires claude_api_key (NOT NULL in schema)
      const result = await supabase
        .from("settings")
        .insert({
          owner_id: admin.sub,
          claude_api_key: claude_api_key ?? "",
          google_api_key: google_api_key ?? null,
          nano_banana_api_key: nano_banana_api_key ?? null,
        })
        .select()
        .single();
      settings = result.data;
      error = result.error;
    }

    if (error || !settings) {
      console.error("Settings upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    // Return masked version
    return NextResponse.json({
      settings: {
        ...settings,
        claude_api_key: maskKey(settings.claude_api_key),
        google_api_key: maskKey(settings.google_api_key),
        nano_banana_api_key: maskKey(settings.nano_banana_api_key),
      },
    });
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
