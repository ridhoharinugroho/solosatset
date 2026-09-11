  // eslint-disable-next-line no-unused-vars
import { getMyListings } from "../../services/storage.js";
  // eslint-disable-next-line no-unused-vars
import { formatRupiah } from "../../services/whatsapp.js";
  // eslint-disable-next-line no-unused-vars
import { getRegionById } from "../../data/regions.js";

export function showStoreLoadingSkeleton() {
  const container = document.getElementById("my-listings-container");
  const emptyView = document.getElementById("my-listings-empty");
  if (emptyView) emptyView.classList.add("hidden");
  if (container) {
    container.innerHTML = `
      <div id="my-listings-loading-skeleton" class="space-y-3 animate-pulse">
        <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md flex gap-3.5 sm:gap-4 items-center">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800/80 flex-shrink-0"></div>
          <div class="flex-1 space-y-2.5 min-w-0">
            <div class="h-4 bg-slate-800 rounded-lg w-3/4"></div>
            <div class="h-3 bg-slate-800/70 rounded-lg w-1/3"></div>
            <div class="h-3 bg-slate-800/50 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>
    `;
  }
}

export function calculateStoreItemCounts(myListings = []) {
  const totalAll = myListings.length;
  const totalAvailable = myListings.filter((l) => !l.isSold && "sold" !== l.status && "booked" !== l.status).length;
  const totalBooked = myListings.filter((l) => "booked" === l.status).length;
  const totalSold = myListings.filter((l) => l.isSold || "sold" === l.status).length;

  return { totalAll, totalAvailable, totalBooked, totalSold };
}

export function updateStoreCountBadges(myListings = []) {
  const countAllEl = document.getElementById("store-count-all");
  const countAvailEl = document.getElementById("store-count-available");
  const countBookedEl = document.getElementById("store-count-booked");
  const countSoldEl = document.getElementById("store-count-sold");

  const { totalAll, totalAvailable, totalBooked, totalSold } = calculateStoreItemCounts(myListings);

  if (countAllEl) countAllEl.textContent = totalAll;
  if (countAvailEl) countAvailEl.textContent = totalAvailable;
  if (countBookedEl) countBookedEl.textContent = totalBooked;
  if (countSoldEl) countSoldEl.textContent = totalSold;

  return { totalAll, totalAvailable, totalBooked, totalSold };
}

export function filterStoreListingsByTab(myListings = [], filter = "all") {
  if (filter === "available") {
    return myListings.filter((l) => !l.isSold && "sold" !== l.status && "booked" !== l.status);
  }
  if (filter === "booked") {
    return myListings.filter((l) => "booked" === l.status);
  }
  if (filter === "sold") {
    return myListings.filter((l) => l.isSold || "sold" === l.status);
  }
  return myListings;
}
