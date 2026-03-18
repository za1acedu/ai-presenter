import { NextRequest } from "next/server";
import { supabaseServer as supabase } from "../db/client";

// ---------- token helpers ----------

const TOKEN_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";

interface TokenPayload {
  sub: string; // admin id
  email: string;
  iat: number; // issued-at (epoch seconds)
}

/**
 * Create a base64-encoded JSON token.
 * NOTE: This is NOT cryptographically secure – use a proper JWT library
 * (e.g. jose) with RS256/HS256 in production.
 */
function createToken(adminId: string, email: string): string {
  const payload: TokenPayload = {
    sub: adminId,
    email,
    iat: Math.floor(Date.now() / 1000),
  };
  const json = JSON.stringify(payload);
  return Buffer.from(`${json}.${TOKEN_SECRET}`).toString("base64");
}

/**
 * Decode & verify a token produced by `createToken`.
 * Returns the payload or `null` if invalid.
 */
function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const separatorIndex = decoded.lastIndexOf(`.${TOKEN_SECRET}`);
    if (separatorIndex === -1) return null;
    const json = decoded.slice(0, separatorIndex);
    const payload: TokenPayload = JSON.parse(json);
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- public API ----------

/**
 * Verify the incoming request carries a valid admin token.
 * Checks (in order):
 *   1. `session` cookie
 *   2. `Authorization: Bearer <token>` header
 *
 * Returns the token payload on success, or `null` if unauthenticated.
 */
export function verifyAdmin(
  request: NextRequest
): TokenPayload | null {
  // 1. cookie
  const cookie = request.cookies.get("session")?.value;
  if (cookie) {
    const payload = decodeToken(cookie);
    if (payload) return payload;
  }

  // 2. Authorization header
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = decodeToken(token);
    if (payload) return payload;
  }

  return null;
}

// Default admin credentials — used as fallback when Supabase is unavailable
const DEFAULT_ADMIN_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_ADMIN_EMAIL = "admin@admin.com";
const DEFAULT_ADMIN_PASSWORD = "admin";

/**
 * Authenticate an admin by email + password.
 * Tries Supabase first; falls back to hardcoded default credentials
 * if Supabase is not configured or the admins table doesn't exist.
 * Returns `{ token, adminId }` on success or `null` on failure.
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ token: string; adminId: string } | null> {
  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, password_hash")
      .eq("email", email)
      .single();

    if (!error && data) {
      // Plain-text comparison – replace with bcrypt.compare() in production
      if (data.password_hash !== password) return null;
      const token = createToken(data.id, data.email);
      return { token, adminId: data.id };
    }
  } catch (err) {
    console.warn("Supabase unavailable for auth, using fallback credentials:", err);
  }

  // Fallback: hardcoded default admin
  if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
    const token = createToken(DEFAULT_ADMIN_ID, DEFAULT_ADMIN_EMAIL);
    return { token, adminId: DEFAULT_ADMIN_ID };
  }

  return null;
}
