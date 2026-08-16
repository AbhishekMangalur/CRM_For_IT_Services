"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import {
  CheckCircle2,
  FileCheck2,
  Loader2,
  RefreshCcw,
  X,
  XCircle,
} from "lucide-react";

import {
  approveProposal,
  getProposals,
  rejectProposal,
} from "@/lib/presales-api";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type {
  Proposal,
} from "@/types/presales";

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
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

  return "Unable to complete the proposal approval request.";
}

export function PendingProposalApprovals() {
  const confirm = useConfirm();
  const [
    proposals,
    setProposals,
  ] = useState<Proposal[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<number | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    rejectingProposal,
    setRejectingProposal,
  ] = useState<Proposal | null>(
    null,
  );

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  function getLoggedInUserId():
    | number
    | null {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const value =
      localStorage.getItem(
        "user_id",
      );

    if (!value) {
      return null;
    }

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  const loadPendingProposals =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError("");

        try {
          const records =
            await getProposals({
              skip: 0,
              limit: 100,
            });

          setProposals(
            records.filter(
              (proposal) =>
                proposal.proposal_status ===
                  "SUBMITTED" &&
                proposal.approval_status ===
                  "PENDING",
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
      void loadPendingProposals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPendingProposals]);

  async function handleApprove(
    proposal: Proposal,
  ): Promise<void> {
    const userId =
      getLoggedInUserId();

    if (!userId) {
      setError(
        "Unable to identify the logged-in Executive user.",
      );
      return;
    }

    const confirmed =
      await confirm(
        `Approve proposal "${proposal.proposal_title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setProcessingId(
      proposal.id,
    );

    setError("");
    setSuccessMessage("");

    try {
      await approveProposal(
        proposal.id,
        userId,
      );

      setSuccessMessage(
        `Proposal #${proposal.id} approved successfully.`,
      );

      await loadPendingProposals();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  function openReject(
    proposal: Proposal,
  ): void {
    setError("");
    setSuccessMessage("");
    setRejectionReason("");

    setRejectingProposal(
      proposal,
    );
  }

  async function handleReject(): Promise<void> {
    if (!rejectingProposal) {
      return;
    }

    if (
      !rejectionReason.trim()
    ) {
      setError(
        "Rejection reason is required.",
      );
      return;
    }

    const userId =
      getLoggedInUserId();

    if (!userId) {
      setError(
        "Unable to identify the logged-in Executive user.",
      );
      return;
    }

    setProcessingId(
      rejectingProposal.id,
    );

    setError("");
    setSuccessMessage("");

    try {
      await rejectProposal(
        rejectingProposal.id,
        userId,
        rejectionReason.trim(),
      );

      setSuccessMessage(
        `Proposal #${rejectingProposal.id} rejected.`,
      );

      setRejectingProposal(
        null,
      );

      setRejectionReason("");

      await loadPendingProposals();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
        <CardHeader className="border-b border-indigo-50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <FileCheck2 className="h-5 w-5 text-indigo-600" />

                Pending Proposal Approvals
              </CardTitle>

              <p className="mt-1 text-sm text-slate-500">
                Review submitted Presales proposals before they move back to Sales.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void loadPendingProposals()
              }
              disabled={isLoading}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${
                  isLoading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5">
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

          {successMessage && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
              <AlertDescription>
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-700" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />

              <p className="mt-3 font-semibold text-slate-700">
                No pending proposal approvals
              </p>

              <p className="mt-1 text-sm text-slate-500">
                All submitted proposals have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-indigo-100">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-indigo-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Proposal
                    </th>

                    <th className="px-4 py-3">
                      Version
                    </th>

                    <th className="px-4 py-3">
                      Proposal Status
                    </th>

                    <th className="px-4 py-3">
                      Approval
                    </th>

                    <th className="px-4 py-3">
                      Remarks
                    </th>

                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-indigo-50">
                  {proposals.map(
                    (proposal) => (
                      <tr
                        key={proposal.id}
                        className="bg-white transition hover:bg-indigo-50/30"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">
                            {proposal.proposal_title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Proposal #{proposal.id} · Solution #{proposal.solution_id}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-700">
                          {proposal.version}
                        </td>

                        <td className="px-4 py-4">
                          <Badge className="bg-blue-100 text-blue-700">
                            Submitted
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <Badge className="bg-amber-100 text-amber-700">
                            Pending
                          </Badge>
                        </td>

                        <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                          {proposal.remarks ||
                            "No remarks"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={
                                processingId ===
                                proposal.id
                              }
                              onClick={() =>
                                void handleApprove(
                                  proposal,
                                )
                              }
                            >
                              {processingId ===
                              proposal.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}

                              Approve
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={
                                processingId ===
                                proposal.id
                              }
                              onClick={() =>
                                openReject(
                                  proposal,
                                )
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />

                              Reject
                            </Button>
                          </div>
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

      {rejectingProposal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-red-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reject Proposal
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {rejectingProposal.proposal_title}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setRejectingProposal(
                    null,
                  )
                }
                disabled={
                  processingId !== null
                }
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs text-slate-500">
                  Proposal
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {rejectingProposal.proposal_title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Version {rejectingProposal.version}
                </p>
              </div>

              <div>
                <label
                  htmlFor="proposal_rejection_reason"
                  className="text-sm font-medium text-slate-700"
                >
                  Rejection Reason *
                </label>

                <Textarea
                  id="proposal_rejection_reason"
                  className="mt-2"
                  rows={5}
                  placeholder="Add the reason why this proposal is being rejected..."
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-red-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRejectingProposal(
                    null,
                  )
                }
                disabled={
                  processingId !== null
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                disabled={
                  processingId !==
                    null ||
                  !rejectionReason.trim()
                }
                onClick={() =>
                  void handleReject()
                }
              >
                {processingId !==
                  null && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                Reject Proposal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
