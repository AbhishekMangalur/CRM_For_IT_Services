"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Calculator,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  calculateBlendedRate,
  deleteBlendedRate,
  getBlendedRate,
} from "@/lib/presales-api";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type {
  BlendedRateInput,
  BlendedRateResult,
} from "@/types/presales";

interface Props {
  estimationId: number;
}

type EditableBlendedRate = Omit<
  BlendedRateInput,
  "resource_ratio" | "bill_rate" | "cost_rate"
> & {
  resource_ratio: number | "";
  bill_rate: number | "";
  cost_rate: number | "";
};

const DEFAULT_RATES: EditableBlendedRate[] = [
  {
    location_type: "ONSHORE",
    resource_ratio: "",
    bill_rate: "",
    cost_rate: "",
    currency: "USD",
  },
  {
    location_type: "NEARSHORE",
    resource_ratio: "",
    bill_rate: "",
    cost_rate: "",
    currency: "USD",
  },
  {
    location_type: "OFFSHORE",
    resource_ratio: "",
    bill_rate: "",
    cost_rate: "",
    currency: "USD",
  },
];

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong.";
  }

  const detail = error.response?.data?.detail;

  return typeof detail === "string"
    ? detail
    : "Unable to process blended rate.";
}

function money(
  value: string | number,
  currency: string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function BlendedRateCalculator({
  estimationId,
}: Props) {
  const confirm = useConfirm();
  const [rates, setRates] =
    useState<EditableBlendedRate[]>(DEFAULT_RATES);

  const [result, setResult] =
    useState<BlendedRateResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const totalRatio = useMemo(
    () =>
      rates.reduce(
        (sum, item) =>
          sum +
          Number(item.resource_ratio || 0),
        0,
      ),
    [rates],
  );

  const loadExisting =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getBlendedRate(estimationId);

        setResult(data);

        if (data.rates?.length) {
          setRates(
            data.rates.map((rate) => ({
              ...rate,
              resource_ratio: Number(rate.resource_ratio),
              bill_rate: Number(rate.bill_rate),
              cost_rate: Number(rate.cost_rate),
            })),
          );
        }
      } catch (requestError) {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 404
        ) {
          setResult(null);
          return;
        }

        setError(
          getErrorMessage(requestError),
        );
      } finally {
        setLoading(false);
      }
    }, [estimationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadExisting();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadExisting]);

  function updateRate(
    index: number,
    field: keyof BlendedRateInput,
    value: string,
  ) {
    setRates((current) =>
      current.map((rate, rateIndex) =>
        rateIndex === index
          ? {
              ...rate,
              [field]:
                field === "location_type" ||
                field === "currency"
                  ? value
                  : value === ""
                    ? ""
                    : Number(value),
            }
          : rate,
      ),
    );
  }

  function addRate() {
    setRates((current) => [
      ...current,
      {
        location_type: "OFFSHORE",
        resource_ratio: "",
        bill_rate: "",
        cost_rate: "",
        currency: "USD",
      },
    ]);
  }

  function removeRate(index: number) {
    setRates((current) =>
      current.filter(
        (_, rateIndex) =>
          rateIndex !== index,
      ),
    );
  }

  async function handleCalculate() {
    if (totalRatio !== 100) {
      setError(
        `Resource ratio must total 100%. Current total is ${totalRatio}%.`,
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data =
        await calculateBlendedRate({
          estimation_id: estimationId,
          rates: rates.map((rate) => ({
            ...rate,
            resource_ratio: Number(rate.resource_ratio),
            bill_rate: Number(rate.bill_rate),
            cost_rate: Number(rate.cost_rate),
          })),
        });

      setResult(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !await confirm(
        "Delete this blended rate configuration?",
      )
    ) {
      return;
    }

    try {
      await deleteBlendedRate(
        estimationId,
      );

      setResult(null);
      setRates(DEFAULT_RATES);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border-blue-100 shadow-lg shadow-blue-100/30">
      <CardHeader className="border-b border-blue-50 bg-gradient-to-r from-blue-50/80 to-indigo-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                <Calculator className="h-5 w-5" />
              </span>
              Blended Rate Calculator
            </CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              Adjust the delivery mix below. Existing values are loaded automatically.
            </p>
          </div>

          {result && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Saved rate mix
            </span>
          )}
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

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/80">
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="p-3">Location</th>
                <th className="p-3">Ratio %</th>
                <th className="p-3">Cost Rate</th>
                <th className="p-3">Bill Rate</th>
                <th className="p-3">Currency</th>
                <th className="p-3" />
              </tr>
            </thead>

            <tbody>
              {rates.map((rate, index) => (
                <tr
                  key={index}
                  className="border-b bg-white transition-colors last:border-0 hover:bg-blue-50/30"
                >
                  <td className="p-3">
                    <select
                      value={
                        rate.location_type
                      }
                      onChange={(event) =>
                        updateRate(
                          index,
                          "location_type",
                          event.target.value,
                        )
                      }
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="ONSHORE">
                        Onshore
                      </option>
                      <option value="NEARSHORE">
                        Nearshore
                      </option>
                      <option value="OFFSHORE">
                        Offshore
                      </option>
                    </select>
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={
                        rate.resource_ratio
                      }
                      onChange={(event) =>
                        updateRate(
                          index,
                          "resource_ratio",
                          event.target.value,
                        )
                      }
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={rate.cost_rate}
                      onChange={(event) =>
                        updateRate(
                          index,
                          "cost_rate",
                          event.target.value,
                        )
                      }
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={rate.bill_rate}
                      onChange={(event) =>
                        updateRate(
                          index,
                          "bill_rate",
                          event.target.value,
                        )
                      }
                    />
                  </td>

                  <td className="p-3">
                    <Input
                      value={rate.currency}
                      maxLength={3}
                      onChange={(event) =>
                        updateRate(
                          index,
                          "currency",
                          event.target.value.toUpperCase(),
                        )
                      }
                    />
                  </td>

                  <td className="p-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        removeRate(index)
                      }
                      disabled={
                        rates.length === 1
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={addRate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>

          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-40">
              <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-600">Resource mix</span>
                <span
                  className={
                    totalRatio === 100
                      ? "font-bold text-emerald-700"
                      : "font-bold text-amber-700"
                  }
                >
                  {totalRatio}% / 100%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalRatio === 100 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(totalRatio, 100)}%` }}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() =>
                void handleCalculate()
              }
              disabled={
                saving ||
                totalRatio !== 100
              }
              className="bg-blue-700 hover:bg-blue-800"
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {result ? "Recalculate & Save" : "Calculate & Save"}
            </Button>
          </div>
        </div>

        {result ? (
          <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Calculated outcome
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Weighted hourly rates based on the resource mix above.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Blended Bill Rate
              </p>
              <p className="mt-2 text-xl font-bold text-blue-700">
                {money(
                  result.blended_bill_rate,
                  result.currency,
                )}
                /hr
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Blended Cost Rate
              </p>
              <p className="mt-2 text-xl font-bold text-indigo-700">
                {money(
                  result.blended_cost_rate,
                  result.currency,
                )}
                /hr
              </p>
            </div>

            <div className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Profit / Hour
              </p>
              <p className="mt-2 text-xl font-bold text-cyan-700">
                {money(
                  result.blended_profit_per_hour,
                  result.currency,
                )}
                /hr
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Margin
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {result.blended_margin_percentage.toFixed(
                  2,
                )}
                %
              </p>
            </div>

            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="text-red-600"
                onClick={() =>
                  void handleDelete()
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Rate Mix
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="font-medium text-slate-700">No saved calculation yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Review the prefilled values and select Calculate &amp; Save.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
