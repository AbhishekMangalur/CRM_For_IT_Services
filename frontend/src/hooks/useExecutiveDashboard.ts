"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

import {
  getExecutiveKpiSnapshots,
  getLatestExecutiveKpiSnapshot,
} from "@/lib/executive-api";

import type {
  ExecutiveDashboardData,
} from "@/types/executive";

export interface UseExecutiveDashboardResult {
  data: ExecutiveDashboardData | null;

  isLoading: boolean;

  error: string | null;

  refresh: () => Promise<void>;
}

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred while loading the Executive dashboard.";
  }

  if (!error.response) {
    return "Unable to connect to the backend.";
  }

  const detail =
    error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to access Executive analytics.";
  }

  return "Unable to load Executive KPI data.";
}

export function useExecutiveDashboard(): UseExecutiveDashboardResult {
  const [data, setData] =
    useState<ExecutiveDashboardData | null>(
      null,
    );

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
          latest,
          history,
        ] = await Promise.all([
          getLatestExecutiveKpiSnapshot(),

          getExecutiveKpiSnapshots({
            skip: 0,
            limit: 100,
          }),
        ]);

        setData({
          latest,
          history,
        });
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
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