"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { api } from "@/lib/api";

import {
  getRfpDashboardResources,
} from "@/lib/rfp-api";

import type {
  BidEvaluation,
  Rfp,
  RfpAssignment,
  RfpDashboardData,
} from "@/types/rfp";

interface RfpDashboardMetrics {
  totalRfps: number;

  pendingEvaluation: number;

  bidCount: number;
  noBidCount: number;

  receivedCount: number;
  evaluatedCount: number;
  inProgressCount: number;
  submittedCount: number;
  wonCount: number;
  lostCount: number;

  upcomingDeadlines: number;
  overdueRfps: number;

  totalPipelineValue: number;

  averageEvaluationScore: number;

  totalAssignments: number;
  activeAssignments: number;

  userNames: Record<number, string>;

  recentRfps: Rfp[];
  recentEvaluations: BidEvaluation[];
  recentAssignments: RfpAssignment[];

  upcomingRfps: Rfp[];
}

export interface UseRfpDashboardResult {
  data: RfpDashboardData | null;

  metrics: RfpDashboardMetrics | null;

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
    return "An unexpected error occurred while loading RFP dashboard data.";
  }

  if (!error.response) {
    return "Unable to connect to the backend.";
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
    return "You do not have permission to access RFP data.";
  }

  return "Unable to load RFP dashboard data.";
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

function isUpcomingDeadline(
  deadline: string,
): boolean {
  const today = new Date();
  const dueDate = new Date(deadline);

  if (
    Number.isNaN(dueDate.getTime())
  ) {
    return false;
  }

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const sevenDaysLater =
    new Date(today);

  sevenDaysLater.setDate(
    today.getDate() + 7,
  );

  return (
    dueDate >= today &&
    dueDate <= sevenDaysLater
  );
}

function isOverdue(
  rfp: Rfp,
): boolean {
  if (
    [
      "SUBMITTED",
      "WON",
      "LOST",
      "NO_BID",
    ].includes(rfp.rfp_status)
  ) {
    return false;
  }

  const deadline =
    new Date(
      rfp.submission_deadline,
    );

  if (
    Number.isNaN(
      deadline.getTime(),
    )
  ) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  deadline.setHours(
    0,
    0,
    0,
    0,
  );

  return deadline < today;
}

/* ================================================= */
/* METRICS */
/* ================================================= */

function buildMetrics(
  rfps: Rfp[],
  evaluations: BidEvaluation[],
  assignments: RfpAssignment[],
  userNames: Record<number, string>,
): RfpDashboardMetrics {
  const pendingEvaluation =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "PENDING",
    );

  const bidRfps =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "BID",
    );

  const noBidRfps =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "NO_BID",
    );

  const receivedRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "RECEIVED",
    );

  const evaluatedRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "EVALUATED",
    );

  const inProgressRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "IN_PROGRESS",
    );

  const submittedRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "SUBMITTED",
    );

  const wonRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "WON",
    );

  const lostRfps =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "LOST",
    );

  const upcomingRfps =
    rfps
      .filter(
        (rfp) =>
          ![
            "SUBMITTED",
            "WON",
            "LOST",
            "NO_BID",
          ].includes(
            rfp.rfp_status,
          ) &&
          isUpcomingDeadline(
            rfp.submission_deadline,
          ),
      )
      .sort(
        (first, second) =>
          new Date(
            first.submission_deadline,
          ).getTime() -
          new Date(
            second.submission_deadline,
          ).getTime(),
      );

  const overdueRfps =
    rfps.filter(
      (rfp) =>
        isOverdue(rfp),
    );

  const totalPipelineValue =
    rfps
      .filter(
        (rfp) =>
          rfp.bid_decision !==
            "NO_BID" &&
          ![
            "LOST",
          ].includes(
            rfp.rfp_status,
          ),
      )
      .reduce(
        (total, rfp) =>
          total +
          numberValue(
            rfp.estimated_value,
          ),
        0,
      );

  const averageEvaluationScore =
    evaluations.length > 0
      ? evaluations.reduce(
          (
            total,
            evaluation,
          ) =>
            total +
            numberValue(
              evaluation.overall_score,
            ),
          0,
        ) /
        evaluations.length
      : 0;

  const activeAssignments =
    assignments.filter(
      (assignment) =>
        ![
          "COMPLETED",
          "CANCELLED",
        ].includes(
          assignment.assignment_status,
        ),
    );

  return {
    totalRfps:
      rfps.length,

    pendingEvaluation:
      pendingEvaluation.length,

    bidCount:
      bidRfps.length,

    noBidCount:
      noBidRfps.length,

    receivedCount:
      receivedRfps.length,

    evaluatedCount:
      evaluatedRfps.length,

    inProgressCount:
      inProgressRfps.length,

    submittedCount:
      submittedRfps.length,

    wonCount:
      wonRfps.length,

    lostCount:
      lostRfps.length,

    upcomingDeadlines:
      upcomingRfps.length,

    overdueRfps:
      overdueRfps.length,

    totalPipelineValue,

    averageEvaluationScore,

    totalAssignments:
      assignments.length,

    activeAssignments:
      activeAssignments.length,

    userNames,

    recentRfps:
      sortByCreatedAt(
        rfps,
      ).slice(0, 5),

    recentEvaluations:
      sortByCreatedAt(
        evaluations,
      ).slice(0, 5),

    recentAssignments:
      sortByCreatedAt(
        assignments,
      ).slice(0, 5),

    upcomingRfps:
      upcomingRfps.slice(
        0,
        5,
      ),
  };
}

/* ================================================= */
/* HOOK */
/* ================================================= */

export function useRfpDashboard(): UseRfpDashboardResult {
  const [data, setData] =
    useState<RfpDashboardData | null>(
      null,
    );

  const [
    metrics,
    setMetrics,
  ] =
    useState<RfpDashboardMetrics | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const refresh =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
          const [
            {
              rfps,
              evaluations,
              assignments,
            },
            usersResponse,
          ] = await Promise.all([
            getRfpDashboardResources(),
            api.get<Array<{ id: number; full_name: string }>>("/api/users"),
          ]);

          const userNames = Object.fromEntries(
            usersResponse.data.map((user) => [user.id, user.full_name]),
          );

          setData({
            rfps,
            evaluations,
            assignments,
          });

          setMetrics(
            buildMetrics(
              rfps,
              evaluations,
              assignments,
              userNames,
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
