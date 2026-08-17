"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";

import {
  getAllianceDashboardResources,
} from "@/lib/alliance-api";
import { getSalesOpportunities } from "@/lib/sales-api";
import { getEmployees } from "@/lib/resource-manager-api";

import type {
  AllianceDashboardData,
  AlliancePartner,
  PartnerCertification,
  PartnerDealRegistration,
  PartnerInfluencedOpportunity,
} from "@/types/alliance";

interface AllianceDashboardMetrics {
  totalPartners: number;
  activePartners: number;
  inactivePartners: number;

  approvedRegistrations: number;
  pendingRegistrations: number;
  rejectedRegistrations: number;
  expiredRegistrations: number;

  totalInfluencedPipeline: number;
  activeInfluencedPipeline: number;

  totalExpectedIncentives: number;
  totalReferralFees: number;
  totalTierPoints: number;

  opportunityNames: Record<number, string>;
  employeeNames: Record<number, string>;

  activeCertifications: number;
  expiringSoonCertifications: number;

  recentPartners: AlliancePartner[];
  recentRegistrations: PartnerDealRegistration[];
  recentInfluences: PartnerInfluencedOpportunity[];
  recentCertifications: PartnerCertification[];
}

export interface UseAllianceDashboardResult {
  data: AllianceDashboardData | null;
  metrics: AllianceDashboardMetrics | null;
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
    return "An unexpected error occurred while loading Alliance data.";
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
    return "You do not have permission to access Alliance data.";
  }

  return "Unable to load Alliance dashboard data.";
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

function isExpiringSoon(
  expiryDate: string | null,
): boolean {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  const expiry = new Date(expiryDate);

  if (
    Number.isNaN(expiry.getTime())
  ) {
    return false;
  }

  const thirtyDaysFromNow =
    new Date();

  thirtyDaysFromNow.setDate(
    today.getDate() + 30,
  );

  return (
    expiry >= today &&
    expiry <= thirtyDaysFromNow
  );
}

/* ================================================= */
/* METRICS */
/* ================================================= */

function buildMetrics(
  partners: AlliancePartner[],
  dealRegistrations: PartnerDealRegistration[],
  influencedOpportunities: PartnerInfluencedOpportunity[],
  certifications: PartnerCertification[],
  opportunityNames: Record<number, string>,
  employeeNames: Record<number, string>,
): AllianceDashboardMetrics {
  const activePartners =
    partners.filter(
      (partner) =>
        partner.is_active,
    );

  const approvedRegistrations =
    dealRegistrations.filter(
      (registration) =>
        registration.registration_status ===
        "APPROVED",
    );

  const pendingRegistrations =
    dealRegistrations.filter(
      (registration) =>
        registration.registration_status ===
        "PENDING",
    );

  const rejectedRegistrations =
    dealRegistrations.filter(
      (registration) =>
        registration.registration_status ===
        "REJECTED",
    );

  const expiredRegistrations =
    dealRegistrations.filter(
      (registration) =>
        registration.registration_status ===
        "EXPIRED",
    );

  const totalInfluencedPipeline =
    influencedOpportunities.reduce(
      (total, influence) =>
        total +
        numberValue(
          influence.influenced_value,
        ),
      0,
    );

  const activeInfluencedPipeline =
    influencedOpportunities
      .filter(
        (influence) =>
          influence.status ===
          "ACTIVE",
      )
      .reduce(
        (total, influence) =>
          total +
          numberValue(
            influence.influenced_value,
          ),
        0,
      );

  const totalExpectedIncentives =
    dealRegistrations.reduce(
      (total, registration) =>
        total +
        numberValue(
          registration.expected_incentive,
        ),
      0,
    );

  const totalReferralFees =
    influencedOpportunities.reduce(
      (total, influence) =>
        total +
        numberValue(
          influence.referral_fee,
        ),
      0,
    );

  const totalTierPoints =
    influencedOpportunities.reduce(
      (total, influence) =>
        total +
        numberValue(
          influence.tier_points,
        ),
      0,
    );

  const activeCertifications =
    certifications.filter(
      (certification) =>
        certification.is_active,
    );

  const expiringSoonCertifications =
    activeCertifications.filter(
      (certification) =>
        isExpiringSoon(
          certification.expiry_date,
        ),
    );

  return {
    totalPartners:
      partners.length,

    activePartners:
      activePartners.length,

    inactivePartners:
      partners.length -
      activePartners.length,

    approvedRegistrations:
      approvedRegistrations.length,

    pendingRegistrations:
      pendingRegistrations.length,

    rejectedRegistrations:
      rejectedRegistrations.length,

    expiredRegistrations:
      expiredRegistrations.length,

    totalInfluencedPipeline,

    activeInfluencedPipeline,

    totalExpectedIncentives,

    totalReferralFees,

    totalTierPoints,

    opportunityNames,
    employeeNames,

    activeCertifications:
      activeCertifications.length,

    expiringSoonCertifications:
      expiringSoonCertifications.length,

    recentPartners:
      sortByCreatedAt(
        partners,
      ).slice(0, 5),

    recentRegistrations:
      sortByCreatedAt(
        dealRegistrations,
      ).slice(0, 5),

    recentInfluences:
      sortByCreatedAt(
        influencedOpportunities,
      ).slice(0, 5),

    recentCertifications:
      sortByCreatedAt(
        certifications,
      ).slice(0, 5),
  };
}

/* ================================================= */
/* HOOK */
/* ================================================= */

export function useAllianceDashboard(): UseAllianceDashboardResult {
  const [data, setData] =
    useState<AllianceDashboardData | null>(
      null,
    );

  const [metrics, setMetrics] =
    useState<AllianceDashboardMetrics | null>(
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
          const [
            {
              partners,
              dealRegistrations,
              influencedOpportunities,
              certifications,
            },
            opportunities,
            employees,
          ] = await Promise.all([
            getAllianceDashboardResources(),
            getSalesOpportunities(),
            getEmployees(),
          ]);

          const opportunityNames = Object.fromEntries(
            opportunities.map((opportunity) => [
              opportunity.id,
              opportunity.opportunity_name,
            ]),
          );

          const employeeNames = Object.fromEntries(
            employees.map((employee) => [
              employee.id,
              employee.full_name,
            ]),
          );

          setData({
            partners,
            dealRegistrations,
            influencedOpportunities,
            certifications,
          });

          setMetrics(
            buildMetrics(
              partners,
              dealRegistrations,
              influencedOpportunities,
              certifications,
              opportunityNames,
              employeeNames,
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
