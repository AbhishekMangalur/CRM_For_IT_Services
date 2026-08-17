"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

import {
  getEstimations,
  getProposals,
  getResourceRequirements,
  getSolutions,
} from "@/lib/presales-api";
import { getSalesOpportunities } from "@/lib/sales-api";

import type {
  Estimation,
  PresalesDashboardData,
  Proposal,
  ResourceRequirement,
  Solution,
} from "@/types/presales";

interface DashboardMetrics {
  totalSolutions: number;

  draftSolutions: number;

  reviewSolutions: number;

  approvedSolutions: number;

  pendingEstimations: number;

  approvedEstimations: number;

  rejectedEstimations: number;

  submittedProposals: number;

  pendingProposals: number;

  approvedProposals: number;

  totalEstimatedRevenue: number;

  totalDeliveryCost: number;

  expectedProfit: number;

  averageMargin: number;

  opportunityNames: Record<number, string>;

  recentSolutions: Solution[];

  recentEstimations: Estimation[];

  recentResources: ResourceRequirement[];

  recentProposals: Proposal[];
}

export interface PresalesDashboardResult {
  data: PresalesDashboardData | null;

  metrics: DashboardMetrics | null;

  isLoading: boolean;

  error: string | null;

  refresh: () => Promise<void>;
}

function numberValue(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
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
    return "Unexpected error.";
  }

  if (!error.response) {
    return "Unable to connect to backend.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  return "Unable to load dashboard.";
}

export function usePresalesDashboard(): PresalesDashboardResult {
  const [data, setData] =
    useState<PresalesDashboardData | null>(
      null,
    );

  const [metrics, setMetrics] =
    useState<DashboardMetrics | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const refresh =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);

      setError(null);

      try {
        const [
          solutions,
          estimations,
          resourceRequirements,
          proposals,
          opportunities,
        ] = await Promise.all([
          getSolutions(),

          getEstimations(),

          getResourceRequirements(),

          getProposals(),

          getSalesOpportunities(),
        ]);

        setData({
          solutions,

          estimations,

          resourceRequirements,

          proposals,
        });

        const revenue =
          estimations.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.billing_amount,
              ),
            0,
          );

        const deliveryCost =
          estimations.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.total_delivery_cost,
              ),
            0,
          );

        const profit =
          estimations.reduce(
            (sum, item) =>
              sum +
              numberValue(
                item.expected_profit,
              ),
            0,
          );

        const avgMargin =
          estimations.length > 0
            ? estimations.reduce(
                (sum, item) =>
                  sum +
                  item.expected_margin_percentage,
                0,
              ) / estimations.length
            : 0;

        setMetrics({
          totalSolutions:
            solutions.length,

          draftSolutions:
            solutions.filter(
              (s) =>
                s.solution_status ===
                "DRAFT",
            ).length,

          reviewSolutions:
            solutions.filter(
              (s) =>
                s.solution_status ===
                "IN_REVIEW",
            ).length,

          approvedSolutions:
            solutions.filter(
              (s) =>
                s.solution_status ===
                "APPROVED",
            ).length,

          pendingEstimations:
            estimations.filter(
              (e) =>
                e.approval_status ===
                "PENDING",
            ).length,

          approvedEstimations:
            estimations.filter(
              (e) =>
                e.approval_status ===
                "APPROVED",
            ).length,

          rejectedEstimations:
            estimations.filter(
              (e) =>
                e.approval_status ===
                "REJECTED",
            ).length,

          submittedProposals:
            proposals.filter(
              (p) =>
                p.proposal_status ===
                "SUBMITTED",
            ).length,

          pendingProposals:
            proposals.filter(
              (p) =>
                p.approval_status ===
                "PENDING",
            ).length,

          approvedProposals:
            proposals.filter(
              (p) =>
                p.approval_status ===
                "APPROVED",
            ).length,

          totalEstimatedRevenue:
            revenue,

          totalDeliveryCost:
            deliveryCost,

          expectedProfit:
            profit,

          averageMargin:
            avgMargin,

          opportunityNames: Object.fromEntries(
            opportunities.map((opportunity) => [
              opportunity.id,
              opportunity.opportunity_name,
            ]),
          ),

          recentSolutions:
            [...solutions]
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at,
                  ).getTime() -
                  new Date(
                    a.created_at,
                  ).getTime(),
              )
              .slice(0, 5),

          recentEstimations:
            [...estimations]
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at,
                  ).getTime() -
                  new Date(
                    a.created_at,
                  ).getTime(),
              )
              .slice(0, 5),

          recentResources:
            [...resourceRequirements]
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at,
                  ).getTime() -
                  new Date(
                    a.created_at,
                  ).getTime(),
              )
              .slice(0, 5),

          recentProposals:
            [...proposals]
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at,
                  ).getTime() -
                  new Date(
                    a.created_at,
                  ).getTime(),
              )
              .slice(0, 5),
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  return {
    data,

    metrics,

    isLoading,

    error,

    refresh,
  };
}
