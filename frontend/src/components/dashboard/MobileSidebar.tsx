"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  ChevronRight,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getNavigationItems } from "@/config/navigation";
import { useAuth } from "@/hooks/useAuth";

export function MobileSidebar() {
  const { user, dashboardPath } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = getNavigationItems(
    user?.role,
    dashboardPath,
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="border-blue-100 bg-white/90 shadow-sm lg:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="h-5 w-5 text-blue-800" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-72 overflow-hidden border-0 bg-gradient-to-b from-blue-700 via-indigo-800 to-slate-950 p-0 text-white"
      >
        <div className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col">
          <SheetHeader className="border-b border-white/10 px-5 py-5">
            <SheetTitle className="flex items-center gap-3 text-left text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <Building2 className="h-6 w-6" />
              </span>

              <span>
                <span className="block text-base font-bold">
                  IT Services CRM
                </span>

                <span className="block text-xs font-normal text-blue-200">
                  Business Workspace
                </span>
              </span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Workspace
            </p>

            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" />
                    {item.title}
                  </span>

                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
