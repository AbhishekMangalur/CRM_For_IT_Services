"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

import { getAccountDirectorDashboardResources } from "@/lib/account-director-api";
import type {
  AccountContract,
  AccountDirectorAccount,
  AccountDirectorDashboardData,
  AccountExpansionOpportunity,
  CustomerHealthRecord,
} from "@/types/account-director";

interface UseAccountDirectorDashboardResult {
  data: AccountDirectorDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function normalizeNumber(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function sortByCreatedAtDescending<
  T extends {
    created_at: string;
  },
>(records: T[]): T[] {
  return [...records].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime(),
  );
}

function sortHealthRecords(
  records: CustomerHealthRecord[],
): CustomerHealthRecord[] {
  return [...records].sort(
    (first, second) =>
      new Date(second.recorded_at).getTime() -
      new Date(first.recorded_at).getTime(),
  );
}

function isContractExpiringSoon(
  contract: AccountContract,
): boolean {
  const endDate = new Date(contract.end_date);

  if (!Number.isFinite(endDate.getTime())) {
    return false;
  }

  const today = new Date();
  const thirtyDaysFromNow = new Date();

  thirtyDaysFromNow.setDate(
    today.getDate() + 30,
  );

  return (
    endDate >= today &&
    endDate <= thirtyDaysFromNow
  );
}

function isAccountAtRisk(
  account: AccountDirectorAccount,
): boolean {
  return (
    account.customer_health_status === "RED" ||
    account.customer_health_status === "YELLOW" ||
    account.risk_level === "HIGH" ||
    account.risk_level === "MEDIUM" ||
    account.sla_status === "AT_RISK" ||
    account.sla_status === "BREACHED"
  );
}

function isOpenExpansionOpportunity(
  opportunity: AccountExpansionOpportunity,
): boolean {
  return ["OPEN", "NEGOTIATION"].includes(
    opportunity.status.toUpperCase(),
  );
}

function buildDashboardData(
  accounts: AccountDirectorAccount[],
  contracts: AccountContract[],
  healthRecords: CustomerHealthRecord[],
  opportunities: AccountExpansionOpportunity[],
): AccountDirectorDashboardData {
  const activeAccounts = accounts.filter(
    (account) =>
      account.account_status === "ACTIVE",
  );

  const healthyAccounts = accounts.filter(
    (account) =>
      account.customer_health_status === "GREEN",
  );

  const accountsRequiringAttention =
    accounts.filter(isAccountAtRisk);

  const activeContracts = contracts.filter(
    (contract) =>
      contract.contract_status.toUpperCase() ===
      "ACTIVE",
  );

  const contractsDueForRenewal =
    contracts.filter((contract) =>
      ["DUE", "UPCOMING"].includes(
        contract.renewal_status.toUpperCase(),
      ),
    );

  const openOpportunities =
    opportunities.filter(
      isOpenExpansionOpportunity,
    );

  const expansionPipelineValue =
    openOpportunities.reduce(
      (total, opportunity) =>
        total +
        normalizeNumber(
          opportunity.estimated_value,
        ),
      0,
    );

  const npsAccounts = accounts.filter(
    (account) =>
      account.nps_score !== null &&
      account.nps_score !== undefined,
  );

  const averageNps =
    npsAccounts.length > 0
      ? npsAccounts.reduce(
          (total, account) =>
            total +
            normalizeNumber(account.nps_score),
          0,
        ) / npsAccounts.length
      : 0;

  return {
    accounts,
    contracts,
    healthRecords,
    opportunities,

    activeAccounts: activeAccounts.length,
    healthyAccounts: healthyAccounts.length,
    atRiskAccounts:
      accountsRequiringAttention.length,
    activeContracts: activeContracts.length,
    contractsDueForRenewal:
      contractsDueForRenewal.length,
    expansionPipelineValue,
    averageNps,

    accountsRequiringAttention:
      accountsRequiringAttention.slice(0, 5),

    contractsExpiringSoon: contracts
      .filter(isContractExpiringSoon)
      .sort(
        (first, second) =>
          new Date(first.end_date).getTime() -
          new Date(second.end_date).getTime(),
      )
      .slice(0, 5),

    recentHealthRecords:
      sortHealthRecords(healthRecords).slice(
        0,
        5,
      ),

    recentOpportunities:
      sortByCreatedAtDescending(
        opportunities,
      ).slice(0, 5),
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

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  return "Unable to load Account Director dashboard data.";
}

export function useAccountDirectorDashboard(): UseAccountDirectorDashboardResult {
  const [data, setData] =
    useState<AccountDirectorDashboardData | null>(
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
        const {
          accounts,
          contracts,
          healthRecords,
          opportunities,
        } =
          await getAccountDirectorDashboardResources();

        setData(
          buildDashboardData(
            accounts,
            contracts,
            healthRecords,
            opportunities,
          ),
        );
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