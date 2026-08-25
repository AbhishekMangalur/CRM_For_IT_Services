/* ================================================= */
/* EMPLOYEES */
/* ================================================= */

export type EmploymentType =
  | "FULL_TIME"
  | "CONTRACT"
  | "PART_TIME"
  | string;

export type EmployeeAvailabilityStatus =
  | "AVAILABLE"
  | "PARTIALLY_AVAILABLE"
  | "SOFT_BOOKED"
  | "ALLOCATED"
  | "UNAVAILABLE"
  | string;

export interface ResourceEmployee {
  id: number;

  employee_code: string;
  full_name: string;
  email: string;

  designation: string;
  department: string;

  total_experience_years: number;
  location: string;

  employment_type: EmploymentType;

  cost_rate: string;
  currency: string;

  availability_status:
    EmployeeAvailabilityStatus;

  available_from: string | null;

  current_utilization_percentage: number;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeRequest {
  employee_code: string;
  full_name: string;
  email: string;

  designation: string;
  department: string;

  total_experience_years: number;
  location: string;

  employment_type: EmploymentType;

  cost_rate: number;
  currency: string;

  availability_status:
    EmployeeAvailabilityStatus;

  available_from: string | null;

  current_utilization_percentage: number;

  is_active: boolean;
}

export type UpdateEmployeeRequest =
  CreateEmployeeRequest;

export type PatchEmployeeRequest =
  Partial<CreateEmployeeRequest>;

export interface EmployeeImportError {
  row: number;
  employee_code: string;
  message: string;
}

export interface EmployeeImportResult {
  message: string;
  rows_processed: number;
  employees_created: number;
  employees_updated: number;
  employees_skipped: number;
  failed_rows: number;
  errors: EmployeeImportError[];
}


/* ================================================= */
/* SKILLS */
/* ================================================= */

export interface ResourceSkill {
  id: number;

  name: string;
  category: string;
  description: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateSkillRequest {
  name: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

export type UpdateSkillRequest =
  CreateSkillRequest;

export type PatchSkillRequest =
  Partial<CreateSkillRequest>;


/* ================================================= */
/* EMPLOYEE SKILLS */
/* ================================================= */

export type ProficiencyLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT"
  | string;

export interface EmployeeSkill {
  id: number;

  employee_id: number;
  skill_id: number;

  proficiency_level: ProficiencyLevel;

  experience_years: number;

  certification_name: string | null;
  certification_number: string | null;

  certification_expiry_date: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeSkillRequest {
  employee_id: number;
  skill_id: number;

  proficiency_level: ProficiencyLevel;

  experience_years: number;

  certification_name: string | null;
  certification_number: string | null;

  certification_expiry_date: string | null;
}

export type UpdateEmployeeSkillRequest =
  CreateEmployeeSkillRequest;

export type PatchEmployeeSkillRequest =
  Partial<CreateEmployeeSkillRequest>;


/* ================================================= */
/* RESOURCE REQUESTS */
/* ================================================= */

export type ResourceExperienceLevel =
  | "JUNIOR"
  | "MID_LEVEL"
  | "SENIOR"
  | string;

export type ResourceLocationType =
  | "ONSITE"
  | "OFFSHORE"
  | "HYBRID"
  | string;

export type ResourceRequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "ALLOCATED"
  | "CANCELLED"
  | string;

export interface ResourceRequest {
  id: number;

  opportunity_id: number | null;
  solution_id: number | null;

  requested_role: string;
  required_skill: string;

  experience_level:
    ResourceExperienceLevel;

  minimum_experience_years: number;

  quantity: number;

  required_from: string;
  required_until: string | null;

  allocation_percentage: number;

  location_type:
    ResourceLocationType;

  request_status:
    ResourceRequestStatus;

  requested_by: number;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateResourceRequestRequest {
  opportunity_id: number | null;
  solution_id: number | null;

  requested_role: string;
  required_skill: string;

  experience_level:
    ResourceExperienceLevel;

  minimum_experience_years: number;

  quantity: number;

  required_from: string;
  required_until: string | null;

  allocation_percentage: number;

  location_type:
    ResourceLocationType;

  request_status:
    ResourceRequestStatus;

  requested_by: number;

  notes: string | null;
}

export type UpdateResourceRequestRequest =
  CreateResourceRequestRequest;

export type PatchResourceRequestRequest =
  Partial<CreateResourceRequestRequest>;


/* ================================================= */
/* RESOURCE ALLOCATIONS */
/* ================================================= */

export type AllocationType =
  | "SOFT_BOOKING"
  | "HARD_BOOKING"
  | string;

export type AllocationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface ResourceAllocation {
  id: number;

  employee_id: number;

  opportunity_id: number | null;
  solution_id: number | null;

  resource_request_id: number | null;

  allocation_type: AllocationType;

  allocation_percentage: number;

  start_date: string;
  end_date: string | null;

  allocation_status:
    AllocationStatus;

  allocated_by: number;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateResourceAllocationRequest {
  employee_id: number;

  opportunity_id: number | null;
  solution_id: number | null;

  resource_request_id: number | null;

  allocation_type: AllocationType;

  allocation_percentage: number;

  start_date: string;
  end_date: string | null;

  allocation_status:
    AllocationStatus;

  allocated_by: number;

  notes: string | null;
}

export type UpdateResourceAllocationRequest =
  CreateResourceAllocationRequest;

export type PatchResourceAllocationRequest =
  Partial<CreateResourceAllocationRequest>;


/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export interface ResourceManagerDashboardData {
  employees: ResourceEmployee[];
  skills: ResourceSkill[];
  employeeSkills: EmployeeSkill[];
  resourceRequests: ResourceRequest[];
  allocations: ResourceAllocation[];
}

export type ResourceMatchStatus =
  | "EXCELLENT"
  | "GOOD"
  | "MODERATE"
  | "LOW";

export interface ResourceMatch {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string;

  skill_id: number;
  required_skill: string;
  skill_proficiency: string;
  skill_experience_years: number;

  total_experience_years: number;

  availability_status: string;
  available_from: string | null;

  current_utilization_percentage: number;
  requested_allocation_percentage: number;
  remaining_capacity_percentage: number;

  skill_match_score: number;
  experience_match_score: number;
  availability_match_score: number;
  utilization_match_score: number;

  match_score: number;
  match_status: ResourceMatchStatus;
}
