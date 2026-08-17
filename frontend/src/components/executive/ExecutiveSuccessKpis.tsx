"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Clock3,
  Handshake,
  Loader2,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAccountExpansionKpi,
  getPartnerInfluencedPipelineKpi,
  getRfpTurnaroundKpi,
} from "@/lib/executive-api";
import type {
  AccountExpansionKpi,
  PartnerInfluencedPipelineKpi,
  RfpTurnaroundKpi,
} from "@/types/executive";

interface SuccessKpiData {
  rfpTurnaround: RfpTurnaroundKpi;
  accountExpansion: AccountExpansionKpi;
  partnerPipeline: PartnerInfluencedPipelineKpi;
}

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Unable to load Executive success KPIs.";
  }

  const detail = error.response?.data?.detail;
  return typeof detail === "string"
    ? detail
    : "Unable to load Executive success KPIs.";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ExecutiveSuccessKpis() {
  const [data, setData] = useState<SuccessKpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadKpis = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const [rfpTurnaround, accountExpansion, partnerPipeline] =
        await Promise.all([
          getRfpTurnaroundKpi(),
          getAccountExpansionKpi(),
          getPartnerInfluencedPipelineKpi(),
        ]);

      setData({ rfpTurnaround, accountExpansion, partnerPipeline });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadKpis();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadKpis]);

  return (
    <section className="space-y-4" aria-labelledby="success-kpis-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2
            id="success-kpis-title"
            className="text-lg font-bold text-slate-900"
          >
            Executive Success KPIs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            RFP speed, account growth, and partner-driven pipeline.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadKpis()}
          disabled={isLoading}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh KPIs
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" size="sm" onClick={() => void loadKpis()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !data ? (
        <div className="flex min-h-52 items-center justify-center rounded-2xl border border-blue-100 bg-white/80">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>
      ) : data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
            <CardHeader className="border-b border-blue-50">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Clock3 className="h-5 w-5 text-blue-600" />
                RFP Turnaround
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-slate-500">Avg RFP Turnaround</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {data.rfpTurnaround.average_turnaround_days.toFixed(1)} days
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-50 p-4">
                  <p className="text-xs text-slate-500">Completed RFPs</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-700">
                    {data.rfpTurnaround.completed_rfps}
                  </p>
                </div>
              </div>

              {data.rfpTurnaround.rfps.length === 0 ? (
                <p className="rounded-xl border border-dashed border-blue-200 p-5 text-center text-sm text-slate-500">
                  No completed RFPs are available yet.
                </p>
              ) : (
                <div className="max-h-72 overflow-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="sticky top-0 bg-blue-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">RFP Number</th>
                        <th className="px-3 py-3">Title</th>
                        <th className="px-3 py-3">Received</th>
                        <th className="px-3 py-3">Deadline</th>
                        <th className="px-3 py-3">Completed</th>
                        <th className="px-3 py-3">Planned Days</th>
                        <th className="px-3 py-3">Actual Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {data.rfpTurnaround.rfps.map((rfp) => (
                        <tr key={rfp.rfp_id}>
                          <td className="px-3 py-3 font-medium text-slate-800">
                            {rfp.rfp_number}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {rfp.title}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {formatDate(rfp.received_date)}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {formatDate(rfp.submission_deadline)}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {formatDate(rfp.completed_date)}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-700">
                            {rfp.planned_turnaround_days}
                          </td>
                          <td className="px-3 py-3 font-semibold text-blue-700">
                            {rfp.turnaround_days}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/30">
              <CardHeader className="border-b border-emerald-50">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Account Expansion Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    {data.accountExpansion.current_year} Revenue
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">
                    {formatCurrency(data.accountExpansion.current_year_revenue)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-slate-500">YoY Growth</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {data.accountExpansion.growth_percentage > 0 ? "+" : ""}
                    {data.accountExpansion.growth_percentage.toFixed(2)}%
                  </p>
                </div>
                <p className="text-sm text-slate-500 sm:col-span-3">
                  {data.accountExpansion.previous_year} revenue: {" "}
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(
                      data.accountExpansion.previous_year_revenue,
                    )}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-lg shadow-amber-100/30">
              <CardHeader className="border-b border-amber-50">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Handshake className="h-5 w-5 text-amber-600" />
                  Partner-Influenced Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-amber-50 p-4 sm:col-span-2">
                  <p className="text-xs text-slate-500">Active Pipeline</p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {formatCurrency(
                      data.partnerPipeline.partner_influenced_pipeline,
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-slate-500">Partner Won Value</p>
                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    {formatCurrency(
                      data.partnerPipeline.partner_influenced_won_value,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 p-4">
                  <p className="text-xs text-slate-500">Active Deals</p>
                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {data.partnerPipeline.active_partner_deals}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 p-4">
                  <p className="text-xs text-slate-500">Won Deals</p>
                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    {data.partnerPipeline.won_partner_deals}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 p-4">
                  <p className="text-xs text-slate-500">Referral Fees</p>
                  <p className="mt-2 font-bold text-slate-800">
                    {formatCurrency(data.partnerPipeline.total_referral_fees)}
                  </p>
                  <Badge className="mt-2 bg-blue-100 text-blue-700">
                    {data.partnerPipeline.total_tier_points} tier points
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No Executive KPI data is available.
        </div>
      )}
    </section>
  );
}
