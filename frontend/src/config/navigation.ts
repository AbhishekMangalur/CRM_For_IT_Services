import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calculator,
  FileText,
  LayoutDashboard,
  Layers3,
  UserRoundCheck,
  Users,
  UserRoundSearch,
  Wrench,
  Award,
  Handshake,
  TrendingUp,
  FileCheck2,
  LibraryBig,
} from "lucide-react";

import type { UserRole } from "@/types/auth";

export interface NavigationItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const salesNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/sales/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/sales/leads",
    icon: UserRoundSearch,
  },
  {
    title: "Activities",
    href: "/sales/activities",
    icon: Activity,
  },
  {
    title: "Opportunities",
    href: "/sales/opportunities",
    icon: BriefcaseBusiness,
  },
];

const accountDirectorNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/account-director/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    href: "/account-director/accounts",
    icon: Building2,
  },
  {
    title: "Contracts",
    href: "/account-director/contracts",
    icon: FileText,
  },
  {
    title: "Customer Health",
    href: "/account-director/health",
    icon: Activity,
  },
  {
    title: "Expansion Opportunities",
    href: "/account-director/opportunities",
    icon: BriefcaseBusiness,
  },
];

const defaultNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "#dashboard",
    icon: LayoutDashboard,
  },
];

export function getNavigationItems(
  role: UserRole | undefined,
  dashboardPath: string | null,
): NavigationItem[] {
  if (role === "SALES") {
    return [
      ...salesNavigation,
      ...allianceNavigation,
      ...rfpNavigation,
    ];
  }

  if (role === "ACCOUNT_DIRECTOR") {
    return accountDirectorNavigation;
  }

  if (role === "PRESALES") {
    return presalesNavigation;
  }

  if (role === "RESOURCE_MANAGER") {
    return resourceManagerNavigation;
  }

  if (role === "EXECUTIVE") {
    return executiveNavigation;
  }

  return defaultNavigation.map((item, index) => ({
    ...item,
    href:
      index === 0 && dashboardPath
        ? dashboardPath
        : item.href,
  }));
}

const presalesNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/presales/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Solutions",
    href: "/presales/solutions",
    icon: Layers3,
  },
  {
    title: "Resource Requirements",
    href: "/presales/resource-requirements",
    icon: Users,
  },
  {
    title: "Estimations",
    href: "/presales/estimations",
    icon: Calculator,
  },
  {
    title: "Template Library",
    href: "/presales/templates",
    icon: LibraryBig,
  },
  {
    title: "Proposals",
    href: "/presales/proposals",
    icon: FileText,
  },
];

const resourceManagerNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/resource-manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    href: "/resource-manager/employees",
    icon: Users,
  },
  {
    title: "Skills",
    href: "/resource-manager/skills",
    icon: Wrench,
  },
  {
    title: "Employee Skills",
    href: "/resource-manager/employee-skills",
    icon: BadgeCheck,
  },
  {
    title: "Resource Requests",
    href: "/resource-manager/resource-requests",
    icon: BriefcaseBusiness,
  },
  {
    title: "Resource Allocations",
    href: "/resource-manager/resource-allocations",
    icon: UserRoundCheck,
  },
];

const executiveNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/executive/dashboard",
    icon: LayoutDashboard,
  },
];

const allianceNavigation: NavigationItem[] = [
  {
    title: "Alliance Dashboard",
    href: "/alliance/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Partners",
    href: "/alliance/partners",
    icon: Handshake,
  },
  {
    title: "Deal Registrations",
    href: "/alliance/deal-registrations",
    icon: BriefcaseBusiness,
  },
  {
    title: "Influenced Opportunities",
    href: "/alliance/influenced-opportunities",
    icon: TrendingUp,
  },
  {
    title: "Certifications",
    href: "/alliance/certifications",
    icon: Award,
  },
];

const rfpNavigation: NavigationItem[] = [
  {
    title: "RFP Dashboard",
    href: "/rfp/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "RFPs",
    href: "/rfp/rfps",
    icon: FileText,
  },
  {
    title: "Bid Evaluations",
    href: "/rfp/evaluations",
    icon: FileCheck2,
  },
  {
    title: "RFP Assignments",
    href: "/rfp/assignments",
    icon: Users,
  },
];
