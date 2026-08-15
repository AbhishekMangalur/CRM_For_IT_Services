"use client";

import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function UnauthorizedPage() {
  const { dashboardPath, logout } = useAuth();

  const returnToDashboard = () => {
    if (dashboardPath) {
      window.location.replace(dashboardPath);
      return;
    }

    logout();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-7 w-7 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Access denied
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          You do not have permission to access this page.
        </p>

        <Button
          className="mt-6 w-full"
          onClick={returnToDashboard}
        >
          Return to dashboard
        </Button>
      </div>
    </main>
  );
}