// supabase/functions/admin-create-user/index.ts
//
// Creates a new login + profile on behalf of an admin. This MUST run server-side
// because it uses the service-role key (which can never reach the browser).
//
// Security model (mirrors the RLS rules):
//   - Caller must be authenticated (JWT) AND have role super_admin or company_admin.
//   - company_admin may only create users in THEIR OWN company, and may NOT create a super_admin.
//   - super_admin may create anyone, anywhere.
//
// Env vars are auto-injected by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const ALLOWED_ROLES = ["super_admin", "company_admin", "manager", "rep"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface Body {
  email?: string;
  password?: string;
  full_name?: string;
  role?: Role;
  company_id?: string;
  region_id?: string | null;
  manager_region_ids?: string[]; // only used when role === 'manager'
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Function is not configured" }, 500);

  // Service-role client (bypasses RLS). Used for auth checks AND the privileged writes.
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Identify the caller from their JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing Authorization bearer token" }, 401);

  const { data: callerData, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !callerData?.user) return json({ error: "Invalid or expired session" }, 401);
  const callerId = callerData.user.id;

  const { data: callerProfile, error: profErr } = await admin
    .from("profiles")
    .select("role, company_id")
    .eq("id", callerId)
    .maybeSingle();
  if (profErr) return json({ error: "Could not load caller profile" }, 500);
  if (!callerProfile || !["super_admin", "company_admin"].includes(callerProfile.role)) {
    return json({ error: "Not authorized to create users" }, 403);
  }

  // 2) Validate the request body.
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be valid JSON" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.full_name ?? "").trim();
  const role = body.role as Role;
  const regionId = body.region_id ?? null;
  const managerRegionIds = Array.isArray(body.manager_region_ids) ? body.manager_region_ids : [];

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email is required" }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
  if (!ALLOWED_ROLES.includes(role)) return json({ error: "Invalid role" }, 400);

  // Resolve target company: super_admin may pass any; company_admin is pinned to their own.
  let companyId = body.company_id ?? null;
  if (callerProfile.role === "company_admin") {
    companyId = callerProfile.company_id; // ignore any company_id the client tried to pass
    if (role === "super_admin") return json({ error: "A company admin cannot create a super admin" }, 403);
  }
  if (role !== "super_admin" && !companyId) {
    return json({ error: "company_id is required for this role" }, 400);
  }

  // If a region was supplied, it must belong to the target company.
  if (regionId) {
    const { data: region } = await admin
      .from("regions").select("id").eq("id", regionId).eq("company_id", companyId).maybeSingle();
    if (!region) return json({ error: "region_id does not belong to that company" }, 400);
  }

  // 3) Create the auth user (email_confirm so they can sign in immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? "Could not create user" }, 400);
  }
  const newId = created.user.id;

  // 4) Insert the profile. If this fails, roll back the auth user so we don't orphan it.
  const { error: insertErr } = await admin.from("profiles").insert({
    id: newId,
    company_id: companyId,
    role,
    region_id: role === "rep" || role === "manager" ? regionId : null,
    full_name: fullName || null,
  });
  if (insertErr) {
    await admin.auth.admin.deleteUser(newId).catch(() => {});
    return json({ error: `Profile creation failed: ${insertErr.message}` }, 400);
  }

  // 5) Managers can cover multiple regions.
  if (role === "manager" && managerRegionIds.length) {
    const { data: validRegions } = await admin
      .from("regions").select("id").eq("company_id", companyId).in("id", managerRegionIds);
    const rows = (validRegions ?? []).map((r: { id: string }) => ({ profile_id: newId, region_id: r.id }));
    if (rows.length) await admin.from("manager_regions").insert(rows);
  }

  return json({ ok: true, user_id: newId, email });
});
