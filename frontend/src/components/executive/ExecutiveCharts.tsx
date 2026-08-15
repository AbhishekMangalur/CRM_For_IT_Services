"use client";

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
} from "@/types/executive";

interface ExecutiveChartsProps {
  latest: ExecutiveKpiSnapshot;
  history: ExecutiveKpiSnapshot[];
}

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
}: ExecutiveChartsProps) {
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

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* PIPELINE / FORECAST LINE GRAPH */}
      {/* ================================================= */}

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

      {/* ================================================= */}
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
