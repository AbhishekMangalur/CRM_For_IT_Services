"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

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
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Edit3,
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
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

import { api } from "@/lib/api";

import {
  createBidEvaluation,
  deleteBidEvaluation,
  getBidEvaluations,
  getRfps,
  replaceBidEvaluation,
} from "@/lib/rfp-api";

import type {
  BidEvaluation,
  CreateBidEvaluationRequest,
  Rfp,
} from "@/types/rfp";

/* ================================================= */
/* USER */
/* ================================================= */

interface EvaluationUserRole {
  id: number;
  name: string;
  display_name: string;
}

interface EvaluationUser {
  id: number;
  full_name: string;
  email: string;
  role: EvaluationUserRole;
  is_active?: boolean;
}

async function getUsers(): Promise<EvaluationUser[]> {
  const response =
    await api.get<EvaluationUser[]>(
      "/api/users",
    );

  return response.data;
}

/* ================================================= */
/* FORM */
/* ================================================= */

interface EvaluationFormState {
  rfp_id: string;

  strategic_fit_score: string;
  technical_fit_score: string;
  resource_availability_score: string;
  profitability_score: string;
  win_probability: string;

  evaluated_by: string;

  comments: string;
}

const EMPTY_FORM: EvaluationFormState = {
  rfp_id: "",

  strategic_fit_score: "",
  technical_fit_score: "",
  resource_availability_score: "",
  profitability_score: "",
  win_probability: "",

  evaluated_by: "",

  comments: "",
};

/* ================================================= */
/* HELPERS */
/* ================================================= */

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
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

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message ===
      "string"
  ) {
    return detail.message;
  }

  return "The request could not be completed.";
}

function getRecommendationClasses(
  recommendation: string,
): string {
  switch (
    recommendation.toUpperCase()
  ) {
    case "BID":
      return "bg-emerald-100 text-emerald-700";

    case "NO_BID":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getScoreClasses(score: number): string {
  if (score >= 75) {
    return "text-emerald-700";
  }

  if (score >= 50) {
    return "text-amber-600";
  }

  return "text-red-800";
}

function getScoreBarClasses(score: number): string {
  if (score >= 75) {
    return "bg-emerald-600";
  }

  if (score >= 50) {
    return "bg-amber-500";
  }

  return "bg-red-700";
}

function evaluationToForm(
  evaluation: BidEvaluation,
): EvaluationFormState {
  return {
    rfp_id:
      evaluation.rfp_id.toString(),

    strategic_fit_score:
      evaluation.strategic_fit_score.toString(),

    technical_fit_score:
      evaluation.technical_fit_score.toString(),

    resource_availability_score:
      evaluation.resource_availability_score.toString(),

    profitability_score:
      evaluation.profitability_score.toString(),

    win_probability:
      evaluation.win_probability.toString(),

    evaluated_by:
      evaluation.evaluated_by.toString(),

    comments:
      evaluation.comments ?? "",
  };
}

function formToPayload(
  form: EvaluationFormState,
): CreateBidEvaluationRequest {
  return {
    rfp_id:
      Number(form.rfp_id),

    strategic_fit_score:
      Number(
        form.strategic_fit_score,
      ),

    technical_fit_score:
      Number(
        form.technical_fit_score,
      ),

    resource_availability_score:
      Number(
        form.resource_availability_score,
      ),

    profitability_score:
      Number(
        form.profitability_score,
      ),

    win_probability:
      Number(
        form.win_probability,
      ),

    evaluated_by:
      Number(form.evaluated_by),

    comments:
      form.comments.trim() || null,
  };
}

/* ================================================= */
/* SCORE INPUT */
/* ================================================= */

interface ScoreFieldProps {
  id: keyof EvaluationFormState;
  label: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}

function ScoreField({
  id,
  label,
  value,
  onChange,
}: ScoreFieldProps) {
  const numericValue =
    Number(value) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label} *
        </Label>

        <span className="text-sm font-semibold text-blue-700">
          {numericValue}/100
        </span>
      </div>

      <Input
        id={id}
        name={id}
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={onChange}
        required
      />

      <div className="h-2 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                numericValue,
              ),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface EvaluationFormModalProps {
  evaluation:
    | BidEvaluation
    | null;

  rfps: Rfp[];

  users: EvaluationUser[];

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreateBidEvaluationRequest,
  ) => Promise<void>;
}

function EvaluationFormModal({
  evaluation,
  rfps,
  users,
  isSaving,
  error,
  onClose,
  onSubmit,
}: EvaluationFormModalProps) {
  const [form, setForm] =
    useState<EvaluationFormState>(
      evaluation
        ? evaluationToForm(
            evaluation,
          )
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ): void {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const scores = [
    Number(
      form.strategic_fit_score,
    ),
    Number(
      form.technical_fit_score,
    ),
    Number(
      form.resource_availability_score,
    ),
    Number(
      form.profitability_score,
    ),
    Number(
      form.win_probability,
    ),
  ];

  const scoresValid =
    scores.every(
      (score) =>
        Number.isFinite(score) &&
        score >= 0 &&
        score <= 100,
    );

  const isInvalid =
    !form.rfp_id ||
    !form.evaluated_by ||
    form.strategic_fit_score === "" ||
    form.technical_fit_score === "" ||
    form.resource_availability_score ===
      "" ||
    form.profitability_score === "" ||
    form.win_probability === "" ||
    !scoresValid;

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

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {evaluation
                ? "Edit Bid Evaluation"
                : "Create Bid Evaluation"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the five evaluation
              scores. Overall score and
              BID / NO_BID recommendation
              are calculated by the backend.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 p-6 md:grid-cols-2">

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

            {/* RFP */}

            <div className="space-y-2">
              <Label htmlFor="rfp_id">
                RFP *
              </Label>

              <select
                id="rfp_id"
                name="rfp_id"
                value={form.rfp_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select RFP
                </option>

                {rfps.map(
                  (rfp) => (
                    <option
                      key={rfp.id}
                      value={rfp.id}
                    >
                      {rfp.rfp_number} -{" "}
                      {rfp.title}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* EVALUATED BY */}

            <div className="space-y-2">
              <Label htmlFor="evaluated_by">
                Evaluated By *
              </Label>

              <select
                id="evaluated_by"
                name="evaluated_by"
                value={
                  form.evaluated_by
                }
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select evaluator
                </option>

                {users.map(
                  (user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.full_name} -{" "}
                      {user.role.display_name}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* SCORES */}

            <ScoreField
              id="strategic_fit_score"
              label="Strategic Fit"
              value={
                form.strategic_fit_score
              }
              onChange={handleChange}
            />

            <ScoreField
              id="technical_fit_score"
              label="Technical Fit"
              value={
                form.technical_fit_score
              }
              onChange={handleChange}
            />

            <ScoreField
              id="resource_availability_score"
              label="Resource Availability"
              value={
                form.resource_availability_score
              }
              onChange={handleChange}
            />

            <ScoreField
              id="profitability_score"
              label="Profitability"
              value={
                form.profitability_score
              }
              onChange={handleChange}
            />

            <ScoreField
              id="win_probability"
              label="Win Probability"
              value={
                form.win_probability
              }
              onChange={handleChange}
            />

            {/* BACKEND RULE */}

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-800">
                    Backend Decision
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The frontend does not
                    submit overall score or
                    recommendation.
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Score ≥ 60 → BID
                    <br />
                    Score &lt; 60 → NO_BID
                  </p>
                </div>
              </div>
            </div>

            {/* COMMENTS */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="comments">
                Evaluation Comments
              </Label>

              <Textarea
                id="comments"
                name="comments"
                value={form.comments}
                onChange={handleChange}
                rows={5}
                placeholder="Strong technical fit and sufficient delivery capacity..."
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white/95 px-6 py-4">
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
                isSaving ||
                isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {evaluation
                ? "Save Changes"
                : "Evaluate RFP"}
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

interface EvaluationDetailsModalProps {
  evaluation: BidEvaluation;

  rfp?: Rfp;

  evaluator?: EvaluationUser;

  onClose: () => void;
}

function EvaluationDetailsModal({
  evaluation,
  rfp,
  evaluator,
  onClose,
}: EvaluationDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {rfp?.title ??
                `RFP #${evaluation.rfp_id}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bid Evaluation #
              {evaluation.id}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">

          {/* SCORE */}

          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Overall Score
            </p>

            <p className="mt-2 text-4xl font-bold">
              {evaluation.overall_score.toFixed(
                1,
              )}
            </p>

            <p className="mt-1 text-sm text-blue-100">
              Backend calculated
            </p>
          </div>

          {/* DECISION */}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Recommendation
            </p>

            <Badge
              className={`mt-3 text-base ${getRecommendationClasses(
                evaluation.recommendation,
              )}`}
            >
              {
                evaluation.recommendation
              }
            </Badge>

            <p className="mt-3 text-xs text-slate-500">
              Decision generated by backend
            </p>
          </div>

          {/* STRATEGIC */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Strategic Fit
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700">
              {
                evaluation.strategic_fit_score
              }
              /100
            </p>
          </div>

          {/* TECHNICAL */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Technical Fit
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {
                evaluation.technical_fit_score
              }
              /100
            </p>
          </div>

          {/* RESOURCE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Resource Availability
            </p>

            <p className="mt-1 text-2xl font-bold text-cyan-700">
              {
                evaluation.resource_availability_score
              }
              /100
            </p>
          </div>

          {/* PROFIT */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Profitability
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {
                evaluation.profitability_score
              }
              /100
            </p>
          </div>

          {/* WIN */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Win Probability
            </p>

            <p className="mt-1 text-2xl font-bold text-violet-700">
              {
                evaluation.win_probability
              }
              %
            </p>
          </div>

          {/* EVALUATOR */}

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />

              <p className="text-xs text-slate-500">
                Evaluated By
              </p>
            </div>

            <p className="mt-2 font-semibold">
              {evaluator?.full_name ??
                `User #${evaluation.evaluated_by}`}
            </p>

            {evaluator && (
              <p className="mt-1 text-sm text-slate-500">
                {evaluator.role.display_name}
              </p>
            )}
          </div>

          {/* CREATED */}

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Evaluated On
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                evaluation.created_at,
              )}
            </p>
          </div>

          {/* COMMENTS */}

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Comments
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {evaluation.comments ||
                "No comments added."}
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

export default function RfpEvaluationsPage() {
  const confirm = useConfirm();
  const [
    evaluations,
    setEvaluations,
  ] =
    useState<BidEvaluation[]>([]);

  const [rfps, setRfps] =
    useState<Rfp[]>([]);

  const [users, setUsers] =
    useState<EvaluationUser[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    decisionFilter,
    setDecisionFilter,
  ] = useState("ALL");

  const [
    rfpFilter,
    setRfpFilter,
  ] = useState("ALL");

  const [
    evaluatorFilter,
    setEvaluatorFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingEvaluation,
    setEditingEvaluation,
  ] =
    useState<BidEvaluation | null>(
      null,
    );

  const [
    viewingEvaluation,
    setViewingEvaluation,
  ] =
    useState<BidEvaluation | null>(
      null,
    );

  /* ================================================= */
  /* LOAD */
  /* ================================================= */

  const loadData =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError("");

        try {
          const [
            evaluationRecords,
            rfpRecords,
            userRecords,
          ] = await Promise.all([
            getBidEvaluations({
              skip: 0,
              limit: 100,
            }),

            getRfps({
              skip: 0,
              limit: 100,
            }),

            getUsers(),
          ]);

          setEvaluations(
            evaluationRecords,
          );

          setRfps(rfpRecords);

          setUsers(
            userRecords.filter(
              (user) =>
                user.is_active !==
                false,
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
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  /* ================================================= */
  /* LOOKUPS */
  /* ================================================= */

  function findRfp(
    rfpId: number,
  ): Rfp | undefined {
    return rfps.find(
      (rfp) =>
        rfp.id === rfpId,
    );
  }

  function findUser(
    userId: number,
  ): EvaluationUser | undefined {
    return users.find(
      (user) =>
        user.id === userId,
    );
  }

  /* ================================================= */
  /* FILTER */
  /* ================================================= */

  const filteredEvaluations =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return evaluations.filter(
        (evaluation) => {
          const rfp =
            rfps.find(
              (record) =>
                record.id ===
                evaluation.rfp_id,
            );

          const evaluator =
            users.find(
              (record) =>
                record.id ===
                evaluation.evaluated_by,
            );

          const matchesSearch =
            !normalizedSearch ||
            rfp?.title
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp?.rfp_number
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            evaluator?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            evaluation.comments
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesDecision =
            decisionFilter ===
              "ALL" ||
            evaluation.recommendation ===
              decisionFilter;

          const matchesRfp =
            rfpFilter ===
              "ALL" ||
            evaluation.rfp_id ===
              Number(rfpFilter);

          const matchesEvaluator =
            evaluatorFilter ===
              "ALL" ||
            evaluation.evaluated_by ===
              Number(
                evaluatorFilter,
              );

          return (
            matchesSearch &&
            matchesDecision &&
            matchesRfp &&
            matchesEvaluator
          );
        },
      );
    }, [
      decisionFilter,
      evaluatorFilter,
      evaluations,
      rfpFilter,
      rfps,
      search,
      users,
    ]);

  /* ================================================= */
  /* KPI */
  /* ================================================= */

  const bidCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.recommendation ===
        "BID",
    ).length;

  const noBidCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.recommendation ===
        "NO_BID",
    ).length;

  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce(
          (
            total,
            evaluation,
          ) =>
            total +
            Number(
              evaluation.overall_score,
            ),
          0,
        ) /
        evaluations.length
      : 0;

  /* ================================================= */
  /* SAVE */
  /* ================================================= */

  async function handleSaveEvaluation(
    payload:
      CreateBidEvaluationRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingEvaluation) {
        await replaceBidEvaluation(
          editingEvaluation.id,
          payload,
        );
      } else {
        await createBidEvaluation(
          payload,
        );
      }

      setShowForm(false);

      setEditingEvaluation(
        null,
      );

      /*
       * IMPORTANT:
       * Backend automatically changes
       * RFP status and bid_decision.
       *
       * Refresh both evaluation and RFP
       * data after saving.
       */
      await loadData();
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* ================================================= */
  /* DELETE */
  /* ================================================= */

  async function handleDeleteEvaluation(
    evaluation: BidEvaluation,
  ): Promise<void> {
    const rfp =
      findRfp(
        evaluation.rfp_id,
      );

    const confirmed =
      await confirm(
        `Delete bid evaluation for "${
          rfp?.title ??
          `RFP #${evaluation.rfp_id}`
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBidEvaluation(
        evaluation.id,
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    }
  }

  /* ================================================= */
  /* MODALS */
  /* ================================================= */

  function openCreateForm(): void {
    setEditingEvaluation(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    evaluation: BidEvaluation,
  ): void {
    setEditingEvaluation(
      evaluation,
    );

    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute
      allowedRoles={[
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
      ]}
    >
      <DashboardLayout
        title="Bid Evaluations"
        description="Score RFP opportunities and let the backend determine BID / NO_BID recommendations."
      >
        <div className="space-y-6">

          {/* ================================================= */}
          {/* KPI */}
          {/* ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Evaluations"
              value={evaluations.length.toLocaleString(
                "en-US",
              )}
              description="All RFP bid evaluations"
              icon={BarChart3}
              variant="blue"
            />

            <StatCard
              title="BID"
              value={bidCount.toLocaleString(
                "en-US",
              )}
              description="Backend recommended BID"
              icon={BadgeCheck}
              variant="indigo"
            />

            <StatCard
              title="NO BID"
              value={noBidCount.toLocaleString(
                "en-US",
              )}
              description="Backend recommended NO_BID"
              icon={BriefcaseBusiness}
              variant="cyan"
            />

            <StatCard
              title="Average Score"
              value={averageScore.toFixed(
                1,
              )}
              description="Average backend-calculated score"
              icon={BarChart3}
              variant="emerald"
            />
          </section>

          {/* ================================================= */}
          {/* MAIN */}
          {/* ================================================= */}

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Evaluation Register
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {evaluations.length} evaluation
                    {evaluations.length === 1
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
                      rfps.length === 0 ||
                      users.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Evaluate RFP
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
                (rfps.length === 0 ||
                  users.length === 0) && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      An RFP and an active
                      evaluator are required
                      before creating a bid
                      evaluation.
                    </AlertDescription>
                  </Alert>
                )}

              {/* FILTERS */}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_220px_240px_230px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search RFP, evaluator or comments..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={
                    decisionFilter
                  }
                  onChange={(event) =>
                    setDecisionFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Decisions
                  </option>

                  <option value="BID">
                    Bid
                  </option>

                  <option value="NO_BID">
                    No Bid
                  </option>
                </select>

                <select
                  value={rfpFilter}
                  onChange={(event) =>
                    setRfpFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All RFPs
                  </option>

                  {rfps.map(
                    (rfp) => (
                      <option
                        key={rfp.id}
                        value={rfp.id}
                      >
                        {rfp.rfp_number} -{" "}
                        {rfp.title}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    evaluatorFilter
                  }
                  onChange={(event) =>
                    setEvaluatorFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Evaluators
                  </option>

                  {users.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.full_name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold">
                <span className="text-slate-500">
                  Score legend:
                </span>

                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  75–100 High
                </span>

                <span className="inline-flex items-center gap-2 text-amber-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  50–74 Needs attention
                </span>

                <span className="inline-flex items-center gap-2 text-red-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-700" />
                  Below 50 Low
                </span>
              </div>

              {/* TABLE */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredEvaluations.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <BarChart3 className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No bid evaluations found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1550px] text-left">

                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          RFP
                        </th>

                        <th className="px-4 py-3">
                          Strategic
                        </th>

                        <th className="px-4 py-3">
                          Technical
                        </th>

                        <th className="px-4 py-3">
                          Resources
                        </th>

                        <th className="px-4 py-3">
                          Profitability
                        </th>

                        <th className="px-4 py-3">
                          Win %
                        </th>

                        <th className="px-4 py-3">
                          Overall
                        </th>

                        <th className="px-4 py-3">
                          Recommendation
                        </th>

                        <th className="px-4 py-3">
                          Evaluator
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredEvaluations.map(
                        (evaluation) => {
                          const rfp =
                            findRfp(
                              evaluation.rfp_id,
                            );

                          const evaluator =
                            findUser(
                              evaluation.evaluated_by,
                            );

                          return (
                            <tr
                              key={evaluation.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >

                              {/* RFP */}

                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {rfp?.title ??
                                      `RFP #${evaluation.rfp_id}`}
                                  </p>

                                  {rfp && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {rfp.rfp_number}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* SCORES */}

                              <td className={`px-4 py-4 font-bold ${getScoreClasses(evaluation.strategic_fit_score)}`}>
                                {
                                  evaluation.strategic_fit_score
                                }
                              </td>

                              <td className={`px-4 py-4 font-bold ${getScoreClasses(evaluation.technical_fit_score)}`}>
                                {
                                  evaluation.technical_fit_score
                                }
                              </td>

                              <td className={`px-4 py-4 font-bold ${getScoreClasses(evaluation.resource_availability_score)}`}>
                                {
                                  evaluation.resource_availability_score
                                }
                              </td>

                              <td className={`px-4 py-4 font-bold ${getScoreClasses(evaluation.profitability_score)}`}>
                                {
                                  evaluation.profitability_score
                                }
                              </td>

                              <td className={`px-4 py-4 font-bold ${getScoreClasses(evaluation.win_probability)}`}>
                                {
                                  evaluation.win_probability
                                }
                                %
                              </td>

                              {/* OVERALL */}

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-blue-100">
                                    <div
                                      className={`h-full rounded-full ${getScoreBarClasses(evaluation.overall_score)}`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(
                                            0,
                                            evaluation.overall_score,
                                          ),
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <span className={`font-bold ${getScoreClasses(evaluation.overall_score)}`}>
                                    {evaluation.overall_score.toFixed(
                                      1,
                                    )}
                                  </span>
                                </div>
                              </td>

                              {/* DECISION */}

                              <td className="px-4 py-4">
                                <Badge
                                  className={getRecommendationClasses(
                                    evaluation.recommendation,
                                  )}
                                >
                                  {
                                    evaluation.recommendation
                                  }
                                </Badge>
                              </td>

                              {/* EVALUATOR */}

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <UserRound className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {evaluator?.full_name ??
                                        `User #${evaluation.evaluated_by}`}
                                    </p>

                                    {evaluator && (
                                      <p className="text-xs text-slate-500">
                                        {evaluator.role.display_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* ACTIONS */}

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View evaluation"
                                    onClick={() =>
                                      setViewingEvaluation(
                                        evaluation,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit evaluation"
                                    onClick={() =>
                                      openEditForm(
                                        evaluation,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete evaluation"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteEvaluation(
                                        evaluation,
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

        {/* FORM */}

        {showForm && (
          <EvaluationFormModal
            evaluation={
              editingEvaluation
            }
            rfps={rfps}
            users={users}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);

                setEditingEvaluation(
                  null,
                );
              }
            }}
            onSubmit={
              handleSaveEvaluation
            }
          />
        )}

        {/* DETAILS */}

        {viewingEvaluation && (
          <EvaluationDetailsModal
            evaluation={
              viewingEvaluation
            }
            rfp={findRfp(
              viewingEvaluation.rfp_id,
            )}
            evaluator={findUser(
              viewingEvaluation.evaluated_by,
            )}
            onClose={() =>
              setViewingEvaluation(
                null,
              )
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
