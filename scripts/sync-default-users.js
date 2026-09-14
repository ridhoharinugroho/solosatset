// scripts/sync-default-users.js – sync default users to Supabase using existing client
import supabase from "../src/lib/supabase.ts";
import { DEFAULT_REGISTERED_USERS } from "../src/services/authService.ts";

(async () => {
  try {
    const payload = DEFAULT_REGISTERED_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      store_name: u.storeName,
      email: u.email,
      phone: u.phone,
      region: u.region,
      district: u.district,
    }));
    const { error, data } = await supabase.from("users").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("❌ Upsert error:", error.message);
      process.exit(1);
    }
    console.log("✅ Upsert succeeded, rows affected:", data?.length ?? 0);
    process.exit(0);
  } catch (e) {
    console.error("Unexpected error:", e);
    process.exit(1);
  }
})();
