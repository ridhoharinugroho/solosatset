"use client";

import React from "react";
import { AppShell } from "../src/components/layout/AppShell";
import { HomeFeature } from "../src/features/home/HomeFeature";

export default function HomePage() {
  return (
    <AppShell>
      <HomeFeature />
    </AppShell>
  );
}
