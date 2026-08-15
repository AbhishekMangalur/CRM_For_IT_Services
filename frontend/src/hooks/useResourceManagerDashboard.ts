"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

import {
  getResourceManagerDashboardResources,
} from "@/lib/resource-manager-api";

import type {
  EmployeeSkill,
  ResourceAllocation,
  ResourceEmployee,
  ResourceManagerDashboardData,
  ResourceRequest,
  ResourceSkill,
} from "@/types/resource-manager";

interface ResourceManagerDashboardMetrics {
  totalEmployees: number;

  activeEmployees: number;

  availableEmployees: number;

  partiallyAvailableEmployees: number;

  allocatedEmployees: number;

  averageUtilization: number;

  totalSkills: number;

  activeSkills: number;

  totalEmployeeSkills: number;

  pendingRequests: number;

  inProgressRequests: number;

  allocatedRequests: number;

  activeAllocations: number;

  confirmedAllocations: number;

  softBookings: number;

  hardBookings: number;

  averageAllocationPercentage: number;

  recentEmployees: ResourceEmployee[];

  recentRequests: ResourceRequest[];

  recentAllocations: ResourceAllocation[];

  recentEmployeeSkills: EmployeeSkill[];
}

export interface UseResourceManagerDashboardResult {
  data: ResourceManagerDashboardData | null;

  metrics:
    | ResourceManagerDashboardMetrics
    | null;

  isLoading: boolean;

  error: string | null;

  refresh: () => Promise<void>;
}

/* ================================================= */
/* HELPERS */
/* ================================================= */

function numberValue(
  value:
    | string
    | number
    | null
    | undefined,
): number {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred while loading the Resource Manager dashboard.";
  }

  if (!error.response) {
    return "Unable to connect to the backend. Check whether FastAPI is running.";
  }

  const detail =
    error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message ===
      "string"
  ) {
    return detail.message;
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to access Resource Manager data.";
  }

  return "Unable to load Resource Manager dashboard data.";
}

function sortByCreatedAt<
  T extends {
    created_at: string;
  },
>(records: T[]): T[] {
  return [...records].sort(
    (first, second) =>
      new Date(
        second.created_at,
      ).getTime() -
      new Date(
        first.created_at,
      ).getTime(),
  );
}

function buildMetrics(
  employees: ResourceEmployee[],
  skills: ResourceSkill[],
  employeeSkills: EmployeeSkill[],
  resourceRequests: ResourceRequest[],
  allocations: ResourceAllocation[],
): ResourceManagerDashboardMetrics {
  /* ---------------- EMPLOYEES ---------------- */

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active,
    );

  const availableEmployees =
    activeEmployees.filter(
      (employee) =>
        employee.availability_status ===
        "AVAILABLE",
    );

  const partiallyAvailableEmployees =
    activeEmployees.filter(
      (employee) =>
        employee.availability_status ===
        "PARTIALLY_AVAILABLE",
    );

  const allocatedEmployees =
    activeEmployees.filter(
      (employee) =>
        employee.availability_status ===
        "ALLOCATED",
    );

  const averageUtilization =
    activeEmployees.length > 0
      ? activeEmployees.reduce(
          (total, employee) =>
            total +
            numberValue(
              employee.current_utilization_percentage,
            ),
          0,
        ) / activeEmployees.length
      : 0;

  /* ---------------- SKILLS ---------------- */

  const activeSkills =
    skills.filter(
      (skill) => skill.is_active,
    );

  /* ---------------- REQUESTS ---------------- */

  const pendingRequests =
    resourceRequests.filter(
      (request) =>
        request.request_status ===
        "PENDING",
    );

  const inProgressRequests =
    resourceRequests.filter(
      (request) =>
        request.request_status ===
        "IN_PROGRESS",
    );

  const allocatedRequests =
    resourceRequests.filter(
      (request) =>
        request.request_status ===
        "ALLOCATED",
    );

  /* ---------------- ALLOCATIONS ---------------- */

  const activeAllocations =
    allocations.filter(
      (allocation) =>
        ![
          "COMPLETED",
          "CANCELLED",
        ].includes(
          allocation.allocation_status,
        ),
    );

  const confirmedAllocations =
    allocations.filter(
      (allocation) =>
        allocation.allocation_status ===
        "CONFIRMED",
    );

  const softBookings =
    allocations.filter(
      (allocation) =>
        allocation.allocation_type ===
        "SOFT_BOOKING",
    );

  const hardBookings =
    allocations.filter(
      (allocation) =>
        allocation.allocation_type ===
        "HARD_BOOKING",
    );

  const averageAllocationPercentage =
    activeAllocations.length > 0
      ? activeAllocations.reduce(
          (total, allocation) =>
            total +
            numberValue(
              allocation.allocation_percentage,
            ),
          0,
        ) / activeAllocations.length
      : 0;

  return {
    totalEmployees: employees.length,

    activeEmployees:
      activeEmployees.length,

    availableEmployees:
      availableEmployees.length,

    partiallyAvailableEmployees:
      partiallyAvailableEmployees.length,

    allocatedEmployees:
      allocatedEmployees.length,

    averageUtilization,

    totalSkills:
      skills.length,

    activeSkills:
      activeSkills.length,

    totalEmployeeSkills:
      employeeSkills.length,

    pendingRequests:
      pendingRequests.length,

    inProgressRequests:
      inProgressRequests.length,

    allocatedRequests:
      allocatedRequests.length,

    activeAllocations:
      activeAllocations.length,

    confirmedAllocations:
      confirmedAllocations.length,

    softBookings:
      softBookings.length,

    hardBookings:
      hardBookings.length,

    averageAllocationPercentage,

    recentEmployees:
      sortByCreatedAt(
        employees,
      ).slice(0, 5),

    recentRequests:
      sortByCreatedAt(
        resourceRequests,
      ).slice(0, 5),

    recentAllocations:
      sortByCreatedAt(
        allocations,
      ).slice(0, 5),

    recentEmployeeSkills:
      sortByCreatedAt(
        employeeSkills,
      ).slice(0, 5),
  };
}

/* ================================================= */
/* HOOK */
/* ================================================= */

export function useResourceManagerDashboard(): UseResourceManagerDashboardResult {
  const [data, setData] =
    useState<ResourceManagerDashboardData | null>(
      null,
    );

  const [metrics, setMetrics] =
    useState<ResourceManagerDashboardMetrics | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const refresh =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
          const {
            employees,
            skills,
            employeeSkills,
            resourceRequests,
            allocations,
          } =
            await getResourceManagerDashboardResources();

          setData({
            employees,
            skills,
            employeeSkills,
            resourceRequests,
            allocations,
          });

          setMetrics(
            buildMetrics(
              employees,
              skills,
              employeeSkills,
              resourceRequests,
              allocations,
            ),
          );
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
            ),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    metrics,
    isLoading,
    error,
    refresh,
  };
}