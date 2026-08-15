"use client";

import Link from "next/link";
import {
  Activity,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CircleDollarSign,
  Handshake,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAllianceDashboard } from "@/hooks/useAllianceDashboard";

import type {
  AlliancePartner,
  PartnerCertification,
  PartnerDealRegistration,
  PartnerInfluencedOpportunity,
} from "@/types/alliance";
import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

/* ================================================= */
/* HELPERS */
/* ================================================= */

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatCurrency(
  value: string | number,
  currency = "USD",
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currency}`;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRegistrationStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "EXPIRED":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getInfluenceStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETED":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

/* ================================================= */
/* PARTNER ROW */
/* ================================================= */

function PartnerRow({
  partner,
}: {
  partner: AlliancePartner;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <Handshake className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {partner.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {partner.partner_program}
            </p>
          </div>
        </div>

        <Badge
          className={
            partner.is_active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }
        >
          {partner.is_active
            ? "Active"
            : "Inactive"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Partner Type
          </p>

          <p className="mt-1 font-semibold text-blue-700">
            {formatLabel(
              partner.partner_type,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Tier
          </p>

          <p className="mt-1 font-semibold text-indigo-700">
            {formatLabel(
              partner.partner_tier,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* REGISTRATION ROW */
/* ================================================= */

function RegistrationRow({
  registration,
  partner,
}: {
  registration: PartnerDealRegistration;
  partner?: AlliancePartner;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {partner?.name ??
              `Partner #${registration.partner_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {
              registration.registration_reference
            }
          </p>
        </div>

        <Badge
          className={getRegistrationStatusClasses(
            registration.registration_status,
          )}
        >
          {formatLabel(
            registration.registration_status,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Opportunity
          </p>

          <p className="mt-1 font-semibold text-blue-700">
            #{registration.opportunity_id}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Incentive
          </p>

          <p className="mt-1 font-semibold text-emerald-700">
            {formatCurrency(
              registration.expected_incentive,
              registration.currency,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* INFLUENCE ROW */
/* ================================================= */

function InfluenceRow({
  influence,
  partner,
}: {
  influence: PartnerInfluencedOpportunity;
  partner?: AlliancePartner;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {partner?.name ??
              `Partner #${influence.partner_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatLabel(
              influence.influence_type,
            )}
          </p>
        </div>

        <Badge
          className={getInfluenceStatusClasses(
            influence.status,
          )}
        >
          {formatLabel(
            influence.status,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Influenced Value
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {formatCurrency(
              influence.influenced_value,
              influence.currency,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Tier Points
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {influence.tier_points}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* CERTIFICATION ROW */
/* ================================================= */

function CertificationRow({
  certification,
  partner,
}: {
  certification: PartnerCertification;
  partner?: AlliancePartner;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {
              certification.certification_name
            }
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {partner?.name ??
              `Partner #${certification.partner_id}`}
          </p>
        </div>

        <Badge className="bg-indigo-100 text-indigo-700">
          {formatLabel(
            certification.certification_level,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Employee
          </p>

          <p className="mt-1 font-semibold text-blue-700">
            #{certification.employee_id}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs text-slate-500">
            Expiry
          </p>

          <p className="mt-1 text-sm font-semibold text-amber-700">
            {formatDate(
              certification.expiry_date,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* LOADING */
/* ================================================= */

function DashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Alliance dashboard...
        </p>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function AllianceDashboardPage() {
  const {
    data,
    metrics,
    isLoading,
    error,
    refresh,
  } = useAllianceDashboard();

  function findPartner(
    partnerId: number,
  ): AlliancePartner | undefined {
    return data?.partners.find(
      (partner) =>
        partner.id === partnerId,
    );
  }

  return (
    <ProtectedRoute
        allowedRoles={[
        "SALES",
        "ACCOUNT_DIRECTOR",
        ]}
    >
    <DashboardLayout
      title="Alliance & Co-Sell"
      description="Manage strategic partners, partner deal registrations, influenced opportunities and certifications."
    >
      {isLoading && !data ? (
        <DashboardLoading />
      ) : (
        <div className="space-y-6">

          {/* ================================================= */}
          {/* QUICK ACTIONS */}
          {/* ================================================= */}

          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur xl:flex-row xl:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Alliance Workspace
              </h2>

              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Track partner relationships, register sales
                opportunities, measure co-sell influence and
                maintain partner certifications.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                render={
                  <Link href="/alliance/partners" />
                }
                nativeButton={false}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Handshake className="mr-2 h-4 w-4" />
                Partners
              </Button>

              <Button
                render={
                  <Link href="/alliance/deal-registrations" />
                }
                nativeButton={false}
                className="bg-indigo-700 hover:bg-indigo-800"
              >
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Deal Registrations
              </Button>

              <Button
                render={
                  <Link href="/alliance/influenced-opportunities" />
                }
                nativeButton={false}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Influenced Pipeline
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void refresh()
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}

                Refresh
              </Button>
            </div>
          </section>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <span>{error}</span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void refresh()
                  }
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {data && metrics && (
            <>
              {/* ================================================= */}
              {/* PRIMARY KPI CARDS */}
              {/* ================================================= */}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Active Partners"
                  value={metrics.activePartners.toLocaleString(
                    "en-US",
                  )}
                  description={`${metrics.totalPartners} total partners`}
                  icon={Handshake}
                  variant="blue"
                />

                <StatCard
                  title="Approved Registrations"
                  value={metrics.approvedRegistrations.toLocaleString(
                    "en-US",
                  )}
                  description={`${metrics.pendingRegistrations} pending registrations`}
                  icon={BadgeCheck}
                  variant="indigo"
                />

                <StatCard
                  title="Influenced Pipeline"
                  value={formatCurrency(
                    metrics.totalInfluencedPipeline,
                  )}
                  description="Total partner-influenced opportunity value"
                  icon={TrendingUp}
                  variant="cyan"
                />

                <StatCard
                  title="Active Certifications"
                  value={metrics.activeCertifications.toLocaleString(
                    "en-US",
                  )}
                  description={`${metrics.expiringSoonCertifications} expiring within 30 days`}
                  icon={Award}
                  variant="emerald"
                />
              </section>

              {/* ================================================= */}
              {/* COMMERCIAL KPI CARDS */}
              {/* ================================================= */}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Active Influenced Pipeline"
                  value={formatCurrency(
                    metrics.activeInfluencedPipeline,
                  )}
                  description="Pipeline from currently active partner influence"
                  icon={Activity}
                  variant="blue"
                />

                <StatCard
                  title="Expected Incentives"
                  value={formatCurrency(
                    metrics.totalExpectedIncentives,
                  )}
                  description="Expected incentives from deal registrations"
                  icon={CircleDollarSign}
                  variant="indigo"
                />

                <StatCard
                  title="Referral Fees"
                  value={formatCurrency(
                    metrics.totalReferralFees,
                  )}
                  description="Total referral fees across influenced deals"
                  icon={CircleDollarSign}
                  variant="cyan"
                />

                <StatCard
                  title="Tier Points"
                  value={metrics.totalTierPoints.toLocaleString(
                    "en-US",
                  )}
                  description="Total partner tier contribution points"
                  icon={ShieldCheck}
                  variant="emerald"
                />
              </section>

              {/* ================================================= */}
              {/* PARTNERS + REGISTRATIONS */}
              {/* ================================================= */}

              <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                  <CardHeader className="border-b border-blue-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">
                          Recent Partners
                        </CardTitle>

                        <p className="mt-1 text-sm text-slate-500">
                          Latest strategic partners added to
                          the alliance ecosystem
                        </p>
                      </div>

                      <Handshake className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5">
                    {metrics.recentPartners.length >
                    0 ? (
                      metrics.recentPartners.map(
                        (partner) => (
                          <PartnerRow
                            key={partner.id}
                            partner={partner}
                          />
                        ),
                      )
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <Handshake className="h-10 w-10 text-blue-300" />

                        <p className="mt-3 font-semibold text-slate-700">
                          No partners found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
                  <CardHeader className="border-b border-indigo-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">
                          Recent Deal Registrations
                        </CardTitle>

                        <p className="mt-1 text-sm text-slate-500">
                          Sales opportunities registered with
                          alliance partners
                        </p>
                      </div>

                      <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5">
                    {metrics.recentRegistrations.length >
                    0 ? (
                      metrics.recentRegistrations.map(
                        (registration) => (
                          <RegistrationRow
                            key={registration.id}
                            registration={registration}
                            partner={findPartner(
                              registration.partner_id,
                            )}
                          />
                        ),
                      )
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <BriefcaseBusiness className="h-10 w-10 text-indigo-300" />

                        <p className="mt-3 font-semibold text-slate-700">
                          No deal registrations found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* ================================================= */}
              {/* INFLUENCE + CERTIFICATIONS */}
              {/* ================================================= */}

              <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-lg shadow-cyan-100/30">
                  <CardHeader className="border-b border-cyan-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">
                          Partner Influenced Opportunities
                        </CardTitle>

                        <p className="mt-1 text-sm text-slate-500">
                          Co-sell, referral and partner-assisted
                          opportunity value
                        </p>
                      </div>

                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5">
                    {metrics.recentInfluences.length >
                    0 ? (
                      metrics.recentInfluences.map(
                        (influence) => (
                          <InfluenceRow
                            key={influence.id}
                            influence={influence}
                            partner={findPartner(
                              influence.partner_id,
                            )}
                          />
                        ),
                      )
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <TrendingUp className="h-10 w-10 text-cyan-300" />

                        <p className="mt-3 font-semibold text-slate-700">
                          No influenced opportunities
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/30">
                  <CardHeader className="border-b border-emerald-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">
                          Partner Certifications
                        </CardTitle>

                        <p className="mt-1 text-sm text-slate-500">
                          Employee certifications linked to
                          strategic partners
                        </p>
                      </div>

                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5">
                    {metrics.recentCertifications.length >
                    0 ? (
                      metrics.recentCertifications.map(
                        (certification) => (
                          <CertificationRow
                            key={certification.id}
                            certification={certification}
                            partner={findPartner(
                              certification.partner_id,
                            )}
                          />
                        ),
                      )
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <Award className="h-10 w-10 text-emerald-300" />

                        <p className="mt-3 font-semibold text-slate-700">
                          No partner certifications
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* ================================================= */}
              {/* STATUS SUMMARY */}
              {/* ================================================= */}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                      <Handshake className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Inactive Partners
                      </p>

                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.inactivePartners}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Pending Registrations
                      </p>

                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.pendingRegistrations}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-red-100 bg-white/90 shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-xl bg-red-100 p-3 text-red-700">
                      <Activity className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Rejected Registrations
                      </p>

                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.rejectedRegistrations}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                      <Award className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Certifications Expiring
                      </p>

                      <p className="text-2xl font-bold text-slate-800">
                        {
                          metrics.expiringSoonCertifications
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}
