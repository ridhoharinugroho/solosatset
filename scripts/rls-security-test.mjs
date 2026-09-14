import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=== Running Supabase RLS Security Policy Static & Isolation Audit ===");

const rlsMigration = fs.readFileSync("supabase/migrations/20260914_harden_rls_production.sql", "utf8");

// 1. Verify users table RLS controls
assert.ok(rlsMigration.includes("REVOKE ALL ON TABLE public.users FROM anon;"), "users table must revoke anon access");
assert.ok(rlsMigration.includes("auth.uid()::text = id::text"), "users table SELECT must enforce auth.uid() = id");
console.log("✓ RLS Audit - users isolation policies: PASS");

// 2. Verify notifications table RLS controls
assert.ok(rlsMigration.includes("auth.uid()::text = user_id::text"), "notifications table must enforce auth.uid() = user_id");
assert.ok(rlsMigration.includes("CREATE POLICY \"notifications_select_own\""), "notifications must have select_own policy");
assert.ok(rlsMigration.includes("CREATE POLICY \"notifications_update_own\""), "notifications must have update_own policy");
console.log("✓ RLS Audit - notifications isolation policies: PASS");

// 3. Verify app_reviews table RLS controls
assert.ok(rlsMigration.includes("CREATE POLICY \"app_reviews_read_public\""), "app_reviews must allow public read");
assert.ok(rlsMigration.includes("CREATE POLICY \"app_reviews_insert_authenticated\""), "app_reviews insert requires authenticated");
assert.ok(rlsMigration.includes("CREATE POLICY \"app_reviews_update_owner_admin\""), "app_reviews update requires owner or admin");
assert.ok(rlsMigration.includes("CREATE POLICY \"app_reviews_delete_owner_admin\""), "app_reviews delete requires owner or admin");
console.log("✓ RLS Audit - app_reviews owner/admin policies: PASS");

// 4. Verify service_role permissions preserved across all tables
assert.ok(rlsMigration.includes("GRANT ALL ON TABLE public.users TO service_role;"), "service_role full access on users");
assert.ok(rlsMigration.includes("GRANT ALL ON TABLE public.notifications TO service_role;"), "service_role full access on notifications");
assert.ok(rlsMigration.includes("GRANT ALL ON TABLE public.app_reviews TO service_role;"), "service_role full access on app_reviews");
console.log("✓ RLS Audit - service_role server flows preserved: PASS");

console.log("🎉 RLS Security Policy Audit passed 100%!");
