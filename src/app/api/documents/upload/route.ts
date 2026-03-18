import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { supabaseServer as supabase } from "@/db/client";

export async function POST(request: NextRequest) {
  try {
    // ---------- auth ----------
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---------- parse multipart ----------
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "No files provided. Use the form field name 'files'." },
        { status: 400 }
      );
    }

    const createdDocuments: Record<string, unknown>[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const storagePath = `${admin.sub}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Create DB record
      const { data: doc, error: dbError } = await supabase
        .from("documents")
        .insert({
          owner_id: admin.sub,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (dbError) {
        console.error("DB insert error:", dbError);
        return NextResponse.json(
          { error: `Failed to save record for ${file.name}: ${dbError.message}` },
          { status: 500 }
        );
      }

      createdDocuments.push(doc);
    }

    return NextResponse.json({ documents: createdDocuments }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
