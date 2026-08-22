/* ================================================= */
/* RFP */
/* ================================================= */

export type RfpStatus =
  | "RECEIVED"
  | "EVALUATED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "NO_BID"
  | "WON"
  | "LOST"
  | string;

export type BidDecision =
  | "PENDING"
  | "BID"
  | "NO_BID"
  | string;

export interface Rfp {
  id: number;
  opportunity_id: number | null;

  rfp_number: string;
  title: string;

  client_name: string;
  industry: string;
  service_type: string;

  estimated_value: string;
  currency: string;

  received_date: string;
  submission_deadline: string;

  rfp_status: RfpStatus;
  bid_decision: BidDecision;

  source: string;

  description: string | null;

  owner_id: number;

  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateRfpRequest {
  opportunity_id: number;
  rfp_number: string;
  title: string;

  client_name: string;
  industry: string;
  service_type: string;

  estimated_value: number;
  currency: string;

  received_date: string;
  submission_deadline: string;

  rfp_status: RfpStatus;
  bid_decision: BidDecision;

  source: string;

  description: string | null;

  owner_id: number;
}

export type UpdateRfpRequest =
  CreateRfpRequest;

export type PatchRfpRequest =
  Partial<CreateRfpRequest>;


/* ================================================= */
/* BID EVALUATION */
/* ================================================= */

export type BidRecommendation =
  | "BID"
  | "NO_BID"
  | string;

export interface BidEvaluation {
  id: number;

  rfp_id: number;

  strategic_fit_score: number;
  technical_fit_score: number;
  resource_availability_score: number;
  profitability_score: number;
  win_probability: number;

  overall_score: number;

  recommendation:
    BidRecommendation;

  evaluated_by: number;

  comments: string | null;

  created_at: string;
}

export interface CreateBidEvaluationRequest {
  rfp_id: number;

  strategic_fit_score: number;
  technical_fit_score: number;
  resource_availability_score: number;
  profitability_score: number;
  win_probability: number;

  evaluated_by: number;

  comments: string | null;
}

export interface UpdateBidEvaluationRequest {
  rfp_id: number;

  strategic_fit_score: number;
  technical_fit_score: number;
  resource_availability_score: number;
  profitability_score: number;
  win_probability: number;

  evaluated_by: number;

  comments: string | null;
}

export type PatchBidEvaluationRequest =
  Partial<UpdateBidEvaluationRequest>;


/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export interface RfpDashboardData {
  rfps: Rfp[];
  evaluations: BidEvaluation[];
}
