"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  HeartPulse,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Star,
  TrendingUp,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ContractRenewalAlerts } from "@/components/account-director/ContractRenewalAlerts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccountDirectorDashboard } from "@/hooks/useAccountDirectorDashboard";
import type {
  AccountContract,
  AccountDirectorAccount,
  AccountExpansionOpportunity,
  CustomerHealthRecord,
} from "@/types/account-director";

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
    return `$${amount.toLocaleString("en-US")}`;
  }
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not scheduled";
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

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

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

function getHealthClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "GREEN":
      return "bg-emerald-100 text-emerald-700";

    case "YELLOW":
      return "bg-amber-100 text-amber-700";

    case "RED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getRiskClasses(
  risk: string,
): string {
  switch (risk.toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700";

    case "MEDIUM":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function getOpportunityStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "WON":
      return "bg-emerald-100 text-emerald-700";

    case "LOST":
      return "bg-red-100 text-red-700";

    case "NEGOTIATION":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

interface AttentionAccountRowProps {
  account: AccountDirectorAccount;
}

function AttentionAccountRow({
  account,
}: AttentionAccountRowProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-red-100 bg-red-50/30 p-4 transition hover:bg-red-50 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-red-100 p-3 text-red-700">
          <ShieldAlert className="h-5 w-5" />
        </div>

        <div>
          <p className="font-semibold text-slate-800">
            {account.account_name}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {account.industry}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={getHealthClasses(
            account.customer_health_status,
          )}
        >
          {formatLabel(
            account.customer_health_status,
          )}
        </Badge>

        <Badge
          className={getRiskClasses(
            account.risk_level,
          )}
        >
          {formatLabel(account.risk_level)} Risk
        </Badge>

        <Badge
          variant="outline"
          className="border-red-200 text-red-700"
        >
          {formatLabel(account.sla_status)}
        </Badge>
      </div>
    </div>
  );
}

interface ExpiringContractRowProps {
  contract: AccountContract;
  accountName: string;
}

function ExpiringContractRow({
  contract,
  accountName,
}: ExpiringContractRowProps) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
          <CalendarClock className="h-5 w-5" />
        </div>

        <div>
          <p className="font-semibold text-slate-800">
            {contract.contract_number}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {accountName}
          </p>
        </div>
      </div>

      <div className="sm:text-right">
        <p className="text-xs text-slate-500">
          Ends on
        </p>

        <p className="mt-1 font-semibold text-amber-700">
          {formatDate(contract.end_date)}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {formatCurrency(
            contract.contract_value,
            contract.currency,
          )}
        </p>
      </div>
    </div>
  );
}

interface HealthRecordRowProps {
  record: CustomerHealthRecord;
  accountName: string;
}

function HealthRecordRow({
  record,
  accountName,
}: HealthRecordRowProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {accountName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(record.recorded_at)}
            </p>
          </div>
        </div>

        <Badge
          className={getHealthClasses(
            record.health_status,
          )}
        >
          {formatLabel(record.health_status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-slate-500">
            Overall
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {Number(
              record.overall_health_score,
            ).toFixed(1)}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3 text-center">
          <p className="text-xs text-slate-500">
            Delivery
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {record.delivery_score}
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3 text-center">
          <p className="text-xs text-slate-500">
            SLA
          </p>

          <p className="mt-1 font-bold text-cyan-700">
            {record.sla_score}
          </p>
        </div>
      </div>

      {record.risk_reason && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
          {record.risk_reason}
        </p>
      )}
    </div>
  );
}

interface ExpansionOpportunityRowProps {
  opportunity: AccountExpansionOpportunity;
  accountName: string;
}

function ExpansionOpportunityRow({
  opportunity,
  accountName,
}: ExpansionOpportunityRowProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-semibold text-slate-800">
            {opportunity.opportunity_name}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {accountName}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {opportunity.service_type}
          </p>
        </div>

        <Badge
          className={getOpportunityStatusClasses(
            opportunity.status,
          )}
        >
          {formatLabel(opportunity.status)}
        </Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Estimated value
          </p>

          <p className="mt-1 text-lg font-bold text-slate-800">
            {formatCurrency(
              opportunity.estimated_value,
              opportunity.currency,
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">
            Probability
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {opportunity.probability}%
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                opportunity.probability,
              ),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Account Director dashboard...
        </p>
      </div>
    </div>
  );
}

export default function AccountDirectorDashboardPage() {
  const {
    data,
    isLoading,
    error,
    refresh,
  } = useAccountDirectorDashboard();

  function findAccountName(
    accountId: number,
  ): string {
    return (
      data?.accounts.find(
        (account) => account.id === accountId,
      )?.account_name ??
      `Account #${accountId}`
    );
  }

  return (
    <ProtectedRoute allowedRole="ACCOUNT_DIRECTOR">
      <DashboardLayout
        title="Account Director Dashboard"
        description="Monitor customer health, contracts, renewals, risk, and account expansion."
      >
        {isLoading && !data ? (
          <DashboardLoading />
        ) : (
          <div id="dashboard" className="space-y-6">
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Account Management Workspace
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage customer accounts, contracts,
                  health assessments and expansion
                  opportunities.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  render={
                    <Link href="/account-director/accounts" />
                  }
                  nativeButton={false}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Account
                </Button>

                <Button
                  render={
                    <Link href="/account-director/contracts" />
                  }
                  nativeButton={false}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <FileCheck2 className="mr-2 h-4 w-4" />
                  Add Contract
                </Button>

                <Button
                  render={
                    <Link href="/account-director/health" />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <HeartPulse className="mr-2 h-4 w-4" />
                  Record Health
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refresh()}
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
                    size="sm"
                    variant="outline"
                    onClick={() => void refresh()}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {data && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Active Accounts"
                    value={data.activeAccounts.toLocaleString(
                      "en-US",
                    )}
                    description="Currently active customer accounts"
                    icon={Building2}
                    variant="blue"
                  />

                  <StatCard
                    title="Healthy Accounts"
                    value={data.healthyAccounts.toLocaleString(
                      "en-US",
                    )}
                    description="Accounts with green health status"
                    icon={HeartPulse}
                    variant="indigo"
                  />

                  <StatCard
                    title="At-Risk Accounts"
                    value={data.atRiskAccounts.toLocaleString(
                      "en-US",
                    )}
                    description="Accounts requiring attention"
                    icon={ShieldAlert}
                    variant="cyan"
                  />

                  <StatCard
                    title="Active Contracts"
                    value={data.activeContracts.toLocaleString(
                      "en-US",
                    )}
                    description="Contracts currently active"
                    icon={FileCheck2}
                    variant="emerald"
                  />
                </section>

                <ContractRenewalAlerts />

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-blue-100">
                          Expansion Pipeline
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                          {formatCurrency(
                            data.expansionPipelineValue,
                          )}
                        </p>
                      </div>

                      <CircleDollarSign className="h-8 w-8" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-800 text-white shadow-lg">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-indigo-100">
                          Renewals Due
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                          {data.contractsDueForRenewal}
                        </p>
                      </div>

                      <CalendarClock className="h-8 w-8" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-cyan-100 bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg sm:col-span-2 xl:col-span-1">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-cyan-100">
                          Average NPS
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                          {data.averageNps.toFixed(1)}
                        </p>
                      </div>

                      <Star className="h-8 w-8" />
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-red-100 bg-white/90 shadow-lg shadow-red-100/30">
                    <CardHeader className="border-b border-red-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Accounts Requiring Attention
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Risk, SLA, or health concerns
                          </p>
                        </div>

                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.accountsRequiringAttention
                        .length > 0 ? (
                        data.accountsRequiringAttention.map(
                          (account) => (
                            <AttentionAccountRow
                              key={account.id}
                              account={account}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <HeartPulse className="h-10 w-10 text-emerald-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            All accounts look healthy
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            No current risk or SLA warnings.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-lg shadow-amber-100/30">
                    <CardHeader className="border-b border-amber-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Contracts Expiring Soon
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Contracts ending within 30 days
                          </p>
                        </div>

                        <CalendarDays className="h-5 w-5 text-amber-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.contractsExpiringSoon.length >
                      0 ? (
                        data.contractsExpiringSoon.map(
                          (contract) => (
                            <ExpiringContractRow
                              key={contract.id}
                              contract={contract}
                              accountName={findAccountName(
                                contract.account_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <FileCheck2 className="h-10 w-10 text-blue-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No contracts expiring soon
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Latest Health Assessments
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Recently recorded customer health
                          </p>
                        </div>

                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.recentHealthRecords.length >
                      0 ? (
                        data.recentHealthRecords.map(
                          (record) => (
                            <HealthRecordRow
                              key={record.id}
                              record={record}
                              accountName={findAccountName(
                                record.account_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Activity className="h-10 w-10 text-blue-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No health assessments found
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
                            Expansion Opportunities
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Recent upsell and cross-sell pipeline
                          </p>
                        </div>

                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.recentOpportunities.length >
                      0 ? (
                        data.recentOpportunities.map(
                          (opportunity) => (
                            <ExpansionOpportunityRow
                              key={opportunity.id}
                              opportunity={opportunity}
                              accountName={findAccountName(
                                opportunity.account_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <BriefcaseBusiness className="h-10 w-10 text-indigo-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No expansion opportunities
                          </p>
                        </div>
                      )}
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
