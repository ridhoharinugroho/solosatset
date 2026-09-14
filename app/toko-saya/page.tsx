"use client";

import React from "react";
import { AppShell } from "../../src/components/layout/AppShell";
import { TokoSayaFeature } from "../../src/features/toko-saya/TokoSayaFeature";

export default function TokoSayaPage() {
  return (
    <AppShell>
      <TokoSayaFeature />
    </AppShell>
  );
}
