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
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
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
import { formatNumberInputValue } from "@/lib/utils";
import {
  createContract,
  deleteContract,
  getAccounts,
  getContracts,
  replaceContract,
} from "@/lib/account-director-api";
import type {
  AccountContract,
  AccountDirectorAccount,
  ContractStatus,
  CreateContractRequest,
  RenewalStatus,
} from "@/types/account-director";

interface ContractFormState {
  account_id: string;
  contract_number: string;
  contract_type: string;
  contract_value: string;
  currency: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  renewal_status: RenewalStatus;
  contract_status: ContractStatus;
  document_url: string;
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
      <Label htmlFor="contract_account_search">
        Account *
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="contract_account_search"
          type="search"
          autoComplete="off"
          required
          value={query}
          placeholder="Search by account, industry, or contact..."
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="contract-account-options"
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
            id="contract-account-options"
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

const EMPTY_FORM: ContractFormState = {
  account_id: "",
  contract_number: "",
  contract_type: "MASTER_SERVICE_AGREEMENT",
  contract_value: "",
  currency: "USD",
  start_date: "",
  end_date: "",
  renewal_date: "",
  renewal_status: "NOT_DUE",
  contract_status: "ACTIVE",
  document_url: "",
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

function getRenewalClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "RENEWED":
      return "bg-emerald-100 text-emerald-700";

    case "DUE":
      return "bg-red-100 text-red-700";

    case "UPCOMING":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getContractStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "EXPIRING":
      return "bg-amber-100 text-amber-700";

    case "EXPIRED":
    case "TERMINATED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function contractToForm(
  contract: AccountContract,
): ContractFormState {
  return {
    account_id: contract.account_id.toString(),
    contract_number: contract.contract_number,
    contract_type: contract.contract_type,
    contract_value: formatNumberInputValue(contract.contract_value),
    currency: contract.currency,
    start_date: contract.start_date,
    end_date: contract.end_date,
    renewal_date: contract.renewal_date ?? "",
    renewal_status: contract.renewal_status,
    contract_status: contract.contract_status,
    document_url: contract.document_url ?? "",
  };
}

function formToPayload(
  form: ContractFormState,
): CreateContractRequest {
  return {
    account_id: Number(form.account_id),
    contract_number: form.contract_number.trim(),
    contract_type: form.contract_type.trim(),
    contract_value: Number(form.contract_value),
    currency: form.currency.trim().toUpperCase(),
    start_date: form.start_date,
    end_date: form.end_date,
    renewal_date: form.renewal_date || null,
    renewal_status: form.renewal_status,
    contract_status: form.contract_status,
    document_url: form.document_url.trim() || null,
  };
}

interface ContractFormModalProps {
  contract: AccountContract | null;
  accounts: AccountDirectorAccount[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateContractRequest,
  ) => Promise<void>;
}

function ContractFormModal({
  contract,
  accounts,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ContractFormModalProps) {
  const [form, setForm] =
    useState<ContractFormState>(
      contract
        ? contractToForm(contract)
        : EMPTY_FORM,
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

  function handleAccountChange(accountId: string): void {
    const selectedAccount = accounts.find(
      (account) => account.id.toString() === accountId,
    );

    setForm((previous) => ({
      ...previous,
      account_id: accountId,
      contract_value: formatNumberInputValue(selectedAccount?.annual_revenue),
      currency: selectedAccount?.currency || "USD",
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      !form.account_id ||
      !form.contract_number.trim() ||
      !form.contract_type.trim() ||
      !form.contract_value ||
      !form.start_date ||
      !form.end_date
    ) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  const invalidDates =
    Boolean(form.start_date) &&
    Boolean(form.end_date) &&
    new Date(form.end_date).getTime() <
      new Date(form.start_date).getTime();

  const isInvalid =
    !form.account_id ||
    !form.contract_number.trim() ||
    !form.contract_type.trim() ||
    !form.contract_value ||
    Number(form.contract_value) <= 0 ||
    !form.start_date ||
    !form.end_date ||
    invalidDates;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {contract
                ? "Edit Contract"
                : "Create Contract"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add contract dates, value, status, and
              renewal information.
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

            {invalidDates && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  End date cannot be before the start
                  date.
                </AlertDescription>
              </Alert>
            )}

            <AccountCombobox
              accounts={accounts}
              value={form.account_id}
              onChange={handleAccountChange}
            />

            <div className="space-y-2">
              <Label htmlFor="contract_number">
                Contract number *
              </Label>

              <Input
                id="contract_number"
                name="contract_number"
                value={form.contract_number}
                onChange={handleChange}
                placeholder="CNT-ABC-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">
                Contract type *
              </Label>

              <select
                id="contract_type"
                name="contract_type"
                value={form.contract_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="MASTER_SERVICE_AGREEMENT">
                  Master Service Agreement
                </option>
                <option value="STATEMENT_OF_WORK">
                  Statement of Work
                </option>
                <option value="PURCHASE_ORDER">
                  Purchase Order
                </option>
                <option value="RETAINER">
                  Retainer
                </option>
                <option value="SUPPORT_CONTRACT">
                  Support Contract
                </option>
              </select>
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="contract_value">
                  Contract value *
                </Label>

                <Input
                  id="contract_value"
                  name="contract_value"
                  type="number"
                  min="1"
                  value={form.contract_value}
                  onChange={handleChange}
                  placeholder="0"
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
              <Label htmlFor="start_date">
                Start date *
              </Label>

              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">
                End date *
              </Label>

              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_date">
                Renewal date
              </Label>

              <Input
                id="renewal_date"
                name="renewal_date"
                type="date"
                value={form.renewal_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renewal_status">
                Renewal status
              </Label>

              <select
                id="renewal_status"
                name="renewal_status"
                value={form.renewal_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="NOT_DUE">
                  Not Due
                </option>
                <option value="UPCOMING">
                  Upcoming
                </option>
                <option value="DUE">
                  Due
                </option>
                <option value="RENEWED">
                  Renewed
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_status">
                Contract status
              </Label>

              <select
                id="contract_status"
                name="contract_status"
                value={form.contract_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="ACTIVE">
                  Active
                </option>
                <option value="EXPIRING">
                  Expiring
                </option>
                <option value="EXPIRED">
                  Expired
                </option>
                <option value="TERMINATED">
                  Terminated
                </option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="document_url">
                Contract document URL
              </Label>

              <Input
                id="document_url"
                name="document_url"
                type="url"
                value={form.document_url}
                onChange={handleChange}
                placeholder="https://example.com/contracts/contract.pdf"
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

              {contract
                ? "Save changes"
                : "Create contract"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ContractDetailsModalProps {
  contract: AccountContract;
  account?: AccountDirectorAccount;
  onClose: () => void;
}

function ContractDetailsModal({
  contract,
  account,
  onClose,
}: ContractDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {contract.contract_number}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contract #{contract.id}
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
              Contract value
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                contract.contract_value,
                contract.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Account
            </p>

            <p className="mt-2 text-xl font-bold text-indigo-700">
              {account?.account_name ??
                `Account #${contract.account_id}`}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Contract type
            </p>

            <p className="mt-1 font-semibold">
              {formatLabel(contract.contract_type)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Contract status
            </p>

            <Badge
              className={`mt-2 ${getContractStatusClasses(
                contract.contract_status,
              )}`}
            >
              {formatLabel(
                contract.contract_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Start date
            </p>

            <p className="mt-1 font-medium">
              {formatDate(contract.start_date)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              End date
            </p>

            <p className="mt-1 font-medium">
              {formatDate(contract.end_date)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Renewal date
            </p>

            <p className="mt-1 font-medium">
              {formatDate(contract.renewal_date)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Renewal status
            </p>

            <Badge
              className={`mt-2 ${getRenewalClasses(
                contract.renewal_status,
              )}`}
            >
              {formatLabel(
                contract.renewal_status,
              )}
            </Badge>
          </div>

          {contract.document_url && (
            <div className="sm:col-span-2">
              <a
                href={contract.document_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <ExternalLink className="h-4 w-4" />
                Open contract document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountDirectorContractsPage() {
  const confirm = useConfirm();
  const [contracts, setContracts] = useState<
    AccountContract[]
  >([]);

  const [accounts, setAccounts] = useState<
    AccountDirectorAccount[]
  >([]);

  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] =
    useState("ALL");
  const [renewalFilter, setRenewalFilter] =
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

  const [editingContract, setEditingContract] =
    useState<AccountContract | null>(null);

  const [viewingContract, setViewingContract] =
    useState<AccountContract | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [contractRecords, accountRecords] =
          await Promise.all([
            getContracts({
              skip: 0,
              limit: 100,
            }),
            getAccounts({
              skip: 0,
              limit: 100,
            }),
          ]);

        setContracts(contractRecords);
        setAccounts(accountRecords);
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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const contractId = Number(
      new URLSearchParams(window.location.search).get("view"),
    );

    if (!Number.isInteger(contractId) || contractId <= 0) {
      return;
    }

    const requestedContract = contracts.find(
      (contract) => contract.id === contractId,
    );

    const timeoutId = window.setTimeout(() => {
      if (requestedContract) {
        setViewingContract(requestedContract);
      } else {
        setError(`Contract #${contractId} was not found.`);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [contracts, isLoading]);

  const filteredContracts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return contracts.filter((contract) => {
      const account = accounts.find(
        (record) =>
          record.id === contract.account_id,
      );

      const matchesSearch =
        !normalizedSearch ||
        contract.contract_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        contract.contract_type
          .toLowerCase()
          .includes(normalizedSearch) ||
        account?.account_name
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesAccount =
        accountFilter === "ALL" ||
        contract.account_id ===
          Number(accountFilter);

      const matchesRenewal =
        renewalFilter === "ALL" ||
        contract.renewal_status ===
          renewalFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        contract.contract_status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesAccount &&
        matchesRenewal &&
        matchesStatus
      );
    });
  }, [
    accountFilter,
    accounts,
    contracts,
    renewalFilter,
    search,
    statusFilter,
  ]);

  const today = new Date();
  const thirtyDaysFromNow = new Date();

  thirtyDaysFromNow.setDate(
    today.getDate() + 30,
  );

  const activeContracts = contracts.filter(
    (contract) =>
      contract.contract_status.toUpperCase() ===
      "ACTIVE",
  ).length;

  const expiringSoon = contracts.filter(
    (contract) => {
      const endDate = new Date(contract.end_date);

      return (
        Number.isFinite(endDate.getTime()) &&
        endDate >= today &&
        endDate <= thirtyDaysFromNow
      );
    },
  ).length;

  const dueForRenewal = contracts.filter(
    (contract) =>
      contract.renewal_status.toUpperCase() ===
        "DUE" ||
      contract.renewal_status.toUpperCase() ===
        "UPCOMING",
  ).length;

  const totalContractValue = contracts.reduce(
    (total, contract) =>
      total +
      (Number(contract.contract_value) || 0),
    0,
  );

  async function handleSaveContract(
    payload: CreateContractRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingContract) {
        const updated = await replaceContract(
          editingContract.id,
          payload,
        );

        setContracts((current) =>
          current.map((contract) =>
            contract.id === updated.id
              ? updated
              : contract,
          ),
        );
      } else {
        const created =
          await createContract(payload);

        setContracts((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingContract(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteContract(
    contract: AccountContract,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete contract "${contract.contract_number}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteContract(contract.id);

      setContracts((current) =>
        current.filter(
          (record) =>
            record.id !== contract.id,
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
    setEditingContract(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    contract: AccountContract,
  ): void {
    setEditingContract(contract);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="ACCOUNT_DIRECTOR">
      <DashboardLayout
        title="Contracts"
        description="Manage customer contracts, expiry dates and renewals."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Contracts"
              value={activeContracts.toLocaleString(
                "en-US",
              )}
              description="Contracts currently active"
              icon={FileCheck2}
              variant="blue"
            />

            <StatCard
              title="Expiring in 30 Days"
              value={expiringSoon.toLocaleString(
                "en-US",
              )}
              description="Contracts nearing their end date"
              icon={CalendarDays}
              variant="indigo"
            />

            <StatCard
              title="Due for Renewal"
              value={dueForRenewal.toLocaleString(
                "en-US",
              )}
              description="Upcoming or due renewals"
              icon={CalendarClock}
              variant="cyan"
            />

            <StatCard
              title="Total Contract Value"
              value={formatCurrency(
                totalContractValue,
              )}
              description="Combined value of all contracts"
              icon={CircleDollarSign}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Customer Contracts
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {contracts.length} contract
                    {contracts.length === 1
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
                    disabled={accounts.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Contract
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
                      Create an account before adding a
                      contract.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_230px_190px_190px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search contract number, account, or type..."
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
                  value={renewalFilter}
                  onChange={(event) =>
                    setRenewalFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All renewals
                  </option>
                  <option value="NOT_DUE">
                    Not Due
                  </option>
                  <option value="UPCOMING">
                    Upcoming
                  </option>
                  <option value="DUE">Due</option>
                  <option value="RENEWED">
                    Renewed
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
                  <option value="EXPIRING">
                    Expiring
                  </option>
                  <option value="EXPIRED">
                    Expired
                  </option>
                  <option value="TERMINATED">
                    Terminated
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredContracts.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <FileText className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No contracts found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a contract or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1350px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Contract
                        </th>
                        <th className="px-4 py-3">
                          Account
                        </th>
                        <th className="px-4 py-3">
                          Type
                        </th>
                        <th className="px-4 py-3">
                          Value
                        </th>
                        <th className="px-4 py-3">
                          Start Date
                        </th>
                        <th className="px-4 py-3">
                          End Date
                        </th>
                        <th className="px-4 py-3">
                          Renewal
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
                      {filteredContracts.map(
                        (contract) => {
                          const account = findAccount(
                            contract.account_id,
                          );

                          return (
                            <tr
                              key={contract.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <p className="font-semibold text-slate-800">
                                    {
                                      contract.contract_number
                                    }
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-medium text-slate-700">
                                  {account?.account_name ??
                                    `Account #${contract.account_id}`}
                                </p>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatLabel(
                                  contract.contract_type,
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-800">
                                {formatCurrency(
                                  contract.contract_value,
                                  contract.currency,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarDays className="h-4 w-4 text-blue-600" />
                                  {formatDate(
                                    contract.start_date,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                                  {formatDate(
                                    contract.end_date,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getRenewalClasses(
                                    contract.renewal_status,
                                  )}
                                >
                                  {formatLabel(
                                    contract.renewal_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getContractStatusClasses(
                                    contract.contract_status,
                                  )}
                                >
                                  {formatLabel(
                                    contract.contract_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  {contract.document_url && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      title="Open document"
                                      onClick={() =>
                                        window.open(
                                          contract.document_url ??
                                            "",
                                          "_blank",
                                          "noopener,noreferrer",
                                        )
                                      }
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View contract"
                                    onClick={() =>
                                      setViewingContract(
                                        contract,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit contract"
                                    onClick={() =>
                                      openEditForm(
                                        contract,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete contract"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteContract(
                                        contract,
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
          <ContractFormModal
            contract={editingContract}
            accounts={accounts}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingContract(null);
              }
            }}
            onSubmit={handleSaveContract}
          />
        )}

        {viewingContract && (
          <ContractDetailsModal
            contract={viewingContract}
            account={findAccount(
              viewingContract.account_id,
            )}
            onClose={() => {
              setViewingContract(null);

              const url = new URL(window.location.href);
              url.searchParams.delete("view");
              window.history.replaceState(
                null,
                "",
                `${url.pathname}${url.search}${url.hash}`,
              );
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
