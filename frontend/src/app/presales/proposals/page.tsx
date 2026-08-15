"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createProposal,
  deleteProposal,
  getProposals,
  getSolutions,
  replaceProposal,
  submitProposal,
} from "@/lib/presales-api";

import type {
  ApprovalStatus,
  CreateProposalRequest,
  Proposal,
  ProposalStatus,
  Solution,
} from "@/types/presales";

/* ================================================= */
/* FORM TYPES */
/* ================================================= */

interface ProposalFormState {
  solution_id: string;
  proposal_title: string;
  version: string;
  sow_document_url: string;
  proposal_document_url: string;
  submission_date: string;
  proposal_status: ProposalStatus;
  approval_status: ApprovalStatus;
  remarks: string;
}

const EMPTY_FORM: ProposalFormState = {
  solution_id: "",
  proposal_title: "",
  version: "1.0",
  sow_document_url: "",
  proposal_document_url: "",
  submission_date: "",
  proposal_status: "DRAFT",
  approval_status: "PENDING",
  remarks: "",
};

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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not submitted";
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

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  if (!error.response) {
    return "Unable to connect to the backend.";
  }

  const detail = error.response.data?.detail;

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
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return "The request could not be completed.";
}

function getProposalStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "SUBMITTED":
      return "bg-indigo-100 text-indigo-700";

    case "IN_REVIEW":
      return "bg-amber-100 text-amber-700";

    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getApprovalStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function proposalToForm(
  proposal: Proposal,
): ProposalFormState {
  return {
    solution_id:
      proposal.solution_id.toString(),

    proposal_title:
      proposal.proposal_title,

    version:
      proposal.version,

    sow_document_url:
      proposal.sow_document_url ?? "",

    proposal_document_url:
      proposal.proposal_document_url ?? "",

    submission_date:
      proposal.submission_date ?? "",

    proposal_status:
      proposal.proposal_status,

    approval_status:
      proposal.approval_status,

    remarks:
      proposal.remarks ?? "",
  };
}

function formToPayload(
  form: ProposalFormState,
): CreateProposalRequest {
  return {
    solution_id:
      Number(form.solution_id),

    proposal_title:
      form.proposal_title.trim(),

    version:
      form.version.trim(),

    sow_document_url:
      form.sow_document_url.trim(),

    proposal_document_url:
      form.proposal_document_url.trim(),

    submission_date:
      form.submission_date || null,

    proposal_status:
      form.proposal_status,

    approval_status:
      form.approval_status,

    remarks:
      form.remarks.trim(),
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface ProposalFormModalProps {
  proposal: Proposal | null;
  solutions: Solution[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateProposalRequest,
  ) => Promise<void>;
}

function ProposalFormModal({
  proposal,
  solutions,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ProposalFormModalProps) {
  const [form, setForm] =
    useState<ProposalFormState>(
      proposal
        ? proposalToForm(proposal)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const isInvalid =
    !form.solution_id ||
    !form.proposal_title.trim() ||
    !form.version.trim();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(
      formToPayload(form),
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {proposal
                ? "Edit Proposal"
                : "Create Proposal"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Prepare the commercial and technical proposal for an approved solution.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            {error && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="solution_id">
                Solution *
              </Label>

              <select
                id="solution_id"
                name="solution_id"
                value={form.solution_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">
                  Select a solution
                </option>

                {solutions.map(
                  (solution) => (
                    <option
                      key={solution.id}
                      value={solution.id}
                    >
                      #{solution.id} -{" "}
                      {solution.solution_name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal_title">
                Proposal title *
              </Label>

              <Input
                id="proposal_title"
                name="proposal_title"
                value={form.proposal_title}
                onChange={handleChange}
                placeholder="Cloud Migration Proposal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">
                Version *
              </Label>

              <Input
                id="version"
                name="version"
                value={form.version}
                onChange={handleChange}
                placeholder="1.0"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sow_document_url">
                SOW Document URL
              </Label>

              <Input
                id="sow_document_url"
                name="sow_document_url"
                type="url"
                value={form.sow_document_url}
                onChange={handleChange}
                placeholder="https://example.com/sow.pdf"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proposal_document_url">
                Proposal Document URL
              </Label>

              <Input
                id="proposal_document_url"
                name="proposal_document_url"
                type="url"
                value={
                  form.proposal_document_url
                }
                onChange={handleChange}
                placeholder="https://example.com/proposal.pdf"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal_status">
                Proposal status
              </Label>

              <select
                id="proposal_status"
                name="proposal_status"
                value={
                  form.proposal_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="DRAFT">
                  Draft
                </option>

                <option value="IN_REVIEW">
                  In Review
                </option>

                {/*
                  SUBMITTED should normally happen
                  through the Submit action.
                */}
              </select>
            </div>

            <div className="space-y-2">
              <Label>
                Approval status
              </Label>

              <Input
                value={formatLabel(
                  form.approval_status,
                )}
                readOnly
                className="bg-slate-50"
              />

              <p className="text-xs text-slate-500">
                Approval is handled by an authorized approver.
              </p>
            </div>

            {proposal?.submission_date && (
              <div className="space-y-2 md:col-span-2">
                <Label>
                  Submission date
                </Label>

                <Input
                  value={formatDate(
                    proposal.submission_date,
                  )}
                  readOnly
                  className="bg-slate-50"
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remarks">
                Remarks
              </Label>

              <Textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add proposal notes, assumptions, commercial remarks, or pending items..."
                rows={5}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800"
              disabled={
                isSaving || isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {proposal
                ? "Save changes"
                : "Create proposal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================= */
/* DETAILS MODAL */
/* ================================================= */

interface ProposalDetailsModalProps {
  proposal: Proposal;
  solution?: Solution;
  onClose: () => void;
}

function ProposalDetailsModal({
  proposal,
  solution,
  onClose,
}: ProposalDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {proposal.proposal_title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Proposal #{proposal.id} · Version{" "}
              {proposal.version}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Proposal Status
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                proposal.proposal_status,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Approval Status
            </p>

            <Badge
              className={`mt-3 ${getApprovalStatusClasses(
                proposal.approval_status,
              )}`}
            >
              {formatLabel(
                proposal.approval_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Solution
            </p>

            <p className="mt-1 font-semibold">
              {solution?.solution_name ??
                `Solution #${proposal.solution_id}`}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Submission Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                proposal.submission_date,
              )}
            </p>
          </div>

          {proposal.sow_document_url && (
            <a
              href={proposal.sow_document_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <ExternalLink className="h-4 w-4" />
              Open SOW Document
            </a>
          )}

          {proposal.proposal_document_url && (
            <a
              href={
                proposal.proposal_document_url
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4 font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              <ExternalLink className="h-4 w-4" />
              Open Proposal Document
            </a>
          )}

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-slate-800">
              Remarks
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {proposal.remarks ||
                "No remarks added."}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                proposal.created_at,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                proposal.updated_at,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function PresalesProposalsPage() {
  const [proposals, setProposals] =
    useState<Proposal[]>([]);

  const [solutions, setSolutions] =
    useState<Solution[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    proposalStatusFilter,
    setProposalStatusFilter,
  ] = useState("ALL");

  const [
    approvalFilter,
    setApprovalFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [submittingId, setSubmittingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingProposal,
    setEditingProposal,
  ] = useState<Proposal | null>(null);

  const [
    viewingProposal,
    setViewingProposal,
  ] = useState<Proposal | null>(null);

  /* ---------------- LOAD ---------------- */

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          proposalRecords,
          solutionRecords,
        ] = await Promise.all([
          getProposals({
            skip: 0,
            limit: 100,
          }),

          getSolutions({
            skip: 0,
            limit: 100,
          }),
        ]);

        setProposals(proposalRecords);
        setSolutions(solutionRecords);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ---------------- FILTERS ---------------- */

  const filteredProposals =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return proposals.filter(
        (proposal) => {
          const solution =
            solutions.find(
              (item) =>
                item.id ===
                proposal.solution_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            proposal.proposal_title
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            proposal.version
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            proposal.remarks
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            solution?.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesProposalStatus =
            proposalStatusFilter ===
              "ALL" ||
            proposal.proposal_status ===
              proposalStatusFilter;

          const matchesApproval =
            approvalFilter === "ALL" ||
            proposal.approval_status ===
              approvalFilter;

          return (
            matchesSearch &&
            matchesProposalStatus &&
            matchesApproval
          );
        },
      );
    }, [
      approvalFilter,
      proposalStatusFilter,
      proposals,
      search,
      solutions,
    ]);

  /* ---------------- KPI ---------------- */

  const draftCount =
    proposals.filter(
      (proposal) =>
        proposal.proposal_status ===
        "DRAFT",
    ).length;

  const submittedCount =
    proposals.filter(
      (proposal) =>
        proposal.proposal_status ===
        "SUBMITTED",
    ).length;

  const approvedCount =
    proposals.filter(
      (proposal) =>
        proposal.approval_status ===
        "APPROVED",
    ).length;

  /* ---------------- SAVE ---------------- */

  async function handleSaveProposal(
    payload: CreateProposalRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingProposal) {
        const updated =
          await replaceProposal(
            editingProposal.id,
            payload,
          );

        setProposals((current) =>
          current.map((proposal) =>
            proposal.id === updated.id
              ? updated
              : proposal,
          ),
        );
      } else {
        const created =
          await createProposal(payload);

        setProposals((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingProposal(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* ---------------- SUBMIT ---------------- */

  async function handleSubmitProposal(
    proposal: Proposal,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Submit "${proposal.proposal_title}" for approval?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmittingId(proposal.id);
    setError("");

    try {
      const updated =
        await submitProposal(
          proposal.id,
        );

      setProposals((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    } finally {
      setSubmittingId(null);
    }
  }

  /* ---------------- DELETE ---------------- */

  async function handleDeleteProposal(
    proposal: Proposal,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete proposal "${proposal.proposal_title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProposal(
        proposal.id,
      );

      setProposals((current) =>
        current.filter(
          (item) =>
            item.id !== proposal.id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  function findSolution(
    solutionId: number,
  ): Solution | undefined {
    return solutions.find(
      (solution) =>
        solution.id === solutionId,
    );
  }

  function openCreateForm(): void {
    setEditingProposal(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    proposal: Proposal,
  ): void {
    setEditingProposal(proposal);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout
        title="Proposals"
        description="Prepare, manage and submit customer proposals."
      >
        <div className="space-y-6">

          {/* KPI CARDS */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Proposals"
              value={proposals.length.toLocaleString(
                "en-US",
              )}
              description="All proposals in the database"
              icon={FileText}
              variant="blue"
            />

            <StatCard
              title="Draft Proposals"
              value={draftCount.toLocaleString(
                "en-US",
              )}
              description="Proposals still being prepared"
              icon={Edit3}
              variant="indigo"
            />

            <StatCard
              title="Submitted"
              value={submittedCount.toLocaleString(
                "en-US",
              )}
              description="Proposals submitted for review"
              icon={Send}
              variant="cyan"
            />

            <StatCard
              title="Approved"
              value={approvedCount.toLocaleString(
                "en-US",
              )}
              description="Proposals approved by authorized users"
              icon={CheckCircle2}
              variant="emerald"
            />
          </section>

          {/* MAIN CARD */}

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Customer Proposals
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {proposals.length} proposal
                    {proposals.length === 1
                      ? ""
                      : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadData()
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

                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={openCreateForm}
                    disabled={
                      solutions.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Create Proposal
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="mb-5"
                >
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading &&
                solutions.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Create a solution before creating a proposal.
                    </AlertDescription>
                  </Alert>
                )}

              {/* FILTERS */}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search proposal, version, solution or remarks..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={
                    proposalStatusFilter
                  }
                  onChange={(event) =>
                    setProposalStatusFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All proposal statuses
                  </option>

                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="IN_REVIEW">
                    In Review
                  </option>

                  <option value="SUBMITTED">
                    Submitted
                  </option>

                  <option value="ACCEPTED">
                    Accepted
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>
                </select>

                <select
                  value={approvalFilter}
                  onChange={(event) =>
                    setApprovalFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All approval statuses
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>
                </select>
              </div>

              {/* TABLE */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredProposals.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <FileText className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No proposals found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a proposal or change the filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1350px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Proposal
                        </th>

                        <th className="px-4 py-3">
                          Solution
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
                          Submission
                        </th>

                        <th className="px-4 py-3">
                          Documents
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredProposals.map(
                        (proposal) => {
                          const solution =
                            findSolution(
                              proposal.solution_id,
                            );

                          const canSubmit =
                            ["DRAFT", "IN_REVIEW"].includes(
                              proposal.proposal_status,
                            );

                          return (
                            <tr
                              key={proposal.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {
                                        proposal.proposal_title
                                      }
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      Proposal #
                                      {proposal.id}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <Layers3 className="h-4 w-4 text-indigo-600" />

                                  <span className="font-medium text-slate-700">
                                    {solution?.solution_name ??
                                      `Solution #${proposal.solution_id}`}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-4 font-medium text-slate-700">
                                {proposal.version}
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getProposalStatusClasses(
                                    proposal.proposal_status,
                                  )}
                                >
                                  {formatLabel(
                                    proposal.proposal_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getApprovalStatusClasses(
                                    proposal.approval_status,
                                  )}
                                >
                                  {formatLabel(
                                    proposal.approval_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock3 className="h-4 w-4 text-blue-600" />

                                  {formatDate(
                                    proposal.submission_date,
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  {proposal.sow_document_url && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      title="Open SOW"
                                      onClick={() =>
                                        window.open(
                                          proposal.sow_document_url,
                                          "_blank",
                                          "noopener,noreferrer",
                                        )
                                      }
                                    >
                                      <FileCheck2 className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {proposal.proposal_document_url && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      title="Open proposal document"
                                      onClick={() =>
                                        window.open(
                                          proposal.proposal_document_url,
                                          "_blank",
                                          "noopener,noreferrer",
                                        )
                                      }
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  {canSubmit && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      title="Submit proposal"
                                      className="bg-indigo-700 text-white hover:bg-indigo-800"
                                      disabled={
                                        submittingId ===
                                        proposal.id
                                      }
                                      onClick={() =>
                                        void handleSubmitProposal(
                                          proposal,
                                        )
                                      }
                                    >
                                      {submittingId ===
                                      proposal.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View proposal"
                                    onClick={() =>
                                      setViewingProposal(
                                        proposal,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit proposal"
                                    disabled={
                                      proposal.proposal_status ===
                                      "SUBMITTED"
                                    }
                                    onClick={() =>
                                      openEditForm(
                                        proposal,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete proposal"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    disabled={
                                      proposal.proposal_status ===
                                      "SUBMITTED"
                                    }
                                    onClick={() =>
                                      void handleDeleteProposal(
                                        proposal,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <ProposalFormModal
            proposal={editingProposal}
            solutions={solutions}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingProposal(null);
              }
            }}
            onSubmit={handleSaveProposal}
          />
        )}

        {viewingProposal && (
          <ProposalDetailsModal
            proposal={viewingProposal}
            solution={findSolution(
              viewingProposal.solution_id,
            )}
            onClose={() =>
              setViewingProposal(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}