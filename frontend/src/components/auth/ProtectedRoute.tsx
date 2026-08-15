"use client";

import {
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

import type {
  UserRole,
} from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;

  /*
   * Existing usage:
   * allowedRole="SALES"
   */
  allowedRole?: UserRole;

  /*
   * New usage:
   * allowedRoles={["SALES", "ACCOUNT_DIRECTOR"]}
   */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();

  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  /*
   * Build one final allowed-role list.
   *
   * This keeps all of your existing pages working:
   *
   * <ProtectedRoute allowedRole="SALES">
   *
   * while also allowing:
   *
   * <ProtectedRoute
   *   allowedRoles={["SALES", "ACCOUNT_DIRECTOR"]}
   * >
   */
  const permittedRoles: UserRole[] =
    allowedRoles ??
    (allowedRole
      ? [allowedRole]
      : []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /*
     * Not logged in
     */
    if (
      !isAuthenticated ||
      !user
    ) {
      router.replace("/login");
      return;
    }

    /*
     * No role restriction was supplied.
     *
     * The route is authenticated-only.
     */
    if (
      permittedRoles.length === 0
    ) {
      return;
    }

    /*
     * User's role is allowed.
     */
    if (
      permittedRoles.includes(
        user.role,
      )
    ) {
      return;
    }

    /*
     * User is authenticated but attempting
     * to access a page belonging to another role.
     *
     * ALWAYS use dashboard_path returned by
     * the backend.
     */
    if (user.dashboard_path) {
      router.replace(
        user.dashboard_path,
      );
      return;
    }

    /*
     * Fallback only if dashboard_path is somehow
     * unavailable.
     */
    router.replace("/login");
  }, [
    isAuthenticated,
    isLoading,
    permittedRoles,
    router,
    user,
  ]);

  /*
   * Auth is still being restored.
   */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-blue-100 p-4">
            <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
          </div>

          <p className="text-sm text-slate-500">
            Verifying your session...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Avoid briefly showing protected content
   * before redirecting to /login.
   */
  if (
    !isAuthenticated ||
    !user
  ) {
    return null;
  }

  /*
   * Authenticated-only page.
   */
  if (
    permittedRoles.length === 0
  ) {
    return <>{children}</>;
  }

  /*
   * Wrong role.
   */
  if (
    !permittedRoles.includes(
      user.role,
    )
  ) {
    return null;
  }

  return <>{children}</>;
}