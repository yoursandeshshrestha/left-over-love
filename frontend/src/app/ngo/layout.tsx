// src/app/ngo/layout.tsx (updated)
"use client";

import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function NGOLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth("ngo");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar role="ngo" />
      <div className="flex-1 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
