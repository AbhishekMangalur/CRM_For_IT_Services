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
  BookOpenCheck,
  Edit3,
  Eye,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  Wrench,
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
  createEmployeeSkill,
  deleteEmployeeSkill,
  getEmployees,
  getEmployeeSkills,
  getSkills,
  replaceEmployeeSkill,
} from "@/lib/resource-manager-api";

import type {
  CreateEmployeeSkillRequest,
  EmployeeSkill,
  ProficiencyLevel,
  ResourceEmployee,
  ResourceSkill,
} from "@/types/resource-manager";

interface EmployeeSkillFormState {
  employee_id: string;
  skill_id: string;
  proficiency_level: ProficiencyLevel;
  experience_years: string;
  certification_name: string;
  certification_number: string;
  certification_expiry_date: string;
}

interface SearchOption {
  value: string;
  label: string;
  description: string;
  searchText: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  placeholder: string;
  emptyMessage: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
}

function SearchableSelect({
  id,
  label,
  placeholder,
  emptyMessage,
  options,
  value,
  onChange,
}: SearchableSelectProps) {
  const selectedOption = options.find(
    (option) => option.value === value,
  );
  const [query, setQuery] = useState(
    selectedOption?.label ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter(
    (option) =>
      !normalizedQuery ||
      option.searchText.includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          required
          value={query}
          placeholder={placeholder}
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
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
            id={`${id}-options`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(option.label);
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {option.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {option.description}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                {emptyMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: EmployeeSkillFormState = {
  employee_id: "",
  skill_id: "",
  proficiency_level: "INTERMEDIATE",
  experience_years: "",
  certification_name: "",
  certification_number: "",
  certification_expiry_date: "",
};

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

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
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

function getProficiencyClasses(
  level: string,
): string {
  switch (level.toUpperCase()) {
    case "EXPERT":
      return "bg-violet-100 text-violet-700";

    case "ADVANCED":
      return "bg-indigo-100 text-indigo-700";

    case "INTERMEDIATE":
      return "bg-cyan-100 text-cyan-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function employeeSkillToForm(
  employeeSkill: EmployeeSkill,
): EmployeeSkillFormState {
  return {
    employee_id:
      employeeSkill.employee_id.toString(),

    skill_id:
      employeeSkill.skill_id.toString(),

    proficiency_level:
      employeeSkill.proficiency_level,

    experience_years:
      employeeSkill.experience_years.toString(),

    certification_name:
      employeeSkill.certification_name ?? "",

    certification_number:
      employeeSkill.certification_number ?? "",

    certification_expiry_date:
      employeeSkill.certification_expiry_date ?? "",
  };
}

function formToPayload(
  form: EmployeeSkillFormState,
): CreateEmployeeSkillRequest {
  return {
    employee_id:
      Number(form.employee_id),

    skill_id:
      Number(form.skill_id),

    proficiency_level:
      form.proficiency_level,

    experience_years:
      Number(form.experience_years),

    certification_name:
      form.certification_name.trim() || null,

    certification_number:
      form.certification_number.trim() || null,

    certification_expiry_date:
      form.certification_expiry_date || null,
  };
}

interface EmployeeSkillFormModalProps {
  employeeSkill: EmployeeSkill | null;
  employees: ResourceEmployee[];
  skills: ResourceSkill[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateEmployeeSkillRequest,
  ) => Promise<void>;
}

function EmployeeSkillFormModal({
  employeeSkill,
  employees,
  skills,
  isSaving,
  error,
  onClose,
  onSubmit,
}: EmployeeSkillFormModalProps) {
  const [form, setForm] =
    useState<EmployeeSkillFormState>(
      employeeSkill
        ? employeeSkillToForm(
            employeeSkill,
          )
        : EMPTY_FORM,
    );

  const employeeOptions = employees.map((employee) => ({
    value: employee.id.toString(),
    label: employee.full_name,
    description: `${employee.employee_code} · ${employee.designation} · ${employee.email}`,
    searchText: [
      employee.full_name,
      employee.employee_code,
      employee.designation,
      employee.department,
      employee.email,
    ]
      .join(" ")
      .toLowerCase(),
  }));
  const skillOptions = skills
    .filter((skill) => skill.is_active)
    .map((skill) => ({
      value: skill.id.toString(),
      label: skill.name,
      description: skill.category,
      searchText: `${skill.name} ${skill.category}`.toLowerCase(),
    }));

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const isInvalid =
    !form.employee_id ||
    !form.skill_id ||
    !form.experience_years ||
    Number(form.experience_years) < 0;

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
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {employeeSkill
                ? "Edit Employee Skill"
                : "Add Employee Skill"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Map an employee to a skill and track
              proficiency, experience, and certification.
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

            <SearchableSelect
              id="employee_search"
              label="Employee"
              placeholder="Search by employee name, code, designation, or email..."
              emptyMessage="No employees match your search."
              options={employeeOptions}
              value={form.employee_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  employee_id: value,
                }))
              }
            />

            <SearchableSelect
              id="skill_search"
              label="Skill"
              placeholder="Search by skill name or category..."
              emptyMessage="No skills match your search."
              options={skillOptions}
              value={form.skill_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  skill_id: value,
                }))
              }
            />

            <div className="space-y-2">
              <Label htmlFor="proficiency_level">
                Proficiency level
              </Label>

              <select
                id="proficiency_level"
                name="proficiency_level"
                value={
                  form.proficiency_level
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="BEGINNER">
                  Beginner
                </option>

                <option value="INTERMEDIATE">
                  Intermediate
                </option>

                <option value="ADVANCED">
                  Advanced
                </option>

                <option value="EXPERT">
                  Expert
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">
                Experience with skill (years) *
              </Label>

              <Input
                id="experience_years"
                name="experience_years"
                type="number"
                min="0"
                step="0.5"
                value={form.experience_years}
                onChange={handleChange}
                placeholder="4"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="certification_name">
                Certification name
              </Label>

              <Input
                id="certification_name"
                name="certification_name"
                value={
                  form.certification_name
                }
                onChange={handleChange}
                placeholder="AWS Certified Solutions Architect"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification_number">
                Certification number
              </Label>

              <Input
                id="certification_number"
                name="certification_number"
                value={
                  form.certification_number
                }
                onChange={handleChange}
                placeholder="AWS-CSA-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification_expiry_date">
                Certification expiry
              </Label>

              <Input
                id="certification_expiry_date"
                name="certification_expiry_date"
                type="date"
                value={
                  form.certification_expiry_date
                }
                onChange={handleChange}
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
                isSaving || isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {employeeSkill
                ? "Save changes"
                : "Add skill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EmployeeSkillDetailsModalProps {
  employeeSkill: EmployeeSkill;
  employee?: ResourceEmployee;
  skill?: ResourceSkill;
  onClose: () => void;
}

function EmployeeSkillDetailsModal({
  employeeSkill,
  employee,
  skill,
  onClose,
}: EmployeeSkillDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {employee?.full_name ??
                `Employee #${employeeSkill.employee_id}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {skill?.name ??
                `Skill #${employeeSkill.skill_id}`}
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
              Proficiency
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                employeeSkill.proficiency_level,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Skill Experience
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {employeeSkill.experience_years} yrs
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Employee
            </p>

            <p className="mt-1 font-semibold">
              {employee?.full_name ??
                `Employee #${employeeSkill.employee_id}`}
            </p>

            {employee && (
              <p className="mt-1 text-sm text-slate-500">
                {employee.employee_code} ·{" "}
                {employee.designation}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Skill
            </p>

            <p className="mt-1 font-semibold">
              {skill?.name ??
                `Skill #${employeeSkill.skill_id}`}
            </p>

            {skill && (
              <p className="mt-1 text-sm text-slate-500">
                {skill.category}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Certification
            </p>

            <p className="mt-1 font-semibold">
              {employeeSkill.certification_name ||
                "Not added"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Certification Number
            </p>

            <p className="mt-1 font-semibold">
              {employeeSkill.certification_number ||
                "Not added"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Certification Expiry
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                employeeSkill.certification_expiry_date,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResourceManagerEmployeeSkillsPage() {
  const confirm = useConfirm();
  const [
    employeeSkills,
    setEmployeeSkills,
  ] = useState<EmployeeSkill[]>([]);

  const [employees, setEmployees] =
    useState<ResourceEmployee[]>([]);

  const [skills, setSkills] =
    useState<ResourceSkill[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    employeeFilter,
    setEmployeeFilter,
  ] = useState("ALL");

  const [skillFilter, setSkillFilter] =
    useState("ALL");

  const [
    proficiencyFilter,
    setProficiencyFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingEmployeeSkill,
    setEditingEmployeeSkill,
  ] = useState<EmployeeSkill | null>(
    null,
  );

  const [
    viewingEmployeeSkill,
    setViewingEmployeeSkill,
  ] = useState<EmployeeSkill | null>(
    null,
  );

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          employeeSkillRecords,
          employeeRecords,
          skillRecords,
        ] = await Promise.all([
          getEmployeeSkills({
            skip: 0,
            limit: 100,
          }),

          getEmployees({
            skip: 0,
            limit: 100,
          }),

          getSkills({
            skip: 0,
            limit: 100,
          }),
        ]);

        setEmployeeSkills(
          employeeSkillRecords,
        );

        setEmployees(employeeRecords);
        setSkills(skillRecords);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        );
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

  function findEmployee(
    employeeId: number,
  ): ResourceEmployee | undefined {
    return employees.find(
      (employee) =>
        employee.id === employeeId,
    );
  }

  function findSkill(
    skillId: number,
  ): ResourceSkill | undefined {
    return skills.find(
      (skill) => skill.id === skillId,
    );
  }

  const filteredEmployeeSkills =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return employeeSkills
        .filter((employeeSkill) => {
          const employee =
            employees.find(
              (record) =>
                record.id ===
                employeeSkill.employee_id,
            );

          const skill =
            skills.find(
              (record) =>
                record.id ===
                employeeSkill.skill_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            employee?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee?.employee_code
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            skill?.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employeeSkill.certification_name
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesEmployee =
            employeeFilter === "ALL" ||
            employeeSkill.employee_id ===
              Number(employeeFilter);

          const matchesSkill =
            skillFilter === "ALL" ||
            employeeSkill.skill_id ===
              Number(skillFilter);

          const matchesProficiency =
            proficiencyFilter === "ALL" ||
            employeeSkill.proficiency_level ===
              proficiencyFilter;

          return (
            matchesSearch &&
            matchesEmployee &&
            matchesSkill &&
            matchesProficiency
          );
        })
        .sort((first, second) => {
          const firstHasCertification = Boolean(
            first.certification_name ||
              first.certification_number ||
              first.certification_expiry_date,
          );
          const secondHasCertification = Boolean(
            second.certification_name ||
              second.certification_number ||
              second.certification_expiry_date,
          );

          if (firstHasCertification !== secondHasCertification) {
            return Number(secondHasCertification) - Number(firstHasCertification);
          }

          return second.id - first.id;
        });
    }, [
      employeeFilter,
      employeeSkills,
      employees,
      proficiencyFilter,
      search,
      skillFilter,
      skills,
    ]);

  const certifiedSkills =
    employeeSkills.filter(
      (employeeSkill) =>
        Boolean(
          employeeSkill.certification_name,
        ),
    ).length;

  const advancedSkills =
    employeeSkills.filter(
      (employeeSkill) =>
        ["ADVANCED", "EXPERT"].includes(
          employeeSkill.proficiency_level,
        ),
    ).length;

  const uniqueEmployees =
    new Set(
      employeeSkills.map(
        (employeeSkill) =>
          employeeSkill.employee_id,
      ),
    ).size;

  async function handleSaveEmployeeSkill(
    payload: CreateEmployeeSkillRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingEmployeeSkill) {
        const updated =
          await replaceEmployeeSkill(
            editingEmployeeSkill.id,
            payload,
          );

        setEmployeeSkills((current) =>
          current.map(
            (employeeSkill) =>
              employeeSkill.id ===
              updated.id
                ? updated
                : employeeSkill,
          ),
        );
      } else {
        const created =
          await createEmployeeSkill(
            payload,
          );

        setEmployeeSkills((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingEmployeeSkill(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEmployeeSkill(
    employeeSkill: EmployeeSkill,
  ): Promise<void> {
    const employee =
      findEmployee(
        employeeSkill.employee_id,
      );

    const skill =
      findSkill(
        employeeSkill.skill_id,
      );

    const confirmed =
      await confirm(
        `Remove "${skill?.name ?? "this skill"}" from "${
          employee?.full_name ?? "this employee"
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEmployeeSkill(
        employeeSkill.id,
      );

      setEmployeeSkills((current) =>
        current.filter(
          (record) =>
            record.id !==
            employeeSkill.id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  return (
    <ProtectedRoute allowedRole="RESOURCE_MANAGER">
      <DashboardLayout
        title="Employee Skills"
        description="Map employees to skills, proficiency levels and certifications."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Skill Mappings"
              value={employeeSkills.length.toLocaleString(
                "en-US",
              )}
              description="Employee-to-skill mappings"
              icon={BadgeCheck}
              variant="blue"
            />

            <StatCard
              title="Skilled Employees"
              value={uniqueEmployees.toLocaleString(
                "en-US",
              )}
              description="Employees with at least one mapped skill"
              icon={UserRound}
              variant="indigo"
            />

            <StatCard
              title="Advanced / Expert"
              value={advancedSkills.toLocaleString(
                "en-US",
              )}
              description="Advanced and expert skill mappings"
              icon={GraduationCap}
              variant="cyan"
            />

            <StatCard
              title="Certifications"
              value={certifiedSkills.toLocaleString(
                "en-US",
              )}
              description="Mappings with certification details"
              icon={Award}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Employee Skill Inventory
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {employeeSkills.length} mapping
                    {employeeSkills.length === 1
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
                    disabled={
                      employees.length === 0 ||
                      skills.length === 0
                    }
                    onClick={() => {
                      setEditingEmployeeSkill(
                        null,
                      );
                      setFormError("");
                      setShowForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee Skill
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
                (employees.length === 0 ||
                  skills.length === 0) && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      You need at least one employee and
                      one skill before creating an employee
                      skill mapping.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_230px_220px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search employee, code, skill or certification..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={employeeFilter}
                  onChange={(event) =>
                    setEmployeeFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All employees
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.full_name}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={skillFilter}
                  onChange={(event) =>
                    setSkillFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All skills
                  </option>

                  {skills.map(
                    (skill) => (
                      <option
                        key={skill.id}
                        value={skill.id}
                      >
                        {skill.name}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    proficiencyFilter
                  }
                  onChange={(event) =>
                    setProficiencyFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All levels
                  </option>
                  <option value="BEGINNER">
                    Beginner
                  </option>
                  <option value="INTERMEDIATE">
                    Intermediate
                  </option>
                  <option value="ADVANCED">
                    Advanced
                  </option>
                  <option value="EXPERT">
                    Expert
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredEmployeeSkills.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <BookOpenCheck className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No employee skills found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1250px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Employee
                        </th>

                        <th className="px-4 py-3">
                          Skill
                        </th>

                        <th className="px-4 py-3">
                          Proficiency
                        </th>

                        <th className="px-4 py-3">
                          Experience
                        </th>

                        <th className="px-4 py-3">
                          Certification
                        </th>

                        <th className="px-4 py-3">
                          Expiry
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredEmployeeSkills.map(
                        (employeeSkill) => {
                          const employee =
                            findEmployee(
                              employeeSkill.employee_id,
                            );

                          const skill =
                            findSkill(
                              employeeSkill.skill_id,
                            );

                          return (
                            <tr
                              key={
                                employeeSkill.id
                              }
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <UserRound className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {employee?.full_name ??
                                        `Employee #${employeeSkill.employee_id}`}
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

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p className="font-medium text-slate-700">
                                      {skill?.name ??
                                        `Skill #${employeeSkill.skill_id}`}
                                    </p>

                                    {skill && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          skill.category
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getProficiencyClasses(
                                    employeeSkill.proficiency_level,
                                  )}
                                >
                                  {formatLabel(
                                    employeeSkill.proficiency_level,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 font-medium text-slate-700">
                                {
                                  employeeSkill.experience_years
                                }{" "}
                                years
                              </td>

                              <td className="px-4 py-4">
                                <div>
                                  <p className="max-w-64 truncate text-sm font-medium text-slate-700">
                                    {employeeSkill.certification_name ||
                                      "No certification"}
                                  </p>

                                  {employeeSkill.certification_number && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {
                                        employeeSkill.certification_number
                                      }
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDate(
                                  employeeSkill.certification_expiry_date,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View employee skill"
                                    onClick={() =>
                                      setViewingEmployeeSkill(
                                        employeeSkill,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit employee skill"
                                    onClick={() => {
                                      setEditingEmployeeSkill(
                                        employeeSkill,
                                      );
                                      setFormError("");
                                      setShowForm(true);
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete employee skill"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteEmployeeSkill(
                                        employeeSkill,
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
          <EmployeeSkillFormModal
            employeeSkill={
              editingEmployeeSkill
            }
            employees={employees}
            skills={skills}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingEmployeeSkill(
                  null,
                );
              }
            }}
            onSubmit={
              handleSaveEmployeeSkill
            }
          />
        )}

        {viewingEmployeeSkill && (
          <EmployeeSkillDetailsModal
            employeeSkill={
              viewingEmployeeSkill
            }
            employee={findEmployee(
              viewingEmployeeSkill.employee_id,
            )}
            skill={findSkill(
              viewingEmployeeSkill.skill_id,
            )}
            onClose={() =>
              setViewingEmployeeSkill(
                null,
              )
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
