import { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50">
      <div className="pointer-events-none fixed -right-32 top-20 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

      <div className="pointer-events-none fixed bottom-0 left-60 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <DashboardSidebar />

      <div className="relative z-10 lg:pl-72">
        <DashboardHeader
          title={title}
          description={description}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}