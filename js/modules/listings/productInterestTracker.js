import { getCurrentUser } from "../../services/auth.js";
import { getListingById } from "../../services/storage.js";
import { deferTask } from "../../utils/runtime.js";
import { supabase } from "../../lib/supabase.js";

export function getActiveSessionUserId() {
  try {
    let user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (!user && typeof window.state !== "undefined" && window.state?.currentUser) {
      user = window.state.currentUser;
    }

    if (!user) {
      try {
        const sess = sessionStorage.getItem("solosatset_current_user_data");
        if (sess) user = JSON.parse(sess);
      } catch (_e) {}
    }

    if (!user) {
      try {
        const local = localStorage.getItem("pusat_barkas_current_user") || localStorage.getItem("solosatset_user");
        if (local) user = JSON.parse(local);
      } catch (_e) {}
    }

    if (user && user.id) {
      return String(user.id);
    }
    if (user && user.email) {
      return String(user.email);
    }

    let deviceUUID = window.__solosatset_user_uuid || localStorage.getItem("solosatset_device_uuid");
    if (!deviceUUID) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        deviceUUID = crypto.randomUUID();
      } else {
        deviceUUID = "dev-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
      }
      window.__solosatset_user_uuid = deviceUUID;
      try {
        localStorage.setItem("solosatset_device_uuid", deviceUUID);
      } catch (_e) {}
    }
    return deviceUUID;
  } catch (e) {
    return "guest-" + Date.now();
  }
}

export function getTrackingUserUUID() {
  return getActiveSessionUserId();
}

export async function trackUserInterest(productOrCategoryOrId, score = 1) {
  if (!productOrCategoryOrId) return;

  let categoryId = null;
  let productId = null;

  if (typeof productOrCategoryOrId === "object" && productOrCategoryOrId !== null) {
    categoryId = productOrCategoryOrId.category || productOrCategoryOrId.categoryId;
    productId = productOrCategoryOrId.id;
  } else if (typeof productOrCategoryOrId === "string") {
    const trimmed = productOrCategoryOrId.trim();
    let foundProduct = null;
    if (typeof getListingById === "function") {
      foundProduct = getListingById(trimmed);
    }
    if (foundProduct) {
      productId = foundProduct.id;
      categoryId = foundProduct.category || foundProduct.categoryId;
    } else {
      categoryId = trimmed;
    }
  }

  if (!categoryId || categoryId === "all") {
    return;
  }

  const cleanCatId = String(categoryId).toLowerCase().trim();
  const activeBuyerUserId = getActiveSessionUserId();
  const sellerId =
    typeof productOrCategoryOrId === "object" && productOrCategoryOrId !== null
      ? productOrCategoryOrId.user_id || productOrCategoryOrId.sellerId || productOrCategoryOrId.seller_id || "-"
      : "-";

  console.log(
    `[trackUserInterest] 🎯 Tracking Minat Pembeli Aktif: Buyer="${activeBuyerUserId}", Kategori="${cleanCatId}" (Produk: ${productId || "-"}, Seller: ${sellerId})`,
  );

  window.__solosatset_user_interests = window.__solosatset_user_interests || {};
  window.__solosatset_user_interests[cleanCatId] =
    (Number(window.__solosatset_user_interests[cleanCatId]) || 0) + score;

  deferTask(async () => {
    try {
      if (typeof window.updateUserInterest === "function") {
        await window.updateUserInterest(activeBuyerUserId, cleanCatId);
      }
    } catch (err) {
      console.error("[trackUserInterest Exception]", err);
    }
  });

  try {
    window.dispatchEvent(
      new CustomEvent("userInterestTracked", {
        detail: { categoryId: cleanCatId, userId: activeBuyerUserId, score, productId, sellerId },
      }),
    );
  } catch (_e) {}
}

export async function getUserTopInterests(userId = null, limit = 3) {
  const targetUid = userId || getTrackingUserUUID();
  const topCats = [];

  if (typeof window.sbGetUserInterests === "function" && targetUid) {
    try {
      const sbCats = await window.sbGetUserInterests(targetUid);
      if (Array.isArray(sbCats)) {
        sbCats.forEach((cat) => {
          const clean = String(cat || "")
            .toLowerCase()
            .trim();
          if (clean && !topCats.includes(clean) && topCats.length < limit) {
            topCats.push(clean);
          }
        });
      }
    } catch (_e) {}
  } else if (supabase && targetUid) {
    try {
      let query = supabase.from("users").select("interests");
      if (typeof targetUid === "string" && targetUid.includes("@")) {
        query = query.eq("email", targetUid.toLowerCase().trim());
      } else {
        query = query.eq("id", targetUid);
      }
      const { data: user } = await query.maybeSingle();

      if (Array.isArray(user?.interests)) {
        user.interests.forEach((cat) => {
          const clean = String(cat || "")
            .toLowerCase()
            .trim();
          if (clean && !topCats.includes(clean) && topCats.length < limit) {
            topCats.push(clean);
          }
        });
      }
    } catch (_e) {}
  }

  if (topCats.length < limit) {
    const localInterests = window.__solosatset_user_interests || {};
    const sortedLocal = Object.entries(localInterests)
  // eslint-disable-next-line no-unused-vars
      .filter(([cat, score]) => Number(score) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([cat]) => String(cat).toLowerCase().trim());

    sortedLocal.forEach((cat) => {
      if (cat && !topCats.includes(cat) && topCats.length < limit) {
        topCats.push(cat);
      }
    });
  }

  return topCats;
}
