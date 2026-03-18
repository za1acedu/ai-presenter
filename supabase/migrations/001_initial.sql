-- 001_initial.sql
-- Initial schema for AI Document Presenter

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SETTINGS
-- NOTE: In production, sensitive keys (claude_api_key, etc.)
-- should be stored in a secrets manager (e.g. AWS Secrets
-- Manager, Vault, Supabase Vault) rather than in a database
-- column. This schema stores them directly for development
-- convenience only.
-- ============================================================
CREATE TABLE settings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  claude_api_key     text NOT NULL,
  google_api_key     text,
  nano_banana_api_key text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  run_id       uuid,
  file_name    text NOT NULL,
  mime_type    text NOT NULL,
  size_bytes   bigint NOT NULL,
  storage_path text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ANALYSIS RUNS
-- ============================================================
CREATE TABLE analysis_runs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  status                  text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  agent1_result           text,
  agent2_result           text,
  agent3_result           text,
  agent4_result           text,
  agent5_result           text,
  final_presentation_json jsonb,
  error_message           text,
  settings                jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- settings holds: { "tone": "...", "domain": "...", "slides_count": N }
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Add FK from documents.run_id -> analysis_runs.id after analysis_runs exists
ALTER TABLE documents
  ADD CONSTRAINT fk_documents_run_id
  FOREIGN KEY (run_id) REFERENCES analysis_runs(id) ON DELETE SET NULL;

-- ============================================================
-- Seed default admin
-- NOTE: plain-text password for local dev only. In production
-- use bcrypt or argon2 hashed passwords.
-- ============================================================
INSERT INTO admins (email, password_hash)
VALUES ('admin@admin.com', 'admin');

-- ============================================================
-- Storage bucket for uploaded documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
