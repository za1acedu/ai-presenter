import { SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface Document {
  id: string;
  owner_id: string;
  run_id: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface InsertDocumentParams {
  owner_id: string;
  run_id?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
}

// ----------------------------------------------------------------
// Data access functions
// ----------------------------------------------------------------

/**
 * Insert a new document record.
 */
export async function insertDocument(
  supabase: SupabaseClient,
  params: InsertDocumentParams
): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: params.owner_id,
      run_id: params.run_id ?? null,
      file_name: params.file_name,
      mime_type: params.mime_type,
      size_bytes: params.size_bytes,
      storage_path: params.storage_path,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

/**
 * Retrieve all documents associated with a specific analysis run.
 */
export async function getDocumentsByRunId(
  supabase: SupabaseClient,
  runId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Document[];
}

/**
 * Retrieve all documents belonging to a given owner.
 */
export async function getDocumentsByOwnerId(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Document[];
}

/**
 * Delete a document record by its ID.
 * Returns the deleted document or null if it did not exist.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<Document | null> {
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .select()
    .single();

  if (error) throw error;
  return data as Document | null;
}
