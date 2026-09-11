import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260908_lock_notifications_to_server.sql", "utf8");
const client = fs.readFileSync("js/services/notifications.js", "utf8");
const api = fs.readFileSync("api/push-notify.js", "utf8");
const legacy = fs.readFileSync("js/services/supabaseDB.js", "utf8");

const requiredMigration = [
  "REVOKE ALL ON TABLE public.notifications FROM anon, authenticated",
  "GRANT ALL ON TABLE public.notifications TO service_role",
  'DROP POLICY IF EXISTS "notifications_select_public"',
  'DROP POLICY IF EXISTS "notifications_insert_all"',
  'DROP POLICY IF EXISTS "notifications_update_all"',
  'DROP POLICY IF EXISTS "notifications_delete_all"',
];
for (const pattern of requiredMigration) {
  if (!migration.includes(pattern)) throw new Error(`Missing notification hardening control: ${pattern}`);
}

for (const forbidden of [
  ".from('notifications').select",
  ".from('notifications').update",
  ".from('notifications').insert",
  ".from('notifications').delete",
  "supabase.channel(",
]) {
  if (client.includes(forbidden))
    throw new Error(`Browser notification client still accesses Supabase directly: ${forbidden}`);
}

for (const required of [
  "list_notifications",
  "mark_notification_read",
  "mark_all_notifications_read",
  "broadcast_bu_notification",
  "getUserSessionFromRequest",
]) {
  if (!api.includes(required)) throw new Error(`Missing server notification action: ${required}`);
}

if (legacy.includes("export async function sbGetNotifications")) {
  console.log(
    "legacy notification implementation retained only for compatibility archive; active client must use js/services/notifications.js",
  );
}

console.log("Notification security audit passed.");
