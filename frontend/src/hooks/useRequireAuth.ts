// src/hooks/useRequireAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

type Role = "admin" | "vendor" | "ngo";

export const useRequireAuth = (requiredRole?: Role) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Wait until auth state is determined
    if (!loading) {
      // If user is not logged in, redirect to login
      if (!user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      }
      // If a specific role is required and user doesn't have it, redirect to appropriate dashboard
      else if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        switch (user?.role) {
          case "admin":
            router.push("/admin/dashboard");
            break;
          case "vendor":
            router.push("/vendor/dashboard");
            break;
          case "ngo":
            router.push("/ngo/dashboard");
            break;
        }
      } else {
        // User is authenticated with correct role
        setAuthChecked(true);
      }
    }
  }, [user, loading, requiredRole, router, pathname]);

  return { user, loading: loading || !authChecked };
};
