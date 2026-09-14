"use client";

import React, { useState } from "react";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { AdminLoginForm } from "./components/AdminLoginForm";
import { AdminSummaryCards } from "./components/AdminSummaryCards";
import { AdminListingsTable } from "./components/AdminListingsTable";
import { AdminReviewTable } from "./components/AdminReviewTable";

export interface AdminFeatureProps {
  onLogoutSuccess?: () => void;
}

export const AdminFeature: React.FC<AdminFeatureProps> = ({ onLogoutSuccess }) => {
  const { isAuthenticated, user, isLoading: isAuthLoading, error: authError, login, logout } = useAdminAuth();
  const {
    listings,
    stats,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    selectedStatus,
    setSelectedStatus,
    toggleHide,
    toggleSold,
    removeListing,
  } = useAdminDashboard();

  const [currentTab, setCurrentTab] = useState<"listings" | "reviews">("listings");

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full mb-3" />
        <p className="text-xs text-slate-400 font-medium">Memverifikasi otorisasi admin...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onLogin={login} error={authError} isLoading={isAuthLoading} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4">
      {/* Header & User Info */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Panel Kontrol Administrator</span>
              <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 text-[10px] font-extrabold rounded-full border border-rose-800">
                {user?.role || "admin"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <span className="font-semibold text-slate-200">{user?.username}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await logout();
            if (onLogoutSuccess) onLogoutSuccess();
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          🚪 Keluar (Logout)
        </button>
      </div>

      {/* Summary Cards */}
      <AdminSummaryCards stats={stats} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setCurrentTab("listings")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            currentTab === "listings"
              ? "bg-rose-900 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Moderasi Iklan ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("reviews")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            currentTab === "reviews"
              ? "bg-rose-900 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Moderasi Ulasan
        </button>
      </div>

      {/* Content */}
      {currentTab === "listings" ? (
        <AdminListingsTable
          listings={listings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onToggleHide={toggleHide}
          onToggleSold={toggleSold}
          onDeleteListing={removeListing}
        />
      ) : (
        <AdminReviewTable />
      )}
    </div>
  );
};

export default AdminFeature;
