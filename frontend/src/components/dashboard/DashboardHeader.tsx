"use client";

import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

function formatRole(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) =>
      name.charAt(0).toUpperCase(),
    )
    .join("");
}

export function DashboardHeader({
  title,
  description,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/80 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <MobileSidebar />

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>

            {description && (
              <p className="mt-1 hidden truncate text-sm text-slate-500 sm:block">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Role Badge */}
          <Badge className="hidden border-0 bg-blue-100 px-3 py-1.5 text-blue-700 hover:bg-blue-100 md:inline-flex">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />

            {formatRole(user.role)}
          </Badge>

          {/* Profile / Logout */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left transition-all duration-200 hover:border-blue-100 hover:bg-blue-50 focus:border-blue-100 focus:bg-blue-50 focus:outline-none"
            >
              <Avatar className="h-10 w-10 border-2 border-blue-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 font-semibold text-white">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="hidden max-w-44 md:block">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.full_name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:rotate-180 md:block" />
            </button>

            {/* Hover dropdown */}
            <div
              className="
                invisible absolute right-0 top-full z-50
                w-64 translate-y-2 pt-2
                opacity-0
                transition-all duration-200
                group-hover:visible
                group-hover:translate-y-0
                group-hover:opacity-100
                group-focus-within:visible
                group-focus-within:translate-y-0
                group-focus-within:opacity-100
              "
            >
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-200/30">
                {/* Profile */}
                <div className="border-b border-blue-50 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 font-semibold text-white">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.full_name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="p-2">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Current role
                      </p>

                      <p className="font-medium text-slate-700">
                        {formatRole(user.role)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <div className="border-t border-blue-50 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full justify-start rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={logout}
                  >
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                      <LogOut className="h-4 w-4" />
                    </div>

                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}