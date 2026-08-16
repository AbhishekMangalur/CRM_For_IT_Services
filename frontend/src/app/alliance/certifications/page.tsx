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
  Award,
  BadgeCheck,
  CalendarDays,
  Edit3,
  ExternalLink,
  Eye,
  Handshake,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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
  createPartnerCertification,
  deletePartnerCertification,
  getAlliancePartners,
  getPartnerCertifications,
  replacePartnerCertification,
} from "@/lib/alliance-api";

import {
  getEmployees,
} from "@/lib/resource-manager-api";

import type {
  AlliancePartner,
  CertificationLevel,
  CreatePartnerCertificationRequest,
  PartnerCertification,
} from "@/types/alliance";

import type {
  ResourceEmployee,
} from "@/types/resource-manager";
import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

/* ================================================= */
/* FORM */
/* ================================================= */

interface CertificationFormState {
  partner_id: string;
  employee_id: string;

  certification_name: string;

  certification_level:
    CertificationLevel;

  certification_number: string;

  issued_date: string;
  expiry_date: string;

  verification_url: string;

  is_active: boolean;
}

const EMPTY_FORM: CertificationFormState = {
  partner_id: "",
  employee_id: "",

  certification_name: "",

  certification_level: "ASSOCIATE",

  certification_number: "",

  issued_date: "",
  expiry_date: "",

  verification_url: "",

  is_active: true,
};

/* ================================================= */
/* HELPERS */
/* ================================================= */

function formatLabel(
  value: string,
): string {
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
    return "Not set";
  }

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

function getLevelClasses(
  level: string,
): string {
  switch (level.toUpperCase()) {
    case "PROFESSIONAL":
      return "bg-violet-100 text-violet-700";

    case "SPECIALTY":
      return "bg-indigo-100 text-indigo-700";

    case "ASSOCIATE":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-cyan-100 text-cyan-700";
  }
}

function isExpiringSoon(
  expiryDate: string | null,
): boolean {
  if (!expiryDate) {
    return false;
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  const today = new Date();

  const thirtyDaysLater =
    new Date();

  thirtyDaysLater.setDate(
    today.getDate() + 30,
  );

  return (
    expiry >= today &&
    expiry <= thirtyDaysLater
  );
}

function isExpired(
  expiryDate: string | null,
): boolean {
  if (!expiryDate) {
    return false;
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry < today;
}

function certificationToForm(
  certification: PartnerCertification,
): CertificationFormState {
  return {
    partner_id:
      certification.partner_id.toString(),

    employee_id:
      certification.employee_id.toString(),

    certification_name:
      certification.certification_name,

    certification_level:
      certification.certification_level,

    certification_number:
      certification.certification_number,

    issued_date:
      certification.issued_date,

    expiry_date:
      certification.expiry_date ?? "",

    verification_url:
      certification.verification_url,

    is_active:
      certification.is_active,
  };
}

function formToPayload(
  form: CertificationFormState,
): CreatePartnerCertificationRequest {
  return {
    partner_id:
      Number(form.partner_id),

    employee_id:
      Number(form.employee_id),

    certification_name:
      form.certification_name.trim(),

    certification_level:
      form.certification_level,

    certification_number:
      form.certification_number.trim(),

    issued_date:
      form.issued_date,

    expiry_date:
      form.expiry_date || null,

    verification_url:
      form.verification_url.trim(),

    is_active:
      form.is_active,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface CertificationFormModalProps {
  certification:
    | PartnerCertification
    | null;

  partners:
    AlliancePartner[];

  employees:
    ResourceEmployee[];

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreatePartnerCertificationRequest,
  ) => Promise<void>;
}

function CertificationFormModal({
  certification,
  partners,
  employees,
  isSaving,
  error,
  onClose,
  onSubmit,
}: CertificationFormModalProps) {
  const [form, setForm] =
    useState<CertificationFormState>(
      certification
        ? certificationToForm(
            certification,
          )
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
    ) {
      setForm((previous) => ({
        ...previous,
        [target.name]: target.checked,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [target.name]: target.value,
    }));
  }

  const invalidDateRange =
    Boolean(form.issued_date) &&
    Boolean(form.expiry_date) &&
    new Date(
      form.expiry_date,
    ).getTime() <
      new Date(
        form.issued_date,
      ).getTime();

  const isInvalid =
    !form.partner_id ||
    !form.employee_id ||
    !form.certification_name.trim() ||
    !form.certification_number.trim() ||
    !form.issued_date ||
    invalidDateRange;

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
              {certification
                ? "Edit Partner Certification"
                : "Add Partner Certification"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Map an employee certification to
              a strategic partner.
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

            {invalidDateRange && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  Expiry date cannot be earlier
                  than issued date.
                </AlertDescription>
              </Alert>
            )}

            {/* PARTNER */}

            <div className="space-y-2">
              <Label htmlFor="partner_id">
                Partner *
              </Label>

              <select
                id="partner_id"
                name="partner_id"
                value={form.partner_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select partner
                </option>

                {partners
                  .filter(
                    (partner) =>
                      partner.is_active,
                  )
                  .map((partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.name} -{" "}
                      {formatLabel(
                        partner.partner_tier,
                      )}
                    </option>
                  ))}
              </select>
            </div>

            {/* EMPLOYEE */}

            <div className="space-y-2">
              <Label htmlFor="employee_id">
                Employee *
              </Label>

              <select
                id="employee_id"
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select employee
                </option>

                {employees
                  .filter(
                    (employee) =>
                      employee.is_active,
                  )
                  .map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.employee_code} -{" "}
                      {employee.full_name} -{" "}
                      {employee.designation}
                    </option>
                  ))}
              </select>
            </div>

            {/* CERTIFICATION */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="certification_name">
                Certification Name *
              </Label>

              <Input
                id="certification_name"
                name="certification_name"
                value={
                  form.certification_name
                }
                onChange={handleChange}
                placeholder="AWS Certified Solutions Architect - Associate"
                required
              />
            </div>

            {/* LEVEL */}

            <div className="space-y-2">
              <Label htmlFor="certification_level">
                Certification Level
              </Label>

              <select
                id="certification_level"
                name="certification_level"
                value={
                  form.certification_level
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="FOUNDATIONAL">
                  Foundational
                </option>

                <option value="ASSOCIATE">
                  Associate
                </option>

                <option value="PROFESSIONAL">
                  Professional
                </option>

                <option value="SPECIALTY">
                  Specialty
                </option>
              </select>
            </div>

            {/* CERT NUMBER */}

            <div className="space-y-2">
              <Label htmlFor="certification_number">
                Certification Number *
              </Label>

              <Input
                id="certification_number"
                name="certification_number"
                value={
                  form.certification_number
                }
                onChange={handleChange}
                placeholder="AWS-SAA-001"
                required
              />
            </div>

            {/* ISSUED */}

            <div className="space-y-2">
              <Label htmlFor="issued_date">
                Issued Date *
              </Label>

              <Input
                id="issued_date"
                name="issued_date"
                type="date"
                value={form.issued_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* EXPIRY */}

            <div className="space-y-2">
              <Label htmlFor="expiry_date">
                Expiry Date
              </Label>

              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={handleChange}
              />
            </div>

            {/* VERIFICATION */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="verification_url">
                Verification URL
              </Label>

              <Input
                id="verification_url"
                name="verification_url"
                type="url"
                value={
                  form.verification_url
                }
                onChange={handleChange}
                placeholder="https://example.com/verify/aws-saa-001"
              />
            </div>

            {/* ACTIVE */}

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 md:col-span-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <Label
                htmlFor="is_active"
                className="cursor-pointer"
              >
                Certification is active
              </Label>
            </div>
          </div>

          {/* FOOTER */}

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

              {certification
                ? "Save Changes"
                : "Add Certification"}
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

interface CertificationDetailsModalProps {
  certification:
    PartnerCertification;

  partner?: AlliancePartner;

  employee?: ResourceEmployee;

  onClose: () => void;
}

function CertificationDetailsModal({
  certification,
  partner,
  employee,
  onClose,
}: CertificationDetailsModalProps) {
  const expired =
    isExpired(
      certification.expiry_date,
    );

  const expiringSoon =
    isExpiringSoon(
      certification.expiry_date,
    );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {
                certification.certification_name
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Partner Certification #
              {certification.id}
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

          {/* LEVEL */}

          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Certification Level
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                certification.certification_level,
              )}
            </p>
          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                className={
                  certification.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }
              >
                {certification.is_active
                  ? "Active"
                  : "Inactive"}
              </Badge>

              {expired && (
                <Badge className="bg-red-100 text-red-700">
                  Expired
                </Badge>
              )}

              {!expired &&
                expiringSoon && (
                  <Badge className="bg-amber-100 text-amber-700">
                    Expiring Soon
                  </Badge>
                )}
            </div>
          </div>

          {/* PARTNER */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Partner
            </p>

            <p className="mt-1 font-semibold">
              {partner?.name ??
                `Partner #${certification.partner_id}`}
            </p>

            {partner && (
              <p className="mt-1 text-sm text-slate-500">
                {formatLabel(
                  partner.partner_type,
                )}{" "}
                ·{" "}
                {formatLabel(
                  partner.partner_tier,
                )}
              </p>
            )}
          </div>

          {/* EMPLOYEE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Employee
            </p>

            <p className="mt-1 font-semibold">
              {employee?.full_name ??
                `Employee #${certification.employee_id}`}
            </p>

            {employee && (
              <p className="mt-1 text-sm text-slate-500">
                {employee.employee_code} ·{" "}
                {employee.designation}
              </p>
            )}
          </div>

          {/* NUMBER */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Certification Number
            </p>

            <p className="mt-1 font-semibold">
              {
                certification.certification_number
              }
            </p>
          </div>

          {/* ISSUED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Issued Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                certification.issued_date,
              )}
            </p>
          </div>

          {/* EXPIRY */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Expiry Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                certification.expiry_date,
              )}
            </p>
          </div>

          {/* VERIFICATION */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Verification
            </p>

            {certification.verification_url ? (
              <a
                href={
                  certification.verification_url
                }
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-2 break-all text-sm font-semibold text-blue-700 hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />

                Verify Credential
              </a>
            ) : (
              <p className="mt-1 font-semibold">
                Not added
              </p>
            )}
          </div>

          {/* CREATED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                certification.created_at,
              )}
            </p>
          </div>

          {/* UPDATED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                certification.updated_at,
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

export default function AllianceCertificationsPage() {
  const confirm = useConfirm();
  const [
    certifications,
    setCertifications,
  ] =
    useState<
      PartnerCertification[]
    >([]);

  const [
    partners,
    setPartners,
  ] = useState<AlliancePartner[]>([]);

  const [
    employees,
    setEmployees,
  ] = useState<ResourceEmployee[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    partnerFilter,
    setPartnerFilter,
  ] = useState("ALL");

  const [
    levelFilter,
    setLevelFilter,
  ] = useState("ALL");

  const [
    statusFilter,
    setStatusFilter,
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
    editingCertification,
    setEditingCertification,
  ] =
    useState<PartnerCertification | null>(
      null,
    );

  const [
    viewingCertification,
    setViewingCertification,
  ] =
    useState<PartnerCertification | null>(
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
            certificationRecords,
            partnerRecords,
            employeeRecords,
          ] = await Promise.all([
            getPartnerCertifications({
              skip: 0,
              limit: 100,
            }),

            getAlliancePartners({
              skip: 0,
              limit: 100,
            }),

            getEmployees({
              skip: 0,
              limit: 100,
            }),
          ]);

          setCertifications(
            certificationRecords,
          );

          setPartners(
            partnerRecords,
          );

          setEmployees(
            employeeRecords,
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
    void loadData();
  }, [loadData]);

  /* ================================================= */
  /* LOOKUPS */
  /* ================================================= */

  function findPartner(
    partnerId: number,
  ): AlliancePartner | undefined {
    return partners.find(
      (partner) =>
        partner.id === partnerId,
    );
  }

  function findEmployee(
    employeeId: number,
  ): ResourceEmployee | undefined {
    return employees.find(
      (employee) =>
        employee.id === employeeId,
    );
  }

  /* ================================================= */
  /* FILTERING */
  /* ================================================= */

  const filteredCertifications =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return certifications.filter(
        (certification) => {
          const partner =
            partners.find(
              (record) =>
                record.id ===
                certification.partner_id,
            );

          const employee =
            employees.find(
              (record) =>
                record.id ===
                certification.employee_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            certification.certification_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            certification.certification_number
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            partner?.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee?.employee_code
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesPartner =
            partnerFilter === "ALL" ||
            certification.partner_id ===
              Number(partnerFilter);

          const matchesLevel =
            levelFilter === "ALL" ||
            certification.certification_level ===
              levelFilter;

          const expired =
            isExpired(
              certification.expiry_date,
            );

          const expiringSoon =
            isExpiringSoon(
              certification.expiry_date,
            );

          const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter ===
              "ACTIVE" &&
              certification.is_active &&
              !expired) ||
            (statusFilter ===
              "INACTIVE" &&
              !certification.is_active) ||
            (statusFilter ===
              "EXPIRING" &&
              expiringSoon) ||
            (statusFilter ===
              "EXPIRED" &&
              expired);

          return (
            matchesSearch &&
            matchesPartner &&
            matchesLevel &&
            matchesStatus
          );
        },
      );
    }, [
      certifications,
      employees,
      levelFilter,
      partnerFilter,
      partners,
      search,
      statusFilter,
    ]);

  /* ================================================= */
  /* KPI */
  /* ================================================= */

  const activeCertifications =
    certifications.filter(
      (certification) =>
        certification.is_active &&
        !isExpired(
          certification.expiry_date,
        ),
    ).length;

  const expiringSoonCount =
    certifications.filter(
      (certification) =>
        certification.is_active &&
        isExpiringSoon(
          certification.expiry_date,
        ),
    ).length;

  const expiredCount =
    certifications.filter(
      (certification) =>
        isExpired(
          certification.expiry_date,
        ),
    ).length;

  const certifiedEmployees =
    new Set(
      certifications
        .filter(
          (certification) =>
            certification.is_active,
        )
        .map(
          (certification) =>
            certification.employee_id,
        ),
    ).size;

  /* ================================================= */
  /* SAVE */
  /* ================================================= */

  async function handleSaveCertification(
    payload:
      CreatePartnerCertificationRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingCertification) {
        const updated =
          await replacePartnerCertification(
            editingCertification.id,
            payload,
          );

        setCertifications(
          (current) =>
            current.map(
              (certification) =>
                certification.id ===
                updated.id
                  ? updated
                  : certification,
            ),
        );
      } else {
        const created =
          await createPartnerCertification(
            payload,
          );

        setCertifications(
          (current) => [
            created,
            ...current,
          ],
        );
      }

      setShowForm(false);

      setEditingCertification(
        null,
      );
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

  async function handleDeleteCertification(
    certification:
      PartnerCertification,
  ): Promise<void> {
    const employee =
      findEmployee(
        certification.employee_id,
      );

    const confirmed =
      await confirm(
        `Delete certification "${certification.certification_name}" for "${
          employee?.full_name ??
          "this employee"
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deletePartnerCertification(
        certification.id,
      );

      setCertifications(
        (current) =>
          current.filter(
            (record) =>
              record.id !==
              certification.id,
          ),
      );
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
    setEditingCertification(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    certification:
      PartnerCertification,
  ): void {
    setEditingCertification(
      certification,
    );

    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute
        allowedRoles={[
        "SALES",
        "ACCOUNT_DIRECTOR",
        ]}
    >
    <DashboardLayout
      title="Partner Certifications"
      description="Track partner certifications held by employees and monitor expiry."
    >
      <div className="space-y-6">

        {/* ================================================= */}
        {/* KPI */}
        {/* ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Certifications"
            value={activeCertifications.toLocaleString(
              "en-US",
            )}
            description="Current active partner certifications"
            icon={BadgeCheck}
            variant="blue"
          />

          <StatCard
            title="Certified Employees"
            value={certifiedEmployees.toLocaleString(
              "en-US",
            )}
            description="Employees with partner certifications"
            icon={UserRound}
            variant="indigo"
          />

          <StatCard
            title="Expiring Soon"
            value={expiringSoonCount.toLocaleString(
              "en-US",
            )}
            description="Certifications expiring within 30 days"
            icon={CalendarDays}
            variant="cyan"
          />

          <StatCard
            title="Expired"
            value={expiredCount.toLocaleString(
              "en-US",
            )}
            description="Partner certifications already expired"
            icon={Award}
            variant="emerald"
          />
        </section>

        {/* ================================================= */}
        {/* MAIN CARD */}
        {/* ================================================= */}

        <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
          <CardHeader className="border-b border-blue-50">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-xl text-slate-900">
                  Certification Inventory
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  {certifications.length} certification
                  {certifications.length === 1
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
                    partners.length === 0 ||
                    employees.length === 0
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />

                  Add Certification
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
              (partners.length === 0 ||
                employees.length === 0) && (
                <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    At least one active partner
                    and one employee are required
                    before adding certifications.
                  </AlertDescription>
                </Alert>
              )}

            {/* FILTERS */}

            <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_220px_210px_190px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search certification, number, employee or partner..."
                  className="pl-10"
                />
              </div>

              <select
                value={partnerFilter}
                onChange={(event) =>
                  setPartnerFilter(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ALL">
                  All Partners
                </option>

                {partners.map(
                  (partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.name}
                    </option>
                  ),
                )}
              </select>

              <select
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ALL">
                  All Levels
                </option>

                <option value="FOUNDATIONAL">
                  Foundational
                </option>

                <option value="ASSOCIATE">
                  Associate
                </option>

                <option value="PROFESSIONAL">
                  Professional
                </option>

                <option value="SPECIALTY">
                  Specialty
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
                  All Statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="EXPIRING">
                  Expiring Soon
                </option>

                <option value="EXPIRED">
                  Expired
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

            {/* TABLE */}

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
              </div>
            ) : filteredCertifications.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                <Award className="h-10 w-10 text-blue-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  No partner certifications found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full min-w-[1500px] text-left">

                  <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">
                        Certification
                      </th>

                      <th className="px-4 py-3">
                        Partner
                      </th>

                      <th className="px-4 py-3">
                        Employee
                      </th>

                      <th className="px-4 py-3">
                        Level
                      </th>

                      <th className="px-4 py-3">
                        Number
                      </th>

                      <th className="px-4 py-3">
                        Issued
                      </th>

                      <th className="px-4 py-3">
                        Expiry
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
                    {filteredCertifications.map(
                      (certification) => {
                        const partner =
                          findPartner(
                            certification.partner_id,
                          );

                        const employee =
                          findEmployee(
                            certification.employee_id,
                          );

                        const expired =
                          isExpired(
                            certification.expiry_date,
                          );

                        const expiringSoon =
                          isExpiringSoon(
                            certification.expiry_date,
                          );

                        return (
                          <tr
                            key={certification.id}
                            className="bg-white transition hover:bg-blue-50/50"
                          >

                            {/* CERTIFICATION */}

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                  <Award className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="max-w-72 font-semibold text-slate-800">
                                    {
                                      certification.certification_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Certification #
                                    {certification.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* PARTNER */}

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Handshake className="h-4 w-4 text-blue-600" />

                                <span className="font-medium text-slate-700">
                                  {partner?.name ??
                                    `Partner #${certification.partner_id}`}
                                </span>
                              </div>
                            </td>

                            {/* EMPLOYEE */}

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <UserRound className="h-4 w-4 text-indigo-600" />

                                <div>
                                  <p className="font-medium text-slate-700">
                                    {employee?.full_name ??
                                      `Employee #${certification.employee_id}`}
                                  </p>

                                  {employee && (
                                    <p className="text-xs text-slate-500">
                                      {
                                        employee.employee_code
                                      }{" "}
                                      ·{" "}
                                      {
                                        employee.designation
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* LEVEL */}

                            <td className="px-4 py-4">
                              <Badge
                                className={getLevelClasses(
                                  certification.certification_level,
                                )}
                              >
                                {formatLabel(
                                  certification.certification_level,
                                )}
                              </Badge>
                            </td>

                            {/* NUMBER */}

                            <td className="px-4 py-4 text-sm font-medium text-slate-700">
                              {
                                certification.certification_number
                              }
                            </td>

                            {/* ISSUED */}

                            <td className="px-4 py-4 text-sm text-slate-600">
                              {formatDate(
                                certification.issued_date,
                              )}
                            </td>

                            {/* EXPIRY */}

                            <td className="px-4 py-4">
                              <div className="text-sm">
                                <p className="text-slate-600">
                                  {formatDate(
                                    certification.expiry_date,
                                  )}
                                </p>

                                {expired && (
                                  <p className="mt-1 text-xs font-medium text-red-600">
                                    Expired
                                  </p>
                                )}

                                {!expired &&
                                  expiringSoon && (
                                    <p className="mt-1 text-xs font-medium text-amber-600">
                                      Expiring soon
                                    </p>
                                  )}
                              </div>
                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-4">
                              <Badge
                                className={
                                  certification.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                }
                              >
                                {certification.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View certification"
                                  onClick={() =>
                                    setViewingCertification(
                                      certification,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {certification.verification_url && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Verify certification"
                                    onClick={() =>
                                      window.open(
                                        certification.verification_url,
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
                                  title="Edit certification"
                                  onClick={() =>
                                    openEditForm(
                                      certification,
                                    )
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete certification"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteCertification(
                                      certification,
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
        <CertificationFormModal
          certification={
            editingCertification
          }
          partners={partners}
          employees={employees}
          isSaving={isSaving}
          error={formError}
          onClose={() => {
            if (!isSaving) {
              setShowForm(false);

              setEditingCertification(
                null,
              );
            }
          }}
          onSubmit={
            handleSaveCertification
          }
        />
      )}

      {/* DETAILS */}

      {viewingCertification && (
        <CertificationDetailsModal
          certification={
            viewingCertification
          }
          partner={findPartner(
            viewingCertification.partner_id,
          )}
          employee={findEmployee(
            viewingCertification.employee_id,
          )}
          onClose={() =>
            setViewingCertification(
              null,
            )
          }
        />
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}