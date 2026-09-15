"use client";

import React, { useState } from "react";
import { AppShell } from "../src/components/layout/AppShell";
import { HomeFeature } from "../src/features/home/HomeFeature";
import { NotificationFeature } from "../src/features/notification/NotificationFeature";
import { ListingForm } from "../src/features/listing-management/components/ListingForm";
import { getPublicListings } from "../src/services/listingService";
import { mapListingDtoToDomain } from "../src/domain/listing/listing.mapper";
import { TraktirKopiModal } from "../src/components/modals/TraktirKopiModal";
import { ReviewFeature } from "../src/features/review/ReviewFeature";
import { AuthModal } from "../src/features/auth/AuthModal";
import { X } from "lucide-react";

export default function HomePage() {
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isCreateListingModalOpen, setIsCreateListingModalOpen] = useState(false);
  const [isTraktirKopiModalOpen, setIsTraktirKopiModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "reviews" | "toko-saya" | "profile">("home");

  // Close open modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotifModalOpen(false);
        setIsCreateListingModalOpen(false);
        setIsTraktirKopiModalOpen(false);
        setIsReviewsModalOpen(false);
        setIsAuthModalOpen(false);
        setActiveTab("home");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeAllModals = () => {
    setIsNotifModalOpen(false);
    setIsCreateListingModalOpen(false);
    setIsTraktirKopiModalOpen(false);
    setIsReviewsModalOpen(false);
    setIsAuthModalOpen(false);
  };

  const initialListings = getPublicListings().map((item: any) => mapListingDtoToDomain(item));

  return (
    <>
      <AppShell
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab === "reviews") {
          closeAllModals();
          setIsReviewsModalOpen(true);
        } else if (tab === "profile") {
          closeAllModals();
          setIsAuthModalOpen(true);
        } else if (tab === "home") {
          closeAllModals();
        }
      }}
      onNotificationClick={() => {
        closeAllModals();
        setIsNotifModalOpen(true);
      }}
      onCreateListingClick={() => {
        closeAllModals();
        setIsCreateListingModalOpen(true);
      }}
      onTraktirKopiClick={() => {
        closeAllModals();
        setIsTraktirKopiModalOpen(true);
      }}
      onProfileClick={() => {
        closeAllModals();
        setActiveTab("profile");
        setIsAuthModalOpen(true);
      }}
    >
      <HomeFeature
        initialListings={initialListings}
        onCreateListingClick={() => setIsCreateListingModalOpen(true)}
      />
    </AppShell>

    {/* Traktir Kopi Modal */}
    <TraktirKopiModal
      isOpen={isTraktirKopiModalOpen}
      onClose={() => setIsTraktirKopiModalOpen(false)}
    />

    {/* Notification Center Modal */}
    {isNotifModalOpen && (
      <div
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        onClick={() => setIsNotifModalOpen(false)}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <NotificationFeature onClose={() => setIsNotifModalOpen(false)} />
        </div>
      </div>
    )}

    {/* Pasang Iklan / Create Listing Modal */}
    {isCreateListingModalOpen && (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
        onClick={() => setIsCreateListingModalOpen(false)}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setIsCreateListingModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
          <ListingForm
            onClose={() => setIsCreateListingModalOpen(false)}
          />
        </div>
      </div>
    )}

    {/* Ulasan & Rating Komunitas Modal */}
    {isReviewsModalOpen && (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
        onClick={() => {
          setIsReviewsModalOpen(false);
          setActiveTab("home");
        }}
      >
        <div
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setIsReviewsModalOpen(false);
              setActiveTab("home");
            }}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Ulasan"
          >
            <X className="w-5 h-5" />
          </button>
          <ReviewFeature sellerId="user-1787309560138" sellerName="Komunitas SOPALOKA" />
        </div>
      </div>
    )}

    {/* Auth / Profil Modal */}
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => {
        setIsAuthModalOpen(false);
        setActiveTab("home");
      }}
    />
  </>
  );
}


