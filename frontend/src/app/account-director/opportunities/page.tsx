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
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Target,
  Trash2,
  TrendingUp,
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
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import {
  createAccountOpportunity,
  deleteAccountOpportunity,
  getAccountOpportunities,
  getAccounts,
  replaceAccountOpportunity,
} from "@/lib/account-director-api";
import type {
  AccountDirectorAccount,
  AccountExpansionOpportunity,
  AccountOpportunityStatus,
  CreateAccountOpportunityRequest,
} from "@/types/account-director";

interface OpportunityCreatorUser {
  id: number;
  full_name: string;
}

async function getOpportunityCreators(): Promise<
  OpportunityCreatorUser[]
> {
  const response = await api.get<OpportunityCreatorUser[]>("/api/users");
  return response.data;
}

interface OpportunityFormState {
  account_id: string;
  opportunity_name: string;
  service_type: string;
  estimated_value: string;
  currency: string;
  probability: string;
  expected_close_date: string;
  status: AccountOpportunityStatus;
  notes: string;
}

interface AccountComboboxProps {
  accounts: AccountDirectorAccount[];
  value: string;
  onChange: (value: string) => void;
}

function AccountCombobox({
  accounts,
  value,
  onChange,
}: AccountComboboxProps) {
  const selectedAccount = accounts.find(
    (account) => account.id.toString() === value,
  );
  const [query, setQuery] = useState(
    selectedAccount?.account_name ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredAccounts = accounts.filter(
    (account) =>
      !normalizedQuery ||
      [
        account.account_name,
        account.industry,
        account.primary_contact_name,
        account.primary_contact_email ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="expansion_account_search">
        Account *
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="expansion_account_search"
          type="search"
          autoComplete="off"
          required
          value={query}
          placeholder="Search by account, industry, or contact..."
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="expansion-account-options"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setIsOpen(true);
          }}
        />

        {isOpen && (
          <div
            id="expansion-account-options"
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  role="option"
                  aria-selected={value === account.id.toString()}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(account.account_name);
                    onChange(account.id.toString());
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {account.account_name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {account.industry} · {account.primary_contact_name}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                No accounts match your search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: OpportunityFormState = {
  account_id: "",
  opportunity_name: "",
  service_type: "",
  estimated_value: "",
  currency: "USD",
  probability: "0",
  expected_close_date: "",
  status: "OPEN",
  notes: "",
};

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

function formatDate(value: string | null): string {
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

function getErrorMessage(error: unknown): string {
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

function getStatusClasses(status: string): string {
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

function opportunityToForm(
  opportunity: AccountExpansionOpportunity,
): OpportunityFormState {
  return {
    account_id: opportunity.account_id.toString(),
    opportunity_name:
      opportunity.opportunity_name,
    service_type: opportunity.service_type,
    estimated_value: opportunity.estimated_value,
    currency: opportunity.currency,
    probability: opportunity.probability.toString(),
    expected_close_date:
      opportunity.expected_close_date ?? "",
    status: opportunity.status,
    notes: opportunity.notes ?? "",
  };
}

function formToPayload(
  form: OpportunityFormState,
  userId: number,
): CreateAccountOpportunityRequest {
  return {
    account_id: Number(form.account_id),
    opportunity_name:
      form.opportunity_name.trim(),
    service_type: form.service_type.trim(),
    estimated_value: Number(
      form.estimated_value,
    ),
    currency:
      form.currency.trim().toUpperCase() || "USD",
    probability: Number(form.probability),
    expected_close_date:
      form.expected_close_date || null,
    status: form.status,
    created_by: userId,
    notes: form.notes.trim() || null,
  };
}

interface OpportunityFormModalProps {
  opportunity: AccountExpansionOpportunity | null;
  accounts: AccountDirectorAccount[];
  currentUserId: number;
  currentUserName: string;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateAccountOpportunityRequest,
  ) => Promise<void>;
}

function OpportunityFormModal({
  opportunity,
  accounts,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: OpportunityFormModalProps) {
  const [form, setForm] =
    useState<OpportunityFormState>(
      opportunity
        ? opportunityToForm(opportunity)
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
    !form.account_id ||
    !form.opportunity_name.trim() ||
    !form.service_type.trim() ||
    !form.estimated_value ||
    Number(form.estimated_value) <= 0 ||
    Number(form.probability) < 0 ||
    Number(form.probability) > 100;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(
      formToPayload(form, currentUserId),
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {opportunity
                ? "Edit Expansion Opportunity"
                : "Create Expansion Opportunity"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add an upsell or cross-sell opportunity for
              an existing account.
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

            <AccountCombobox
              accounts={accounts}
              value={form.account_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  account_id: value,
                }))
              }
            />

            <div className="space-y-2">
              <Label htmlFor="opportunity_name">
                Opportunity name *
              </Label>

              <Input
                id="opportunity_name"
                name="opportunity_name"
                value={form.opportunity_name}
                onChange={handleChange}
                placeholder="Managed Cloud Support Expansion"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">
                Service type *
              </Label>

              <Input
                id="service_type"
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                placeholder="Managed Cloud Services"
                required
              />
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">
                  Estimated value *
                </Label>

                <Input
                  id="estimated_value"
                  name="estimated_value"
                  type="number"
                  min="1"
                  value={form.estimated_value}
                  onChange={handleChange}
                  placeholder="1000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency
                </Label>

                <Input
                  id="currency"
                  name="currency"
                  maxLength={3}
                  value={form.currency}
                  onChange={handleChange}
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">
                Probability (%)
              </Label>

              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={handleChange}
              />

              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(form.probability) || 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Opportunity status
              </Label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="OPEN">Open</option>
                <option value="NEGOTIATION">
                  Negotiation
                </option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">
                Expected close date
              </Label>

              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                value={form.expected_close_date}
                onChange={handleChange}
              />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-medium text-slate-800">
                Created by
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {currentUserName}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">
                Notes
              </Label>

              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter customer interest, expected scope, and next steps..."
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
              disabled={isSaving || isInvalid}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {opportunity
                ? "Save changes"
                : "Create opportunity"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OpportunityDetailsModalProps {
  opportunity: AccountExpansionOpportunity;
  account?: AccountDirectorAccount;
  creatorName: string;
  onClose: () => void;
}

function OpportunityDetailsModal({
  opportunity,
  account,
  creatorName,
  onClose,
}: OpportunityDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {opportunity.opportunity_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Expansion Opportunity #{opportunity.id}
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
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Estimated value
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                opportunity.estimated_value,
                opportunity.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Probability
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {opportunity.probability}%
            </p>

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

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Account
            </p>

            <p className="mt-1 font-semibold">
              {account?.account_name ??
                `Account #${opportunity.account_id}`}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Service type
            </p>

            <p className="mt-1 font-semibold">
              {opportunity.service_type}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-2 ${getStatusClasses(
                opportunity.status,
              )}`}
            >
              {formatLabel(opportunity.status)}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Expected close
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                opportunity.expected_close_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created by
            </p>

            <p className="mt-1 font-semibold">
              {creatorName}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created at
            </p>

            <p className="mt-1 font-medium">
              {formatDate(opportunity.created_at)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-sm font-medium text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {opportunity.notes ||
                "No notes were added."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountDirectorOpportunitiesPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [opportunities, setOpportunities] =
    useState<AccountExpansionOpportunity[]>([]);

  const [accounts, setAccounts] = useState<
    AccountDirectorAccount[]
  >([]);
  const [creatorUsers, setCreatorUsers] = useState<
    OpportunityCreatorUser[]
  >([]);

  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingOpportunity, setEditingOpportunity] =
    useState<AccountExpansionOpportunity | null>(
      null,
    );

  const [viewingOpportunity, setViewingOpportunity] =
    useState<AccountExpansionOpportunity | null>(
      null,
    );

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          opportunityRecords,
          accountRecords,
          userRecords,
        ] = await Promise.all([
          getAccountOpportunities({
            skip: 0,
            limit: 100,
          }),
          getAccounts({
            skip: 0,
            limit: 100,
          }),
          getOpportunityCreators(),
        ]);

        setOpportunities(opportunityRecords);
        setAccounts(accountRecords);
        setCreatorUsers(userRecords);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  function findCreatorName(creatorId: number): string {
    return (
      creatorUsers.find((record) => record.id === creatorId)
        ?.full_name ?? "Unknown user"
    );
  }

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return opportunities.filter(
      (opportunity) => {
        const account = accounts.find(
          (item) =>
            item.id === opportunity.account_id,
        );

        const matchesSearch =
          !normalizedSearch ||
          opportunity.opportunity_name
            .toLowerCase()
            .includes(normalizedSearch) ||
          opportunity.service_type
            .toLowerCase()
            .includes(normalizedSearch) ||
          account?.account_name
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesAccount =
          accountFilter === "ALL" ||
          opportunity.account_id ===
            Number(accountFilter);

        const matchesStatus =
          statusFilter === "ALL" ||
          opportunity.status === statusFilter;

        return (
          matchesSearch &&
          matchesAccount &&
          matchesStatus
        );
      },
    );
  }, [
    accountFilter,
    accounts,
    opportunities,
    search,
    statusFilter,
  ]);

  const openOpportunities = opportunities.filter(
    (opportunity) =>
      ["OPEN", "NEGOTIATION"].includes(
        opportunity.status.toUpperCase(),
      ),
  );

  const totalPipelineValue =
    openOpportunities.reduce(
      (total, opportunity) =>
        total +
        (Number(opportunity.estimated_value) || 0),
      0,
    );

  const weightedPipelineValue =
    openOpportunities.reduce(
      (total, opportunity) =>
        total +
        (Number(opportunity.estimated_value) || 0) *
          (opportunity.probability / 100),
      0,
    );

  const wonOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.status.toUpperCase() === "WON",
  ).length;

  const averageProbability =
    openOpportunities.length > 0
      ? openOpportunities.reduce(
          (total, opportunity) =>
            total + opportunity.probability,
          0,
        ) / openOpportunities.length
      : 0;

  async function handleSaveOpportunity(
    payload: CreateAccountOpportunityRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingOpportunity) {
        const updated =
          await replaceAccountOpportunity(
            editingOpportunity.id,
            payload,
          );

        setOpportunities((current) =>
          current.map((opportunity) =>
            opportunity.id === updated.id
              ? updated
              : opportunity,
          ),
        );
      } else {
        const created =
          await createAccountOpportunity(payload);

        setOpportunities((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingOpportunity(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOpportunity(
    opportunity: AccountExpansionOpportunity,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete opportunity "${opportunity.opportunity_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAccountOpportunity(
        opportunity.id,
      );

      setOpportunities((current) =>
        current.filter(
          (item) => item.id !== opportunity.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function findAccount(
    accountId: number,
  ): AccountDirectorAccount | undefined {
    return accounts.find(
      (account) => account.id === accountId,
    );
  }

  function openCreateForm(): void {
    setEditingOpportunity(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    opportunity: AccountExpansionOpportunity,
  ): void {
    setEditingOpportunity(opportunity);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="ACCOUNT_DIRECTOR">
      <DashboardLayout
        title="Expansion Opportunities"
        description="Track upsell and cross-sell opportunities for existing customers."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Open Opportunities"
              value={openOpportunities.length.toLocaleString(
                "en-US",
              )}
              description="Open and negotiation opportunities"
              icon={BriefcaseBusiness}
              variant="blue"
            />

            <StatCard
              title="Expansion Pipeline"
              value={formatCurrency(
                totalPipelineValue,
              )}
              description="Total estimated open opportunity value"
              icon={CircleDollarSign}
              variant="indigo"
            />

            <StatCard
              title="Weighted Pipeline"
              value={formatCurrency(
                weightedPipelineValue,
              )}
              description="Probability-adjusted pipeline value"
              icon={TrendingUp}
              variant="cyan"
            />

            <StatCard
              title="Won Opportunities"
              value={wonOpportunities.toLocaleString(
                "en-US",
              )}
              description={`Average open probability ${averageProbability.toFixed(
                1,
              )}%`}
              icon={Target}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Account Expansion Pipeline
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {opportunities.length} opportunity
                    {opportunities.length === 1
                      ? ""
                      : "ies"}{" "}
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
                      !user || accounts.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Opportunity
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
                accounts.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Create an account before adding an
                      expansion opportunity.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_250px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search opportunity, account, or service..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={accountFilter}
                  onChange={(event) =>
                    setAccountFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All accounts
                  </option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.account_name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All statuses
                  </option>
                  <option value="OPEN">Open</option>
                  <option value="NEGOTIATION">
                    Negotiation
                  </option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredOpportunities.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <BriefcaseBusiness className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No expansion opportunities found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an opportunity or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1250px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Opportunity
                        </th>
                        <th className="px-4 py-3">
                          Account
                        </th>
                        <th className="px-4 py-3">
                          Service
                        </th>
                        <th className="px-4 py-3">
                          Estimated Value
                        </th>
                        <th className="px-4 py-3">
                          Probability
                        </th>
                        <th className="px-4 py-3">
                          Expected Close
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3">
                          Created By
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredOpportunities.map(
                        (opportunity) => {
                          const account = findAccount(
                            opportunity.account_id,
                          );

                          return (
                            <tr
                              key={opportunity.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <BriefcaseBusiness className="h-4 w-4" />
                                  </div>

                                  <p className="font-semibold text-slate-800">
                                    {
                                      opportunity.opportunity_name
                                    }
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-indigo-600" />

                                  <p className="font-medium text-slate-700">
                                    {account?.account_name ??
                                      `Account #${opportunity.account_id}`}
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {opportunity.service_type}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-800">
                                {formatCurrency(
                                  opportunity.estimated_value,
                                  opportunity.currency,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="w-28">
                                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                                    <span>
                                      {
                                        opportunity.probability
                                      }
                                      %
                                    </span>
                                  </div>

                                  <div className="h-2 overflow-hidden rounded-full bg-blue-100">
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
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarDays className="h-4 w-4 text-blue-600" />

                                  {formatDate(
                                    opportunity.expected_close_date,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getStatusClasses(
                                    opportunity.status,
                                  )}
                                >
                                  {formatLabel(
                                    opportunity.status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <UserRound className="h-4 w-4 text-indigo-600" />
                                  {findCreatorName(
                                    opportunity.created_by,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View opportunity"
                                    onClick={() =>
                                      setViewingOpportunity(
                                        opportunity,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit opportunity"
                                    onClick={() =>
                                      openEditForm(
                                        opportunity,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete opportunity"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteOpportunity(
                                        opportunity,
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

        {showForm && user && (
          <OpportunityFormModal
            opportunity={editingOpportunity}
            accounts={accounts}
            currentUserId={user.id}
            currentUserName={user.full_name}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingOpportunity(null);
              }
            }}
            onSubmit={handleSaveOpportunity}
          />
        )}

        {viewingOpportunity && (
          <OpportunityDetailsModal
            opportunity={viewingOpportunity}
            account={findAccount(
              viewingOpportunity.account_id,
            )}
            creatorName={findCreatorName(
              viewingOpportunity.created_by,
            )}
            onClose={() =>
              setViewingOpportunity(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
