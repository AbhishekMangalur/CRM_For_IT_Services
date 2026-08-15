"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { getNavigationItems } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, dashboardPath } = useAuth();
  const navigationItems = getNavigationItems(
    user?.role,
    dashboardPath,
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-hidden lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-700 via-indigo-800 to-slate-950" />

      <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex min-h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <p className="text-base font-bold text-white">
              IT Services CRM
            </p>

            <p className="text-xs text-blue-200">
              Business Workspace
            </p>
          </div>
        </div>

        {user && (
          <div className="mx-4 mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white">
                {user.full_name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((name) => name[0]?.toUpperCase())
                  .join("")}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.full_name}
                </p>

                <p className="truncate text-xs text-blue-200">
                  {formatRole(user.role)}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-5 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
            Workspace
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={
                  isActive
                    ? "group flex items-center justify-between rounded-xl border border-white/20 bg-white/15 px-3.5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur transition"
                    : "group flex items-center justify-between rounded-xl border border-transparent px-3.5 py-3 text-sm font-medium text-blue-100 transition-all duration-200 hover:border-white/10 hover:bg-white/10 hover:text-white"
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px]" />
                  {item.title}
                </span>

                <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300/10 bg-emerald-400/10 px-3 py-2.5 text-xs text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            Secure JWT session
          </div>
        </div>
      </div>
    </aside>
  );
}
