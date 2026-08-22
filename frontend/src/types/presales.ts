export type DeliveryModel =
  | "ONSITE"
  | "OFFSHORE"
  | "HYBRID"
  | string;

export type SolutionStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | string;

export interface Solution {
  id: number;

  opportunity_id: number;

  solution_name: string;

  solution_summary: string;

  technology_stack: string;

  architecture_notes: string;

  delivery_model: DeliveryModel;

  estimated_duration_months: number;

  presales_owner_id: number;

  solution_status: SolutionStatus;

  created_at: string;

  updated_at: string;
}

export interface CreateSolutionRequest {
  opportunity_id: number;

  solution_name: string;

  solution_summary: string;

  technology_stack: string;

  architecture_notes: string;

  delivery_model: DeliveryModel;

  estimated_duration_months: number;

  presales_owner_id: number;

  solution_status: SolutionStatus;
}

export type UpdateSolutionRequest =
  CreateSolutionRequest;

export type PatchSolutionRequest =
  Partial<CreateSolutionRequest>;

export interface PresalesTemplate {
  id: number;
  template_name: string;
  service_type: string;
  description: string | null;
  scope_content: string;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePresalesTemplateRequest {
  template_name: string;
  service_type: string;
  description: string | null;
  scope_content: string;
  is_active: boolean;
}

export type PatchPresalesTemplateRequest =
  Partial<CreatePresalesTemplateRequest>;



/* ------------------------------------------------ */
/* ESTIMATION */
/* ------------------------------------------------ */

export type EstimationModel =
  | "FIXED_PRICE"
  | "TIME_AND_MATERIAL"
  | string;

export type ApprovalStatus =
  | "READY_FOR_PROPOSAL"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | string;

export interface Estimation {
  id: number;

  solution_id: number;

  estimation_model: EstimationModel;

  resource_cost: string;

  infrastructure_cost: string;

  overhead_cost: string;

  contingency_percentage: number;

  contingency_amount: string;

  total_delivery_cost: string;

  billing_amount: string;

  expected_profit: string;

  expected_margin_percentage: number;

  currency: string;

  approval_status: ApprovalStatus;

  approved_by: number | null;

  approved_at: string | null;

  rejection_reason: string | null;

  created_at: string;

  updated_at: string;
}

export interface CreateEstimationRequest {
  solution_id: number;

  estimation_model: EstimationModel;

  resource_cost: number;

  infrastructure_cost: number;

  overhead_cost: number;

  contingency_percentage: number;

  billing_amount: number;

  currency: string;
}

export type UpdateEstimationRequest =
  CreateEstimationRequest;

export type PatchEstimationRequest =
  Partial<CreateEstimationRequest>;



/* ------------------------------------------------ */
/* RESOURCE REQUIREMENT */
/* ------------------------------------------------ */

export type ExperienceLevel =
  | "JUNIOR"
  | "MID_LEVEL"
  | "SENIOR"
  | string;

export type LocationType =
  | "ONSHORE"
  | "OFFSHORE"
  | "NEARSHORE";

export type AvailabilityStatus =
  | "AVAILABLE"
  | "PARTIALLY_AVAILABLE"
  | "ALLOCATED"
  | "PENDING"
  | string;

export interface ResourceRequirement {
  id: number;

  solution_id: number;

  role_name: string;

  skill_name: string;

  experience_level: ExperienceLevel;

  minimum_experience_years: number;

  quantity: number;

  location_type: LocationType;

  duration_months: number;

  allocation_percentage: number;

  cost_rate: string;

  billing_rate: string;

  availability_status: AvailabilityStatus;

  created_at: string;

  updated_at: string;
}

export interface CreateResourceRequirementRequest {
  solution_id: number;

  role_name: string;

  skill_name: string;

  experience_level: ExperienceLevel;

  minimum_experience_years: number;

  quantity: number;

  location_type: LocationType;

  duration_months: number;

  allocation_percentage: number;

  cost_rate: number;

  billing_rate: number;

  availability_status: AvailabilityStatus;
}

export type UpdateResourceRequirementRequest =
  CreateResourceRequirementRequest;

export type PatchResourceRequirementRequest =
  Partial<CreateResourceRequirementRequest>;



/* ------------------------------------------------ */
/* PROPOSAL */
/* ------------------------------------------------ */

export type ProposalStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | string;

export interface Proposal {
  id: number;

  solution_id: number;

  proposal_title: string;

  version: string;

  sow_document_url: string;

  proposal_document_url: string;

  submission_date: string | null;

  proposal_status: ProposalStatus;

  approval_status: ApprovalStatus;

  remarks: string;

  rejection_reason: string | null;

  created_at: string;

  updated_at: string;
}

export interface CreateProposalRequest {
  solution_id: number;

  proposal_title: string;

  version: string;

  sow_document: File;

  proposal_document: File;

  submission_date: string | null;

  proposal_status: ProposalStatus;

  approval_status: ApprovalStatus;

  remarks: string;
}

export interface UpdateProposalRequest {
  solution_id: number;
  proposal_title: string;
  version: string;
  sow_document_url: string;
  proposal_document_url: string;
  submission_date: string | null;
  proposal_status: ProposalStatus;
  approval_status: ApprovalStatus;
  remarks: string;
}

export type PatchProposalRequest =
  Partial<UpdateProposalRequest>;



/* ------------------------------------------------ */
/* DASHBOARD */
/* ------------------------------------------------ */

export interface PresalesDashboardData {
  solutions: Solution[];

  estimations: Estimation[];

  resourceRequirements: ResourceRequirement[];

  proposals: Proposal[];
}

export interface BlendedRateInput {
  location_type: "ONSHORE" | "NEARSHORE" | "OFFSHORE";
  resource_ratio: number;
  bill_rate: number;
  cost_rate: number;
  currency: string;
}

export interface CalculateBlendedRateRequest {
  estimation_id: number;
  rates: BlendedRateInput[];
}

export interface BlendedRateResult {
  estimation_id: number;
  total_ratio: string;
  blended_bill_rate: string;
  blended_cost_rate: string;
  blended_profit_per_hour: string;
  blended_margin_percentage: number;
  currency: string;
  rates: BlendedRateInput[];
}
