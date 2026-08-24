"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  ExecutiveKpiSnapshot,
  RevenueByPartnerKpi,
} from "@/types/executive";
import { getRevenueByPartnerKpi } from "@/lib/executive-api";

interface ExecutiveChartsProps {
  latest: ExecutiveKpiSnapshot;
  history: ExecutiveKpiSnapshot[];
  actualRevenue?: string | number;
}

const PARTNER_COLORS = [
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#8b5cf6",
  "#f43f5e",
  "#84cc16",
];

function monthLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatFullNumber(
  value: number,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function ExecutiveCharts({
  latest,
  history,
  actualRevenue,
}: ExecutiveChartsProps) {
  const [partnerRevenue, setPartnerRevenue] = useState<
    RevenueByPartnerKpi[]
  >([]);
  const [isLoadingPartnerRevenue, setIsLoadingPartnerRevenue] =
    useState(true);

  const loadPartnerRevenue = useCallback(async (): Promise<void> => {
    setIsLoadingPartnerRevenue(true);

    try {
      setPartnerRevenue(await getRevenueByPartnerKpi());
    } catch {
      setPartnerRevenue([]);
    } finally {
      setIsLoadingPartnerRevenue(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPartnerRevenue();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPartnerRevenue]);
  /*
   * Sort oldest -> newest because charts
   * should move chronologically left -> right.
   */
  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(a.snapshot_month).getTime() -
      new Date(b.snapshot_month).getTime(),
  );

  const revenueData = sortedHistory.map(
    (snapshot) => ({
      month: monthLabel(
        snapshot.snapshot_month,
      ),

      pipeline: Number(
        snapshot.total_pipeline_value,
      ),

      forecast: Number(
        snapshot.forecast_revenue,
      ),
    }),
  );

  const utilizationData =
    sortedHistory.map((snapshot) => ({
      month: monthLabel(
        snapshot.snapshot_month,
      ),

      utilization:
        snapshot.resource_utilization_percentage,

      bench:
        snapshot.bench_percentage,
    }));

  const workforceData = [
    {
      name: "Allocated",
      value: latest.allocated_employees,
    },
    {
      name: "Available",
      value: latest.available_employees,
    },
  ];

  const partnerPipelineVsActualData = [
    {
      name: "Partner Influenced Pipeline",
      value: Number(latest.partner_influenced_pipeline),
    },
    {
      name: "Actual Revenue",
      value: Number(actualRevenue ?? latest.actual_revenue),
    },
  ];

  const partnerPieData = partnerRevenue.filter(
    (partner) => Number(partner.revenue) > 0,
  );
  const totalPartnerRevenue = partnerPieData.reduce(
    (total, partner) => total + Number(partner.revenue),
    0,
  );

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* PIPELINE / FORECAST LINE GRAPH */}
      {/* ================================================= */}

      <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
        <CardHeader className="border-b border-blue-50">
          <CardTitle className="text-lg font-bold text-slate-800">
            Pipeline & Revenue Forecast
          </CardTitle>

          <p className="text-sm text-slate-500">
            Month-wise movement of total pipeline
            and forecast revenue.
          </p>
        </CardHeader>

        <CardContent className="p-5">
          {revenueData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
              No historical snapshots available.
            </div>
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={revenueData}
                  margin={{
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickFormatter={
                      formatFullNumber
                    }
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(
                      value,
                    ) =>
                      new Intl.NumberFormat(
                        "en-US",
                        {
                          style:
                            "currency",
                          currency:
                            "USD",
                          maximumFractionDigits: 0,
                        },
                      ).format(
                        Number(value),
                      )
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="pipeline"
                    name="Pipeline Value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast Revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

        </CardContent>
      </Card>

      <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/30">
        <CardHeader className="border-b border-emerald-50">
          <CardTitle className="text-lg font-bold text-slate-800">
            Revenue by Partner
          </CardTitle>
          <p className="text-sm text-slate-500">
            Total influenced value grouped by alliance partner.
          </p>
        </CardHeader>

        <CardContent className="p-5">
          {isLoadingPartnerRevenue ? (
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
              Loading partner revenue...
            </div>
          ) : partnerRevenue.length === 0 ? (
            <div className="flex h-[340px] items-center justify-center text-center text-sm text-slate-500">
              No partner data is available.
            </div>
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={partnerRevenue}
                  margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="partner_name"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={formatFullNumber}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(Number(value))
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    name="Partner Revenue"
                    fill="#059669"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </CardContent>
      </Card>
      </div>

      {/* ================================================= */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-orange-100 bg-white/90 shadow-lg shadow-orange-100/30">
          <CardHeader className="border-b border-orange-50">
            <CardTitle className="text-lg font-bold text-slate-800">
              Partner Influenced Pipeline vs Actual Revenue
            </CardTitle>
            <p className="text-sm text-slate-500">
              Current partner-influenced pipeline compared with imported actual revenue.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partnerPipelineVsActualData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatFullNumber} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={125} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(Number(value))
                    }
                  />
                  <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]}>
                    <Cell fill="#b7410e" />
                    <Cell fill="#a855f7" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-fuchsia-100 bg-white/90 shadow-lg shadow-fuchsia-100/30">
          <CardHeader className="border-b border-fuchsia-50">
            <CardTitle className="text-lg font-bold text-slate-800">
              Revenue Share by Partner
            </CardTitle>
            <p className="text-sm text-slate-500">
              Each partner&apos;s percentage of total influenced revenue.
            </p>
          </CardHeader>
          <CardContent className="p-5">
            {isLoadingPartnerRevenue ? (
              <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
                Loading partner revenue...
              </div>
            ) : partnerPieData.length === 0 ? (
              <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
                No partner revenue is available.
              </div>
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="revenue"
                      nameKey="partner_name"
                      label={({ name, value }) => {
                        const percentage = totalPartnerRevenue
                          ? (Number(value) / totalPartnerRevenue) * 100
                          : 0;
                        return `${name}: ${percentage.toFixed(1)}%`;
                      }}
                    >
                      {partnerPieData.map((partner, index) => (
                        <Cell
                          key={partner.partner_name}
                          fill={PARTNER_COLORS[index % PARTNER_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const numericValue = Number(value);
                        const percentage = totalPartnerRevenue
                          ? (numericValue / totalPartnerRevenue) * 100
                          : 0;
                        return [
                          `${new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          }).format(numericValue)} (${percentage.toFixed(1)}%)`,
                          "Partner Revenue",
                        ];
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UTILIZATION + WORKFORCE */}
      {/* ================================================= */}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* UTILIZATION BAR GRAPH */}

        <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
          <CardHeader className="border-b border-indigo-50">
            <CardTitle className="text-lg font-bold text-slate-800">
              Resource Utilization
            </CardTitle>

            <p className="text-sm text-slate-500">
              Utilization versus bench percentage
              by month.
            </p>
          </CardHeader>

          <CardContent className="p-5">
            {utilizationData.length ===
            0 ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                No historical snapshots available.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      utilizationData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(
                        value,
                      ) =>
                        `${value}%`
                      }
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      formatter={(
                        value,
                      ) =>
                        `${Number(
                          value,
                        ).toFixed(
                          1,
                        )}%`
                      }
                    />

                    <Legend />

                    <Bar
                      dataKey="utilization"
                      name="Utilization"
                      fill="#2563eb"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />

                    <Bar
                      dataKey="bench"
                      name="Bench"
                      fill="#67e8f9"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WORKFORCE PIE CHART */}

        <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-lg shadow-cyan-100/30">
          <CardHeader className="border-b border-cyan-50">
            <CardTitle className="text-lg font-bold text-slate-800">
              Workforce Distribution
            </CardTitle>

            <p className="text-sm text-slate-500">
              Current allocated versus available
              workforce.
            </p>
          </CardHeader>

          <CardContent className="p-5">
            {latest.total_employees ===
            0 ? (
              <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                No workforce data available.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={
                        workforceData
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({
                        name,
                        value,
                      }) =>
                        `${name}: ${value}`
                      }
                    >
                      <Cell
                        fill="#4f46e5"
                      />

                      <Cell
                        fill="#22d3ee"
                      />
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
