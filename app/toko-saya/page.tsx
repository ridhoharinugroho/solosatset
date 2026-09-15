"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../src/components/layout/AppShell";
import { TokoSayaFeature } from "../../src/features/toko-saya/TokoSayaFeature";
import { AuthModal } from "../../src/features/auth/AuthModal";
import { ProfileModal } from "../../src/features/profile/components/ProfileModal";
import { getCurrentUser, isUserLoggedIn, type RegisteredUser } from "../../src/services/authService";

export default function TokoSayaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      setIsAuthModalOpen(true);
    }

    const handleUserUpdate = () => {
      const fresh = getCurrentUser();
      setCurrentUser(fresh);
      if (fresh) {
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener("userProfileUpdated", handleUserUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUserUpdate);
  }, []);

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
    if (!getCurrentUser()) {
      router.push("/");
    }
  };

  const handleProfileClick = () => {
    if (isUserLoggedIn()) {
      setIsProfileModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <AppShell
        activeTab="toko-saya"
        onProfileClick={handleProfileClick}
        onTabChange={(tab) => {
          if (tab === "home" || tab === "favorites") {
            router.push("/");
          } else if (tab === "profile") {
            handleProfileClick();
          }
        }}
      >
        <TokoSayaFeature />
      </AppShell>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthClose}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogoutSuccess={() => {
          setIsProfileModalOpen(false);
          router.push("/");
        }}
      />
    </>
  );
}

