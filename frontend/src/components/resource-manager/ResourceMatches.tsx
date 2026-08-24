"use client";

import {
  useState,
} from "react";
import axios from "axios";
import {
  Loader2,
  Search,
  UserRoundCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getResourceRequestMatches,
} from "@/lib/resource-manager-api";

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
  ResourceMatch,
  ResourceRequest,
} from "@/types/resource-manager";

interface Props {
  request: ResourceRequest;
}

function badgeClass(
  status: string,
): string {
  switch (status) {
    case "EXCELLENT":
      return "bg-emerald-100 text-emerald-700";

    case "GOOD":
      return "bg-blue-100 text-blue-700";

    case "MODERATE":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-red-100 text-red-700";
  }
}

export function ResourceMatches({
  request,
}: Props) {
  const router = useRouter();
  const [matches, setMatches] =
    useState<ResourceMatch[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [error, setError] =
    useState("");

  async function findMatches() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getResourceRequestMatches(
          request.id,
        );

      setMatches(data);
      setSearched(true);
    } catch (requestError) {
      if (
        axios.isAxiosError(
          requestError,
        )
      ) {
        setError(
          requestError.response?.data
            ?.detail ??
            "Unable to find matching resources.",
        );
      } else {
        setError(
          "Unable to find matching resources.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function openAllocationForm(
    match: ResourceMatch,
  ): void {
    const parameters = new URLSearchParams({
      allocate: "soft-booking",
      employee_id: match.employee_id.toString(),
      resource_request_id: request.id.toString(),
      opportunity_id: request.opportunity_id?.toString() ?? "",
      solution_id: request.solution_id?.toString() ?? "",
      start_date: request.required_from,
      end_date: request.required_until ?? "",
      allocation_percentage: request.allocation_percentage.toString(),
    });

    router.push(
      `/resource-manager/resource-allocations?${parameters.toString()}`,
    );
  }

  return (
    <Card className="rounded-2xl border-blue-100 shadow-lg shadow-blue-100/30">
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>
              Matching Resources
            </CardTitle>

            <p className="mt-1 text-sm text-slate-500">
              {request.requested_role} ·{" "}
              {request.required_skill} ·{" "}
              {request.minimum_experience_years}
              + years
            </p>
          </div>

          <Button
            type="button"
            className="bg-blue-700 hover:bg-blue-800"
            disabled={loading}
            onClick={() =>
              void findMatches()
            }
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}

            Find Matching Resources
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert
            variant="destructive"
            className="mb-4"
          >
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {searched &&
          matches.length === 0 && (
            <div className="py-10 text-center">
              <UserRoundCheck className="mx-auto h-10 w-10 text-blue-300" />

              <p className="mt-3 text-sm text-slate-500">
                No matching employees found.
              </p>
            </div>
          )}

        {matches.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-blue-100">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-blue-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">
                    Employee
                  </th>
                  <th className="p-3">
                    Skill
                  </th>
                  <th className="p-3">
                    Experience
                  </th>
                  <th className="p-3">
                    Availability
                  </th>
                  <th className="p-3">
                    Utilization
                  </th>
                  <th className="p-3">
                    Capacity
                  </th>
                  <th className="p-3">
                    Match
                  </th>
                  <th className="p-3">
                    Status
                  </th>
                  <th className="p-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {matches.map((match) => (
                  <tr
                    key={match.employee_id}
                    className="border-t hover:bg-blue-50/40"
                  >
                    <td className="p-3">
                      <p className="font-semibold">
                        {match.full_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {match.employee_code} ·{" "}
                        {match.designation}
                      </p>
                    </td>

                    <td className="p-3">
                      <p>
                        {match.required_skill}
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          match.skill_proficiency
                        }
                      </p>
                    </td>

                    <td className="p-3">
                      {
                        match.skill_experience_years
                      }{" "}
                      yrs skill
                      <p className="text-xs text-slate-500">
                        {
                          match.total_experience_years
                        }{" "}
                        yrs total
                      </p>
                    </td>

                    <td className="p-3">
                      {
                        match.availability_status
                      }
                    </td>

                    <td className="p-3">
                      {
                        match.current_utilization_percentage
                      }
                      %
                    </td>

                    <td className="p-3">
                      {
                        match.remaining_capacity_percentage
                      }
                      %
                    </td>

                    <td className="p-3 font-bold text-blue-700">
                      {match.match_score.toFixed(
                        1,
                      )}
                    </td>

                    <td className="p-3">
                      <Badge
                        className={badgeClass(
                          match.match_status,
                        )}
                      >
                        {
                          match.match_status
                        }
                      </Badge>
                    </td>

                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-blue-700 hover:bg-blue-800"
                        disabled={
                          request.request_status === "ALLOCATED" ||
                          request.request_status === "CANCELLED"
                        }
                        onClick={() => openAllocationForm(match)}
                      >
                        <UserRoundCheck className="mr-2 h-4 w-4" />
                        Allocate Employee
                      </Button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
