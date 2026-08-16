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
  Edit3,
  Eye,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";

import {
  createSkill,
  deleteSkill,
  getSkills,
  replaceSkill,
} from "@/lib/resource-manager-api";

import type {
  CreateSkillRequest,
  ResourceSkill,
} from "@/types/resource-manager";

interface SkillFormState {
  name: string;
  category: string;
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: SkillFormState = {
  name: "",
  category: "",
  description: "",
  is_active: true,
};

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

function skillToForm(
  skill: ResourceSkill,
): SkillFormState {
  return {
    name: skill.name,
    category: skill.category,
    description: skill.description ?? "",
    is_active: skill.is_active,
  };
}

function formToPayload(
  form: SkillFormState,
): CreateSkillRequest {
  return {
    name: form.name.trim(),
    category: form.category.trim(),
    description:
      form.description.trim() || null,
    is_active: form.is_active,
  };
}

interface SkillFormModalProps {
  skill: ResourceSkill | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateSkillRequest,
  ) => Promise<void>;
}

function SkillFormModal({
  skill,
  isSaving,
  error,
  onClose,
  onSubmit,
}: SkillFormModalProps) {
  const [form, setForm] =
    useState<SkillFormState>(
      skill
        ? skillToForm(skill)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>,
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

  const isInvalid =
    !form.name.trim() ||
    !form.category.trim();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {skill
                ? "Edit Skill"
                : "Create Skill"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Maintain the reusable skill catalog for
              employee skill mapping.
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
          <div className="space-y-5 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Skill name *
              </Label>

              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="AWS"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category *
              </Label>

              <Input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Cloud"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description
              </Label>

              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Amazon Web Services"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
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
                Skill is active
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-blue-100 px-6 py-4">
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

              {skill
                ? "Save changes"
                : "Create skill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SkillDetailsModalProps {
  skill: ResourceSkill;
  onClose: () => void;
}

function SkillDetailsModal({
  skill,
  onClose,
}: SkillDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {skill.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Skill #{skill.id}
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
              Category
            </p>

            <p className="mt-2 text-2xl font-bold">
              {skill.category}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <Badge
              className={
                skill.is_active
                  ? "mt-3 bg-emerald-100 text-emerald-700"
                  : "mt-3 bg-slate-100 text-slate-700"
              }
            >
              {skill.is_active
                ? "Active"
                : "Inactive"}
            </Badge>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {skill.description ||
                "No description added."}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-medium">
              {formatDate(skill.created_at)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Updated
            </p>

            <p className="mt-1 font-medium">
              {formatDate(skill.updated_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResourceManagerSkillsPage() {
  const confirm = useConfirm();
  const [skills, setSkills] =
    useState<ResourceSkill[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

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
    editingSkill,
    setEditingSkill,
  ] = useState<ResourceSkill | null>(
    null,
  );

  const [
    viewingSkill,
    setViewingSkill,
  ] = useState<ResourceSkill | null>(
    null,
  );

  const loadSkills =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const records =
          await getSkills({
            skip: 0,
            limit: 100,
          });

        setSkills(records);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        skills
          .map((skill) =>
            skill.category.trim(),
          )
          .filter(Boolean),
      ),
    ).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        skill.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        skill.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          skill.is_active) ||
        (statusFilter === "INACTIVE" &&
          !skill.is_active);

      const matchesCategory =
        categoryFilter === "ALL" ||
        skill.category ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    categoryFilter,
    search,
    skills,
    statusFilter,
  ]);

  const activeSkills =
    skills.filter(
      (skill) => skill.is_active,
    ).length;

  const inactiveSkills =
    skills.length - activeSkills;

  const categoryCount =
    categories.length;

  async function handleSaveSkill(
    payload: CreateSkillRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingSkill) {
        const updated =
          await replaceSkill(
            editingSkill.id,
            payload,
          );

        setSkills((current) =>
          current.map((skill) =>
            skill.id === updated.id
              ? updated
              : skill,
          ),
        );
      } else {
        const created =
          await createSkill(payload);

        setSkills((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingSkill(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSkill(
    skill: ResourceSkill,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete skill "${skill.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSkill(skill.id);

      setSkills((current) =>
        current.filter(
          (record) =>
            record.id !== skill.id,
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
        title="Skills"
        description="Manage the technology and domain skill catalog."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Skills"
              value={skills.length.toLocaleString(
                "en-US",
              )}
              description="All skills in the catalog"
              icon={Wrench}
              variant="blue"
            />

            <StatCard
              title="Active Skills"
              value={activeSkills.toLocaleString(
                "en-US",
              )}
              description="Skills currently available for mapping"
              icon={BadgeCheck}
              variant="indigo"
            />

            <StatCard
              title="Categories"
              value={categoryCount.toLocaleString(
                "en-US",
              )}
              description="Distinct skill categories"
              icon={Layers3}
              variant="cyan"
            />

            <StatCard
              title="Inactive Skills"
              value={inactiveSkills.toLocaleString(
                "en-US",
              )}
              description="Skills currently disabled"
              icon={Wrench}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Skill Catalog
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {skills.length} skill
                    {skills.length === 1
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
                      void loadSkills()
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
                    onClick={() => {
                      setEditingSkill(null);
                      setFormError("");
                      setShowForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Skill
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

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search skill, category or description..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
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
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Wrench className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No skills found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add a skill or change the current
                    filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[950px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Skill
                        </th>

                        <th className="px-4 py-3">
                          Category
                        </th>

                        <th className="px-4 py-3">
                          Description
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3">
                          Updated
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredSkills.map(
                        (skill) => (
                          <tr
                            key={skill.id}
                            className="bg-white transition hover:bg-blue-50/50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                  <Wrench className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {skill.name}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    Skill #{skill.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <Badge className="bg-indigo-100 text-indigo-700">
                                {skill.category}
                              </Badge>
                            </td>

                            <td className="max-w-md px-4 py-4 text-sm text-slate-600">
                              <p className="line-clamp-2">
                                {skill.description ||
                                  "No description"}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={
                                  skill.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                }
                              >
                                {skill.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-600">
                              {formatDate(
                                skill.updated_at,
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View skill"
                                  onClick={() =>
                                    setViewingSkill(
                                      skill,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit skill"
                                  onClick={() => {
                                    setEditingSkill(
                                      skill,
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
                                  title="Delete skill"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteSkill(
                                      skill,
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

        {showForm && (
          <SkillFormModal
            skill={editingSkill}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingSkill(null);
              }
            }}
            onSubmit={handleSaveSkill}
          />
        )}

        {viewingSkill && (
          <SkillDetailsModal
            skill={viewingSkill}
            onClose={() =>
              setViewingSkill(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}