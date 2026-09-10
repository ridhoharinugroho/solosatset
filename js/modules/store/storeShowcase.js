import { getRegionById } from "../../data/regions.js";
import { formatDisplayPhone } from "../../services/whatsapp.js";
import { formatJoinedDate, isDemoUser } from "../../services/auth.js";
import {
  checkSellerVerification,
  getSellerStats,
  getSellerRatingStats,
} from "../../services/storage.js";

export function renderAuthHeader(currentUser) {
  const container = document.getElementById("auth-nav-container");
  if (container && currentUser) {
    container.innerHTML = `
    <div class="flex items-center gap-2 p-1 pr-2.5 bg-slate-100 rounded-full border border-slate-200">
      <img src="${currentUser.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(currentUser.email || "user")}" alt="${currentUser.storeName || currentUser.name}" class="w-7 h-7 rounded-full object-cover border border-slate-300">
      <span class="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">${currentUser.storeName || currentUser.name}</span>
    </div>
  `;
  }
}

export function renderStoreShowcase(currentUser) {
  if (!currentUser) return;
  const user = currentUser;
  const verResult = checkSellerVerification(user);
  const stats = getSellerStats(user.id);
  const ratingStats = getSellerRatingStats(user.id);
  const avatarEl = document.getElementById("my-store-avatar");

  if (avatarEl) {
    avatarEl.src =
      user.avatar ||
      "https://api.dicebear.com/7.x/bottts/svg?seed=" +
        encodeURIComponent(user.email || "user");
  }
  const nameEl = document.getElementById("my-store-name");
  if (nameEl) nameEl.textContent = user.storeName || user.name;
  const locEl = document.getElementById("my-store-location");
  if (locEl) {
    const userRegObj = getRegionById(user.region);
    let regName = userRegObj
      ? userRegObj.shortName ||
        userRegObj.name
          .replace(/Kota|Kab\./gi, "")
          .replace(/\(.*?\)/g, "")
          .trim()
      : user.region || "Karanganyar";
    regName = regName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    const distClean = (user.district || "")
      .trim()
      .replace(/\.+$/, "")
      .replace(/^Kec\.?\s*/i, "");
    const capDist = distClean
      ? distClean
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "";
    locEl.textContent = capDist ? `${regName} • ${capDist}` : regName;
  }
  const phoneEl = document.getElementById("my-store-phone");
  if (phoneEl) {
    phoneEl.textContent = user.phone
      ? `WA: ${formatDisplayPhone(user.phone)}`
      : "WA: Belum diatur";
  }
  const createdEl = document.getElementById("my-store-created");
  if (createdEl) {
    const rawJoined = user.created_at || user.createdAt;
    createdEl.textContent = `Bergabung: ${formatJoinedDate(rawJoined)}`;
  }
  const soldCountText = document.getElementById("my-store-sold-count-text");
  if (soldCountText) soldCountText.textContent = `${stats.soldCount} Terjual`;

  const badgeContainer = document.getElementById("my-store-badge-container");
  const isDemo = isDemoUser(user);
  if (badgeContainer) {
    let badgesHtml = "";
    if (isDemo) {
      badgesHtml += `
        <span class="bg-amber-400 text-slate-950 border border-amber-500 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <i data-lucide="tag" class="w-3.5 h-3.5"></i>
          <span>AKUN DEMO / PERAGA</span>
        </span>
      `;
    }
    if (verResult.isVerified) {
      badgesHtml += `
        <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          <span>🛡️ Toko Lokal ${user.region ? user.region.toUpperCase() : "Solo"} Terverifikasi</span>
        </span>
      `;
    } else if (!isDemo) {
      badgesHtml += `
        <span class="bg-slate-700/80 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-300"></i>
          <span>Toko Member (Belum Terverifikasi)</span>
        </span>
      `;
    }
    badgeContainer.innerHTML = badgesHtml;
  }

  const verTitle = document.getElementById("my-verification-title");
  const verIcon = document.getElementById("my-verification-icon");
  if (verTitle) {
    verTitle.textContent = verResult.isVerified
      ? "Selamat! Toko kamu telah memenuhi 5/5 Syarat Badge Terverifikasi"
      : `Syarat Badge Terverifikasi: ${verResult.passedCount}/5 Kriteria Terpenuhi`;
  }
  if (verIcon) {
    verIcon.setAttribute(
      "data-lucide",
      verResult.isVerified ? "shield-check" : "shield-alert"
    );
    verIcon.className = verResult.isVerified
      ? "w-4 h-4 text-emerald-400"
      : "w-4 h-4 text-amber-400";
  }

  const c = verResult.criteria;
  const textRev = document.getElementById("check-text-reviews");
  if (textRev) {
    textRev.innerHTML = `1. Min 20 Ulasan Positif: <b class="${c.reviewsPositive.passed ? "text-emerald-400" : "text-amber-300"}">${c.reviewsPositive.current}/20 ulasan</b>`;
  }
  const textRat = document.getElementById("check-text-rating");
  if (textRat) {
    textRat.innerHTML = `2. Rating Rata-rata Min 4.5: <b class="${c.averageRating.passed ? "text-emerald-400" : "text-amber-300"}">${c.averageRating.current.toFixed(1)} / 5.0</b>`;
  }
  const textList = document.getElementById("check-text-listings");
  if (textList) {
    textList.innerHTML = `3. Posting Min 10 Barang: <b class="${c.totalListings.passed ? "text-emerald-400" : "text-amber-300"}">${c.totalListings.current}/10 barang</b>`;
  }
  const textProf = document.getElementById("check-text-profile");
  if (textProf) {
    textProf.innerHTML = `4. Profil Lengkap: <b class="${c.profileComplete.passed ? "text-emerald-400" : "text-amber-300"}">${c.profileComplete.passed ? "Lengkap (Foto, Lokasi, WA)" : "Belum Lengkap"}</b>`;
  }
  const textAge = document.getElementById("check-text-age");
  if (textAge) {
    textAge.innerHTML = `5. Usia Akun Min 30 Hari: <b class="${c.accountAgeDays.passed ? "text-emerald-400" : "text-amber-300"}">${c.accountAgeDays.current}/30 hari</b>`;
  }

  const statTotal = document.getElementById("my-stat-total");
  const statAvailable = document.getElementById("my-stat-available");
  const statBooked = document.getElementById("my-stat-booked");
  const statSold = document.getElementById("my-stat-sold");
  const statRating = document.getElementById("my-stat-rating");
  const statRevLabel = document.getElementById("my-stat-reviews-label");

  if (statTotal) statTotal.textContent = stats.totalListings;
  if (statAvailable) statAvailable.textContent = stats.availableCount;
  if (statBooked) statBooked.textContent = stats.bookedCount;
  if (statSold) statSold.textContent = stats.soldCount;
  if (statRating) {
    statRating.textContent =
      ratingStats.totalReviews === 0
        ? "⭐ 0.0"
        : `⭐ ${ratingStats.averageRating.toFixed(1)}`;
  }
  if (statRevLabel) {
    statRevLabel.textContent = `${ratingStats.totalReviews} Ulasan`;
  }

  const countAll = document.getElementById("store-count-all");
  const countAvail = document.getElementById("store-count-available");
  const countBooked = document.getElementById("store-count-booked");
  const countSold = document.getElementById("store-count-sold");

  if (countAll) countAll.textContent = stats.totalListings;
  if (countAvail) countAvail.textContent = stats.availableCount;
  if (countBooked) countBooked.textContent = stats.bookedCount;
  if (countSold) countSold.textContent = stats.soldCount;
}

if (typeof window !== "undefined") {
  window.renderAuthHeader = renderAuthHeader;
  window.renderStoreShowcase = renderStoreShowcase;
}
