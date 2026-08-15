"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { getSalesDashboardResources } from "@/lib/sales-api";
import type {
  PipelineStageData,
  SalesActivity,
  SalesDashboardData,
  SalesOpportunity,
} from "@/types/sales";

interface UseSalesDashboardResult {
  data: SalesDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function normalizeValue(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function isOpenOpportunity(
  opportunity: SalesOpportunity,
): boolean {
  const status = opportunity.status.toUpperCase();

  return ![
    "WON",
    "LOST",
    "CLOSED",
    "CLOSED_WON",
    "CLOSED_LOST",
  ].includes(status);
}

function isPendingFollowUp(
  activity: SalesActivity,
): boolean {
  if (!activity.next_follow_up_date) {
    return false;
  }

  if (activity.status.toUpperCase() === "CANCELLED") {
    return false;
  }

  const followUpTime = new Date(
    activity.next_follow_up_date,
  ).getTime();

  return (
    Number.isFinite(followUpTime) &&
    followUpTime >= Date.now()
  );
}

function createPipelineStageData(
  opportunities: SalesOpportunity[],
): PipelineStageData[] {
  const stageMap = new Map<
    string,
    {
      count: number;
      value: number;
    }
  >();

  opportunities.forEach((opportunity) => {
    const stage =
      opportunity.pipeline_stage || "UNSPECIFIED";

    const current = stageMap.get(stage) ?? {
      count: 0,
      value: 0,
    };

    stageMap.set(stage, {
      count: current.count + 1,
      value:
        current.value +
        normalizeValue(opportunity.deal_value),
    });
  });

  return Array.from(stageMap.entries())
    .map(([stage, summary]) => ({
      stage,
      count: summary.count,
      value: summary.value,
    }))
    .sort((a, b) => b.value - a.value);
}

function sortByCreatedAtDescending<
  T extends { created_at: string },
>(records: T[]): T[] {
  return [...records].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  );
}

function buildDashboardData(
  leads: SalesDashboardData["leads"],
  opportunities: SalesDashboardData["opportunities"],
  activities: SalesDashboardData["activities"],
): SalesDashboardData {
  const openOpportunities =
    opportunities.filter(isOpenOpportunity);

  const totalPipelineValue =
    openOpportunities.reduce(
      (total, opportunity) =>
        total +
        normalizeValue(opportunity.deal_value),
      0,
    );

  const averageWinProbability =
    openOpportunities.length > 0
      ? openOpportunities.reduce(
          (total, opportunity) =>
            total +
            normalizeValue(
              opportunity.win_probability,
            ),
          0,
        ) / openOpportunities.length
      : 0;

  const upcomingFollowUps = activities
    .filter(isPendingFollowUp)
    .sort((a, b) => {
      const firstDate = new Date(
        a.next_follow_up_date ?? "",
      ).getTime();

      const secondDate = new Date(
        b.next_follow_up_date ?? "",
      ).getTime();

      return firstDate - secondDate;
    });

  return {
    leads,
    opportunities,
    activities,

    totalPipelineValue,
    openOpportunities: openOpportunities.length,
    averageWinProbability,
    pendingFollowUps: upcomingFollowUps.length,

    totalLeads: leads.length,

    qualifiedLeads: leads.filter(
      (lead) =>
        lead.lead_status.toUpperCase() ===
        "QUALIFIED",
    ).length,

    highPriorityLeads: leads.filter(
      (lead) =>
        lead.priority.toUpperCase() === "HIGH",
    ).length,

    completedActivities: activities.filter(
      (activity) =>
        activity.status.toUpperCase() ===
        "COMPLETED",
    ).length,

    recentOpportunities:
      sortByCreatedAtDescending(
        opportunities,
      ).slice(0, 5),

    recentActivities:
      sortByCreatedAtDescending(
        activities,
      ).slice(0, 5),

    upcomingFollowUps:
      upcomingFollowUps.slice(0, 5),

    pipelineStages:
      createPipelineStageData(opportunities),
  };
}

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred while loading the dashboard.";
  }

  if (!error.response) {
    return "Unable to connect to the backend. Check whether FastAPI is running.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return "Unable to load the Sales dashboard data.";
}

export function useSalesDashboard(): UseSalesDashboardResult {
  const [data, setData] =
    useState<SalesDashboardData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const refresh =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const {
          leads,
          opportunities,
          activities,
        } = await getSalesDashboardResources();

        const dashboardData =
          buildDashboardData(
            leads,
            opportunities,
            activities,
          );

        setData(dashboardData);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}