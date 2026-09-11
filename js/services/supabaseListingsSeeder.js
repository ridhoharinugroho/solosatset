import { SAMPLE_LISTINGS } from "../data/sampleListings.js";
import { DEFAULT_REGISTERED_USERS } from "./auth.js";
import { supabase } from "../lib/supabase.js";

export async function seedListingsToSupabaseIfEmpty() {
  if (!supabase) return;
  try {
    const { data: existing, error } = await supabase.from("listings").select("id");
    if (!error && Array.isArray(existing) && existing.length === 0) {
      console.log(
        "[Supabase Listings Seed] Tabel listings kosong di Supabase. Melakukan INSERT otomatis 4 barang demo resmi...",
      );

      const sellerUsers = SAMPLE_LISTINGS.map((l) => ({
        id: l.seller.id,
        name: l.seller.name || l.seller.storeName,
        store_name: l.seller.storeName || l.seller.name,
        email: l.seller.email || `seller-${l.seller.id}@solosatset.my.id`,
        phone: l.seller.phone || "081234567890",
        region: l.seller.region || l.regionId || "solo",
        district: l.seller.district || l.district || "Banjarsari",
        avatar: l.seller.avatar || null,
        bio:
          DEFAULT_REGISTERED_USERS.find((u) => u.id === l.seller.id)?.bio ||
          `Penjual Resmi ${l.seller.storeName || l.seller.name}`,
        password: null,
        is_demo: true,
        updated_at: new Date().toISOString(),
      }));
      try {
        await supabase.from("users").upsert(sellerUsers, { onConflict: "id" });
  // eslint-disable-next-line no-unused-vars
      } catch (uErr) {}

      const seedRows = SAMPLE_LISTINGS.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price,
        category: l.category,
        condition: l.condition,
        nego_type: l.negoType,
        payment_method: l.paymentMethod || "cod",
        region: l.regionId,
        district: l.district,
        cod_point: l.codPoint,
        seller_id: l.seller.id,
        seller_name: l.seller.storeName || l.seller.name,
        seller_phone: l.seller.phone,
        seller_avatar: l.seller.avatar,
        images: l.images,
        status: l.status || "active",
        views: l.views || 0,
        created_at: l.createdAt || new Date().toISOString(),
        updated_at: l.createdAt || new Date().toISOString(),
      }));

      const { error: insErr } = await supabase.from("listings").upsert(seedRows, { onConflict: "id" });
      if (!insErr) {
        console.log("[Supabase Listings Seed Success] Berhasil insert 4 barang demo resmi");
      } else {
        console.warn("[Supabase Listings Seed Error]", insErr.message);
      }
    }
  } catch (err) {
    console.warn("[Supabase Listings Seed Exception]", err);
  }
}
