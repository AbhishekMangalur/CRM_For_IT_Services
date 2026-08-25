// reusable ui component like buttons, cards, modals, etc. for the account director section of the application
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import {
  getUpcomingContractRenewals,
} from "@/lib/account-director-api";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  ContractRenewalAlert,
} from "@/types/account-director";

function badgeClass(
  level: string,
): string {
  switch (level) {
    case "30_DAYS":
      return "bg-red-100 text-red-700";

    case "60_DAYS":
      return "bg-amber-100 text-amber-700";

    case "90_DAYS":
      return "bg-blue-100 text-blue-700";

    case "EXPIRED":
      return "bg-slate-800 text-white";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function date(value: string): string {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

export function ContractRenewalAlerts() {
  const router = useRouter();

  const [renewals, setRenewals] =
    useState<ContractRenewalAlert[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadRenewals =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getUpcomingContractRenewals();

        setRenewals(data);
      } catch (requestError) {
        if (
          axios.isAxiosError(
            requestError,
          )
        ) {
          setError(
            requestError.response?.data
              ?.detail ??
              "Unable to load contract renewals.",
          );
        } else {
          setError(
            "Unable to load contract renewals.",
          );
        }
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRenewals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRenewals]);

  const counts = useMemo(
    () => ({
      thirty: renewals.filter(
        (item) =>
          item.alert_level ===
          "30_DAYS",
      ).length,

      sixty: renewals.filter(
        (item) =>
          item.alert_level ===
          "60_DAYS",
      ).length,

      ninety: renewals.filter(
        (item) =>
          item.alert_level ===
          "90_DAYS",
      ).length,

      expired: renewals.filter(
        (item) =>
          item.alert_level ===
          "EXPIRED",
      ).length,
    }),
    [renewals],
  );

  return (
    <Card className="rounded-2xl border-blue-100 shadow-lg shadow-blue-100/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-700" />
              Contract Renewal Alerts
            </CardTitle>

            <p className="mt-1 text-sm text-slate-500">
              Upcoming contract renewals
              requiring attention.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void loadRenewals()
            }
            disabled={loading}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-slate-500">
              Renewals ≤30 Days
            </p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {counts.thirty}
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-slate-500">
              Renewals ≤60 Days
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {counts.sixty}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-slate-500">
              Renewals ≤90 Days
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {counts.ninety}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Expired
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {counts.expired}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          </div>
        ) : renewals.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-emerald-400" />

            <p className="mt-3 text-sm text-slate-500">
              No upcoming contract renewal alerts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-blue-100">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-blue-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">
                    Contract
                  </th>
                  <th className="p-3">
                    Account
                  </th>
                  <th className="p-3">
                    Renewal Date
                  </th>
                  <th className="p-3">
                    Days Left
                  </th>
                  <th className="p-3">
                    Alert
                  </th>
                  <th className="p-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {renewals.map(
                  (renewal) => (
                    <tr
                      key={
                        renewal.contract_id
                      }
                      className="border-t hover:bg-blue-50/40"
                    >
                      <td className="p-3 font-semibold">
                        {
                          renewal.contract_number
                        }
                      </td>

                      <td className="p-3">
                        {renewal.account_name}
                      </td>

                      <td className="p-3">
                        {date(
                          renewal.renewal_date,
                        )}
                      </td>

                      <td className="p-3">
                        {renewal.days_until_renewal <
                        0
                          ? `${Math.abs(
                              renewal.days_until_renewal,
                            )} days overdue`
                          : `${renewal.days_until_renewal} days`}
                      </td>

                      <td className="p-3">
                        <Badge
                          className={badgeClass(
                            renewal.alert_level,
                          )}
                        >
                          {
                            renewal.alert_level
                          }
                        </Badge>
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/account-director/contracts?view=${renewal.contract_id}`,
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Contract
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
