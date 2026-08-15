"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();

  const {
    dashboardPath,
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && dashboardPath) {
      router.replace(dashboardPath);
      return;
    }

    router.replace(ROUTES.LOGIN);
  }, [
    dashboardPath,
    isAuthenticated,
    isLoading,
    router,
  ]);

  return <AuthLoadingScreen message="Opening CRM..." />;
}