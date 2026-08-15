export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "UNQUALIFIED"
  | "CONVERTED";

export type LeadPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface SalesLead {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  designation: string | null;
  lead_source: string | null;
  lead_status: LeadStatus;
  priority: LeadPriority;
  estimated_value: string;
  assigned_sales_id: number | null;
  next_follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  designation: string | null;
  lead_source: string | null;
  lead_status: LeadStatus;
  priority: LeadPriority;
  estimated_value: number;
  assigned_sales_id: number | null;
  next_follow_up_date: string | null;
  notes: string | null;
}

export type UpdateLeadRequest = CreateLeadRequest;

export type PatchLeadRequest =
  Partial<CreateLeadRequest>;

export type OpportunityStatus =
  | "OPEN"
  | "WON"
  | "LOST"
  | "CLOSED"
  | string;

export type PipelineStage =
  | "PROSPECTING"
  | "QUALIFICATION"
  | "SOLUTION_DESIGN"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST"
  | string;

export interface SalesOpportunity {
  id: number;
  lead_id: number | null;
  opportunity_name: string;
  client_name: string;
  service_type: string;
  industry: string;
  deal_value: string;
  currency: string;
  pipeline_stage: PipelineStage;
  win_probability: number;
  expected_close_date: string | null;
  expected_start_date: string | null;
  sales_owner_id: number;
  presales_owner_id: number | null;
  status: OpportunityStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "FOLLOW_UP"
  | "FOLLOW_UP_MEETING"
  | "PROPOSAL_DISCUSSION"
  | "CLIENT_PRESENTATION"
  | string;

export interface SalesActivity {
  id: number;
  lead_id: number | null;
  opportunity_id: number | null;
  user_id: number;
  activity_type: ActivityType;
  subject: string;
  activity_date: string;
  next_follow_up_date: string | null;
  notes: string | null;
  status: ActivityStatus;
  created_at: string;
}

export interface CreateActivityRequest {
  lead_id: number | null;
  opportunity_id: number | null;
  user_id: number;
  activity_type: ActivityType;
  subject: string;
  activity_date: string;
  next_follow_up_date: string | null;
  notes: string | null;
  status: ActivityStatus;
}

export type UpdateActivityRequest =
  CreateActivityRequest;

export type PatchActivityRequest =
  Partial<CreateActivityRequest>;

export interface PipelineStageData {
  stage: string;
  count: number;
  value: number;
}

export interface SalesDashboardData {
  leads: SalesLead[];
  opportunities: SalesOpportunity[];
  activities: SalesActivity[];

  totalPipelineValue: number;
  openOpportunities: number;
  averageWinProbability: number;
  pendingFollowUps: number;

  totalLeads: number;
  qualifiedLeads: number;
  highPriorityLeads: number;
  completedActivities: number;

  recentOpportunities: SalesOpportunity[];
  recentActivities: SalesActivity[];
  upcomingFollowUps: SalesActivity[];
  pipelineStages: PipelineStageData[];
}

export interface CreateOpportunityRequest {
  lead_id: number;
  opportunity_name: string;
  client_name: string;
  service_type: string;
  industry: string;
  deal_value: number;
  currency: string;
  pipeline_stage: PipelineStage;
  win_probability: number;
  expected_close_date: string | null;
  expected_start_date: string | null;
  sales_owner_id: number;
  presales_owner_id: number | null;
  status: OpportunityStatus;
  description: string | null;
}

export type UpdateOpportunityRequest =
  CreateOpportunityRequest;

export type PatchOpportunityRequest =
  Partial<CreateOpportunityRequest>;