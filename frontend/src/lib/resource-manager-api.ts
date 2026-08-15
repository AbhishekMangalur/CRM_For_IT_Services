import { api } from "@/lib/api";

import type {
  CreateEmployeeRequest,
  CreateEmployeeSkillRequest,
  CreateResourceAllocationRequest,
  CreateResourceRequestRequest,
  CreateSkillRequest,
  EmployeeSkill,
  EmployeeImportResult,
  PatchEmployeeRequest,
  PatchEmployeeSkillRequest,
  PatchResourceAllocationRequest,
  PatchResourceRequestRequest,
  PatchSkillRequest,
  ResourceAllocation,
  ResourceEmployee,
  ResourceRequest,
  ResourceSkill,
  UpdateEmployeeRequest,
  UpdateEmployeeSkillRequest,
  UpdateResourceAllocationRequest,
  UpdateResourceRequestRequest,
  UpdateSkillRequest,
} from "@/types/resource-manager";

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

export const RESOURCE_MANAGER_ENDPOINTS = {
  EMPLOYEES:
    "/api/resource-manager/employees",

  SKILLS:
    "/api/resource-manager/skills",

  EMPLOYEE_SKILLS:
    "/api/resource-manager/employee-skills",

  RESOURCE_REQUESTS:
    "/api/resource-manager/resource-requests",

  RESOURCE_ALLOCATIONS:
    "/api/resource-manager/resource-allocations",
} as const;

/* ================================================= */
/* EMPLOYEES */
/* ================================================= */

export async function getEmployees(
  params: ListQueryParams = {},
): Promise<ResourceEmployee[]> {
  const response = await api.get<
    ResourceEmployee[]
  >(
    RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function importEmployeesCsv(
  file: File,
): Promise<EmployeeImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<EmployeeImportResult>(
    `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES}/import`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getEmployeeById(
  employeeId: number,
): Promise<ResourceEmployee> {
  const response =
    await api.get<ResourceEmployee>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES}/${employeeId}`,
    );

  return response.data;
}

export async function createEmployee(
  payload: CreateEmployeeRequest,
): Promise<ResourceEmployee> {
  const response =
    await api.post<ResourceEmployee>(
      RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES,
      payload,
    );

  return response.data;
}

export async function replaceEmployee(
  employeeId: number,
  payload: UpdateEmployeeRequest,
): Promise<ResourceEmployee> {
  const response =
    await api.put<ResourceEmployee>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES}/${employeeId}`,
      payload,
    );

  return response.data;
}

export async function patchEmployee(
  employeeId: number,
  payload: PatchEmployeeRequest,
): Promise<ResourceEmployee> {
  const response =
    await api.patch<ResourceEmployee>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES}/${employeeId}`,
      payload,
    );

  return response.data;
}

export async function deleteEmployee(
  employeeId: number,
): Promise<void> {
  await api.delete(
    `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEES}/${employeeId}`,
  );
}

/* ================================================= */
/* SKILLS */
/* ================================================= */

export async function getSkills(
  params: ListQueryParams = {},
): Promise<ResourceSkill[]> {
  const response = await api.get<
    ResourceSkill[]
  >(
    RESOURCE_MANAGER_ENDPOINTS.SKILLS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getSkillById(
  skillId: number,
): Promise<ResourceSkill> {
  const response =
    await api.get<ResourceSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.SKILLS}/${skillId}`,
    );

  return response.data;
}

export async function createSkill(
  payload: CreateSkillRequest,
): Promise<ResourceSkill> {
  const response =
    await api.post<ResourceSkill>(
      RESOURCE_MANAGER_ENDPOINTS.SKILLS,
      payload,
    );

  return response.data;
}

export async function replaceSkill(
  skillId: number,
  payload: UpdateSkillRequest,
): Promise<ResourceSkill> {
  const response =
    await api.put<ResourceSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.SKILLS}/${skillId}`,
      payload,
    );

  return response.data;
}

export async function patchSkill(
  skillId: number,
  payload: PatchSkillRequest,
): Promise<ResourceSkill> {
  const response =
    await api.patch<ResourceSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.SKILLS}/${skillId}`,
      payload,
    );

  return response.data;
}

export async function deleteSkill(
  skillId: number,
): Promise<void> {
  await api.delete(
    `${RESOURCE_MANAGER_ENDPOINTS.SKILLS}/${skillId}`,
  );
}

/* ================================================= */
/* EMPLOYEE SKILLS */
/* ================================================= */

export async function getEmployeeSkills(
  params: ListQueryParams = {},
): Promise<EmployeeSkill[]> {
  const response = await api.get<
    EmployeeSkill[]
  >(
    RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getEmployeeSkillById(
  employeeSkillId: number,
): Promise<EmployeeSkill> {
  const response =
    await api.get<EmployeeSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS}/${employeeSkillId}`,
    );

  return response.data;
}

export async function createEmployeeSkill(
  payload: CreateEmployeeSkillRequest,
): Promise<EmployeeSkill> {
  const response =
    await api.post<EmployeeSkill>(
      RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS,
      payload,
    );

  return response.data;
}

export async function replaceEmployeeSkill(
  employeeSkillId: number,
  payload: UpdateEmployeeSkillRequest,
): Promise<EmployeeSkill> {
  const response =
    await api.put<EmployeeSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS}/${employeeSkillId}`,
      payload,
    );

  return response.data;
}

export async function patchEmployeeSkill(
  employeeSkillId: number,
  payload: PatchEmployeeSkillRequest,
): Promise<EmployeeSkill> {
  const response =
    await api.patch<EmployeeSkill>(
      `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS}/${employeeSkillId}`,
      payload,
    );

  return response.data;
}

export async function deleteEmployeeSkill(
  employeeSkillId: number,
): Promise<void> {
  await api.delete(
    `${RESOURCE_MANAGER_ENDPOINTS.EMPLOYEE_SKILLS}/${employeeSkillId}`,
  );
}

/* ================================================= */
/* RESOURCE REQUESTS */
/* ================================================= */

export async function getResourceRequests(
  params: ListQueryParams = {},
): Promise<ResourceRequest[]> {
  const response = await api.get<
    ResourceRequest[]
  >(
    RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getResourceRequestById(
  requestId: number,
): Promise<ResourceRequest> {
  const response =
    await api.get<ResourceRequest>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS}/${requestId}`,
    );

  return response.data;
}

export async function createResourceRequest(
  payload: CreateResourceRequestRequest,
): Promise<ResourceRequest> {
  const response =
    await api.post<ResourceRequest>(
      RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS,
      payload,
    );

  return response.data;
}

export async function replaceResourceRequest(
  requestId: number,
  payload: UpdateResourceRequestRequest,
): Promise<ResourceRequest> {
  const response =
    await api.put<ResourceRequest>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS}/${requestId}`,
      payload,
    );

  return response.data;
}

export async function patchResourceRequest(
  requestId: number,
  payload: PatchResourceRequestRequest,
): Promise<ResourceRequest> {
  const response =
    await api.patch<ResourceRequest>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS}/${requestId}`,
      payload,
    );

  return response.data;
}

export async function deleteResourceRequest(
  requestId: number,
): Promise<void> {
  await api.delete(
    `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_REQUESTS}/${requestId}`,
  );
}

/* ================================================= */
/* RESOURCE ALLOCATIONS */
/* ================================================= */

export async function getResourceAllocations(
  params: ListQueryParams = {},
): Promise<ResourceAllocation[]> {
  const response = await api.get<
    ResourceAllocation[]
  >(
    RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getResourceAllocationById(
  allocationId: number,
): Promise<ResourceAllocation> {
  const response =
    await api.get<ResourceAllocation>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS}/${allocationId}`,
    );

  return response.data;
}

export async function createResourceAllocation(
  payload: CreateResourceAllocationRequest,
): Promise<ResourceAllocation> {
  const response =
    await api.post<ResourceAllocation>(
      RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS,
      payload,
    );

  return response.data;
}

export async function replaceResourceAllocation(
  allocationId: number,
  payload: UpdateResourceAllocationRequest,
): Promise<ResourceAllocation> {
  const response =
    await api.put<ResourceAllocation>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS}/${allocationId}`,
      payload,
    );

  return response.data;
}

export async function patchResourceAllocation(
  allocationId: number,
  payload: PatchResourceAllocationRequest,
): Promise<ResourceAllocation> {
  const response =
    await api.patch<ResourceAllocation>(
      `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS}/${allocationId}`,
      payload,
    );

  return response.data;
}

export async function deleteResourceAllocation(
  allocationId: number,
): Promise<void> {
  await api.delete(
    `${RESOURCE_MANAGER_ENDPOINTS.RESOURCE_ALLOCATIONS}/${allocationId}`,
  );
}

/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export async function getResourceManagerDashboardResources(): Promise<{
  employees: ResourceEmployee[];
  skills: ResourceSkill[];
  employeeSkills: EmployeeSkill[];
  resourceRequests: ResourceRequest[];
  allocations: ResourceAllocation[];
}> {
  const [
    employees,
    skills,
    employeeSkills,
    resourceRequests,
    allocations,
  ] = await Promise.all([
    getEmployees({
      skip: 0,
      limit: 100,
    }),

    getSkills({
      skip: 0,
      limit: 100,
    }),

    getEmployeeSkills({
      skip: 0,
      limit: 100,
    }),

    getResourceRequests({
      skip: 0,
      limit: 100,
    }),

    getResourceAllocations({
      skip: 0,
      limit: 100,
    }),
  ]);

  return {
    employees,
    skills,
    employeeSkills,
    resourceRequests,
    allocations,
  };
}

import type {
  ResourceMatch,
} from "@/types/resource-manager";

export async function getResourceRequestMatches(
  requestId: number,
): Promise<ResourceMatch[]> {
  const response =
    await api.get<ResourceMatch[]>(
      `/api/resource-manager/resource-requests/${requestId}/matches`,
    );

  return response.data;
}
