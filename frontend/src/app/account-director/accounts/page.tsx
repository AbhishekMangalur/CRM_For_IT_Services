// contains the frontend code for the account director accounts page
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
  Activity,
  Building2,
  CircleDollarSign,
  Edit3,
  Eye,
  Globe2,
  HeartPulse,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
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
import {
  createAccount,
  deleteAccount,
  getAccounts,
  replaceAccount,
} from "@/lib/account-director-api";
import { getSalesOpportunities } from "@/lib/sales-api";
import { useAuth } from "@/hooks/useAuth";
import type {
  AccountDirectorAccount,
  AccountRiskLevel,
  AccountStatus,
  CreateAccountRequest,
  CustomerHealthStatus,
  SlaStatus,
} from "@/types/account-director";
import type { SalesOpportunity } from "@/types/sales";

interface ClientOption {
  name: string;
  description: string;
  searchText: string;
}

interface ClientComboboxProps {
  clients: ClientOption[];
  value: string;
  onChange: (value: string) => void;
}

function ClientCombobox({
  clients,
  value,
  onChange,
}: ClientComboboxProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredClients = clients.filter(
    (client) =>
      !normalizedQuery ||
      client.searchText.includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="account_client_search">
        Client *
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="account_client_search"
          type="search"
          autoComplete="off"
          required
          value={query}
          placeholder="Search by client, opportunity, industry, or service..."
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="account-client-options"
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
            id="account-client-options"
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  key={client.name}
                  type="button"
                  role="option"
                  aria-selected={value === client.name}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(client.name);
                    onChange(client.name);
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {client.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {client.description}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                No clients match your search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AccountFormState {
  account_name: string;
  industry: string;
  website: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  account_director_id: string;
  annual_revenue: string;
  currency: string;
  customer_health_status: CustomerHealthStatus;
  nps_score: string;
  sla_status: SlaStatus;
  risk_level: AccountRiskLevel;
  account_status: AccountStatus;
}

function createEmptyForm(
  accountDirectorId?: number,
): AccountFormState {
  return {
    account_name: "",
    industry: "",
    website: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    account_director_id:
      accountDirectorId?.toString() ?? "",
    annual_revenue: "",
    currency: "USD",
    customer_health_status: "GREEN",
    nps_score: "",
    sla_status: "ON_TRACK",
    risk_level: "LOW",
    account_status: "ACTIVE",
  };
}

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

function formatDate(value: string): string {
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

function getHealthClasses(
  status: CustomerHealthStatus,
): string {
  switch (status) {
    case "GREEN":
      return "bg-emerald-100 text-emerald-700";

    case "YELLOW":
      return "bg-amber-100 text-amber-700";

    case "RED":
      return "bg-red-100 text-red-700";
  }
}

function getRiskClasses(
  risk: AccountRiskLevel,
): string {
  switch (risk) {
    case "LOW":
      return "bg-emerald-100 text-emerald-700";

    case "MEDIUM":
      return "bg-amber-100 text-amber-700";

    case "HIGH":
      return "bg-red-100 text-red-700";
  }
}

function getAccountStatusClasses(
  status: AccountStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-700";

    case "INACTIVE":
      return "bg-slate-100 text-slate-700";

    case "CHURNED":
      return "bg-red-100 text-red-700";
  }
}

function accountToForm(
  account: AccountDirectorAccount,
): AccountFormState {
  return {
    account_name: account.account_name,
    industry: account.industry,
    website: account.website ?? "",
    primary_contact_name:
      account.primary_contact_name,
    primary_contact_email:
      account.primary_contact_email ?? "",
    primary_contact_phone:
      account.primary_contact_phone ?? "",
    account_director_id:
      account.account_director_id.toString(),
    annual_revenue: account.annual_revenue,
    currency: account.currency,
    customer_health_status:
      account.customer_health_status,
    nps_score:
      account.nps_score?.toString() ?? "",
    sla_status: account.sla_status,
    risk_level: account.risk_level,
    account_status: account.account_status,
  };
}

function formToPayload(
  form: AccountFormState,
): CreateAccountRequest {
  return {
    account_name: form.account_name.trim(),
    industry: form.industry.trim(),
    website: form.website.trim() || null,
    primary_contact_name:
      form.primary_contact_name.trim(),
    primary_contact_email:
      form.primary_contact_email.trim() || null,
    primary_contact_phone:
      form.primary_contact_phone.trim() || null,
    account_director_id: Number(
      form.account_director_id,
    ),
    annual_revenue:
      Number(form.annual_revenue) || 0,
    currency:
      form.currency.trim().toUpperCase() || "USD",
    customer_health_status:
      form.customer_health_status,
    nps_score: form.nps_score.trim()
      ? Number(form.nps_score)
      : null,
    sla_status: form.sla_status,
    risk_level: form.risk_level,
    account_status: form.account_status,
  };
}

interface AccountFormModalProps {
  account: AccountDirectorAccount | null;
  opportunities: SalesOpportunity[];
  currentUserId: number;
  currentUserName: string;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateAccountRequest,
  ) => Promise<void>;
}

function AccountFormModal({
  account,
  opportunities,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AccountFormModalProps) {
  const [form, setForm] =
    useState<AccountFormState>(
      account
        ? accountToForm(account)
        : createEmptyForm(currentUserId),
    );

  const clientsByName = new Map<string, ClientOption>();

  for (const opportunity of opportunities) {
    const name = opportunity.client_name.trim();

    if (!name) {
      continue;
    }

    const existing = clientsByName.get(name.toLowerCase());
    const details = [
      opportunity.opportunity_name,
      opportunity.industry,
      opportunity.service_type,
    ].filter(Boolean);

    clientsByName.set(name.toLowerCase(), {
      name,
      description: existing
        ? Array.from(
            new Set([
              ...existing.description.split(" · "),
              ...details,
            ]),
          ).join(" · ")
        : details.join(" · "),
      searchText: [
        existing?.searchText ?? "",
        name,
        ...details,
      ]
        .join(" ")
        .toLowerCase(),
    });
  }

  if (
    account &&
    !clientsByName.has(account.account_name.toLowerCase())
  ) {
    clientsByName.set(account.account_name.toLowerCase(), {
      name: account.account_name,
      description: account.industry,
      searchText: `${account.account_name} ${account.industry}`.toLowerCase(),
    });
  }

  const clientOptions = Array.from(clientsByName.values()).sort(
    (first, second) => first.name.localeCompare(second.name),
  );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      !form.account_name.trim() ||
      !form.industry.trim() ||
      !form.primary_contact_name.trim() ||
      !form.account_director_id ||
      !form.annual_revenue
    ) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  const isInvalid =
    !form.account_name.trim() ||
    !form.industry.trim() ||
    !form.primary_contact_name.trim() ||
    !form.account_director_id ||
    !form.annual_revenue ||
    Number(form.annual_revenue) < 0 ||
    (form.nps_score !== "" &&
      (Number(form.nps_score) < -100 ||
        Number(form.nps_score) > 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {account
                ? "Edit Account"
                : "Create Account"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {account
                ? "Update customer account information."
                : "Add an active customer account to the CRM."}
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

            <ClientCombobox
              clients={clientOptions}
              value={form.account_name}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  account_name: value,
                }))
              }
            />

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry *
              </Label>

              <Input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="Information Technology"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                Website
              </Label>

              <Input
                id="website"
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_contact_name">
                Primary contact name *
              </Label>

              <Input
                id="primary_contact_name"
                name="primary_contact_name"
                value={form.primary_contact_name}
                onChange={handleChange}
                placeholder="Enter contact name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_contact_email">
                Primary contact email
              </Label>

              <Input
                id="primary_contact_email"
                name="primary_contact_email"
                type="email"
                value={form.primary_contact_email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_contact_phone">
                Primary contact phone
              </Label>

              <Input
                id="primary_contact_phone"
                name="primary_contact_phone"
                value={form.primary_contact_phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_director_name">
                Account Director
              </Label>

              <Input
                id="account_director_name"
                value={currentUserName}
                readOnly
                className="bg-slate-50"
              />

              <p className="text-xs text-slate-500">
                Automatically assigned to the logged-in
                Account Director.
              </p>
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="annual_revenue">
                  Annual revenue *
                </Label>

                <Input
                  id="annual_revenue"
                  name="annual_revenue"
                  type="number"
                  min="0"
                  value={form.annual_revenue}
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
              <Label htmlFor="customer_health_status">
                Customer health
              </Label>

              <select
                id="customer_health_status"
                name="customer_health_status"
                value={form.customer_health_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="GREEN">
                  Green
                </option>
                <option value="YELLOW">
                  Yellow
                </option>
                <option value="RED">
                  Red
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nps_score">
                NPS score
              </Label>

              <Input
                id="nps_score"
                name="nps_score"
                type="number"
                min="-100"
                max="100"
                value={form.nps_score}
                onChange={handleChange}
                placeholder="75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_status">
                SLA status
              </Label>

              <select
                id="sla_status"
                name="sla_status"
                value={form.sla_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="ON_TRACK">
                  On Track
                </option>
                <option value="AT_RISK">
                  At Risk
                </option>
                <option value="BREACHED">
                  Breached
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_level">
                Risk level
              </Label>

              <select
                id="risk_level"
                name="risk_level"
                value={form.risk_level}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">
                  Medium
                </option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_status">
                Account status
              </Label>

              <select
                id="account_status"
                name="account_status"
                value={form.account_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="ACTIVE">
                  Active
                </option>
                <option value="INACTIVE">
                  Inactive
                </option>
                <option value="CHURNED">
                  Churned
                </option>
              </select>
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

              {account
                ? "Save changes"
                : "Create account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AccountDetailsModalProps {
  account: AccountDirectorAccount;
  onClose: () => void;
}

function AccountDetailsModal({
  account,
  onClose,
}: AccountDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {account.account_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Account #{account.id}
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
              Annual revenue
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                account.annual_revenue,
                account.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              NPS score
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {account.nps_score ?? "—"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Industry
            </p>

            <p className="mt-1 font-semibold">
              {account.industry}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Account Director ID
            </p>

            <p className="mt-1 font-semibold">
              {account.account_director_id}
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              {account.primary_contact_name}
            </p>

            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              {account.primary_contact_email ||
                "No email"}
            </p>

            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              {account.primary_contact_phone ||
                "No phone"}
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p>
              Health:{" "}
              <strong>
                {formatLabel(
                  account.customer_health_status,
                )}
              </strong>
            </p>

            <p>
              Risk:{" "}
              <strong>
                {formatLabel(account.risk_level)}
              </strong>
            </p>

            <p>
              SLA:{" "}
              <strong>
                {formatLabel(account.sla_status)}
              </strong>
            </p>
          </div>

          {account.website && (
            <div className="sm:col-span-2">
              <a
                href={account.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <Globe2 className="h-4 w-4" />
                Open account website
              </a>
            </div>
          )}

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-medium">
              {formatDate(account.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountDirectorAccountsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<
    AccountDirectorAccount[]
  >([]);
  const [opportunities, setOpportunities] = useState<
    SalesOpportunity[]
  >([]);

  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] =
    useState("ALL");
  const [riskFilter, setRiskFilter] =
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

  const [editingAccount, setEditingAccount] =
    useState<AccountDirectorAccount | null>(null);

  const [viewingAccount, setViewingAccount] =
    useState<AccountDirectorAccount | null>(null);

  const loadAccounts =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [records, opportunityRecords] = await Promise.all([
          getAccounts({
            skip: 0,
            limit: 100,
          }),
          getSalesOpportunities({
            skip: 0,
            limit: 500,
          }),
        ]);

        setAccounts(records);
        setOpportunities(opportunityRecords);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAccounts]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !normalizedSearch ||
        account.account_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        account.industry
          .toLowerCase()
          .includes(normalizedSearch) ||
        account.primary_contact_name
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesHealth =
        healthFilter === "ALL" ||
        account.customer_health_status ===
          healthFilter;

      const matchesRisk =
        riskFilter === "ALL" ||
        account.risk_level === riskFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        account.account_status === statusFilter;

      return (
        matchesSearch &&
        matchesHealth &&
        matchesRisk &&
        matchesStatus
      );
    });
  }, [
    accounts,
    healthFilter,
    riskFilter,
    search,
    statusFilter,
  ]);

  const activeAccounts = accounts.filter(
    (account) =>
      account.account_status === "ACTIVE",
  ).length;

  const healthyAccounts = accounts.filter(
    (account) =>
      account.customer_health_status === "GREEN",
  ).length;

  const atRiskAccounts = accounts.filter(
    (account) =>
      account.risk_level === "HIGH" ||
      account.customer_health_status === "RED",
  ).length;

  const totalRevenue = accounts.reduce(
    (total, account) =>
      total +
      (Number(account.annual_revenue) || 0),
    0,
  );

  async function handleSaveAccount(
    payload: CreateAccountRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingAccount) {
        const updated = await replaceAccount(
          editingAccount.id,
          payload,
        );

        setAccounts((current) =>
          current.map((account) =>
            account.id === updated.id
              ? updated
              : account,
          ),
        );
      } else {
        const created =
          await createAccount(payload);

        setAccounts((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingAccount(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount(
    account: AccountDirectorAccount,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete account "${account.account_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAccount(account.id);

      setAccounts((current) =>
        current.filter(
          (record) => record.id !== account.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function openCreateForm(): void {
    setEditingAccount(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    account: AccountDirectorAccount,
  ): void {
    setEditingAccount(account);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="ACCOUNT_DIRECTOR">
      <DashboardLayout
        title="Accounts"
        description="Manage existing customers, health, SLA and retention risk."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Accounts"
              value={activeAccounts.toLocaleString(
                "en-US",
              )}
              description="Currently active customer accounts"
              icon={Building2}
              variant="blue"
            />

            <StatCard
              title="Healthy Accounts"
              value={healthyAccounts.toLocaleString(
                "en-US",
              )}
              description="Accounts with green customer health"
              icon={HeartPulse}
              variant="indigo"
            />

            <StatCard
              title="Annual Revenue"
              value={formatCurrency(totalRevenue)}
              description="Combined annual account revenue"
              icon={CircleDollarSign}
              variant="cyan"
            />

            <StatCard
              title="At-Risk Accounts"
              value={atRiskAccounts.toLocaleString(
                "en-US",
              )}
              description="High-risk or red-health accounts"
              icon={ShieldAlert}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Customer Accounts
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {accounts.length} account
                    {accounts.length === 1 ? "" : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadAccounts()
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
                    disabled={!user}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
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

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_180px_170px_180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search account, industry or contact..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={healthFilter}
                  onChange={(event) =>
                    setHealthFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All health
                  </option>
                  <option value="GREEN">
                    Green
                  </option>
                  <option value="YELLOW">
                    Yellow
                  </option>
                  <option value="RED">Red</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(event) =>
                    setRiskFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All risks
                  </option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">
                    Medium
                  </option>
                  <option value="HIGH">
                    High
                  </option>
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
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="INACTIVE">
                    Inactive
                  </option>
                  <option value="CHURNED">
                    Churned
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Building2 className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No accounts found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an account or change the
                    filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1350px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Account
                        </th>
                        <th className="px-4 py-3">
                          Primary Contact
                        </th>
                        <th className="px-4 py-3">
                          Revenue
                        </th>
                        <th className="px-4 py-3">
                          Health
                        </th>
                        <th className="px-4 py-3">
                          NPS
                        </th>
                        <th className="px-4 py-3">
                          SLA
                        </th>
                        <th className="px-4 py-3">
                          Risk
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredAccounts.map(
                        (account) => (
                          <tr
                            key={account.id}
                            className="bg-white transition hover:bg-blue-50/50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                  <Building2 className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {account.account_name}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {account.industry}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-700">
                                {
                                  account.primary_contact_name
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {account.primary_contact_email ||
                                  "No email"}
                              </p>
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {formatCurrency(
                                account.annual_revenue,
                                account.currency,
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getHealthClasses(
                                  account.customer_health_status,
                                )}
                              >
                                {formatLabel(
                                  account.customer_health_status,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              {account.nps_score ?? "—"}
                            </td>

                            <td className="px-4 py-4">
                              <span className="flex items-center gap-2 text-sm text-slate-600">
                                <Activity className="h-4 w-4 text-indigo-600" />
                                {formatLabel(
                                  account.sla_status,
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getRiskClasses(
                                  account.risk_level,
                                )}
                              >
                                {formatLabel(
                                  account.risk_level,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getAccountStatusClasses(
                                  account.account_status,
                                )}
                              >
                                {formatLabel(
                                  account.account_status,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View account"
                                  onClick={() =>
                                    setViewingAccount(
                                      account,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit account"
                                  onClick={() =>
                                    openEditForm(account)
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete account"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteAccount(
                                      account,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
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
        </div>

        {showForm && user && (
          <AccountFormModal
            account={editingAccount}
            opportunities={opportunities}
            currentUserId={user.id}
            currentUserName={user.full_name}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingAccount(null);
              }
            }}
            onSubmit={handleSaveAccount}
          />
        )}

        {viewingAccount && (
          <AccountDetailsModal
            account={viewingAccount}
            onClose={() =>
              setViewingAccount(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
