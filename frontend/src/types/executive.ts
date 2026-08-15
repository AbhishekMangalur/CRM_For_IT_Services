export interface ExecutiveKpiSnapshot {
  id: number;

  snapshot_month: string;

  total_pipeline_value: string;
  forecast_revenue: string;
  actual_revenue: string;

  gross_margin_percentage: number;
  win_rate: number;

  resource_utilization_percentage: number;
  bench_percentage: number;

  account_expansion_revenue: string;
  partner_influenced_pipeline: string;

  active_opportunities: number;
  won_opportunities: number;
  lost_opportunities: number;

  healthy_accounts: number;
  at_risk_accounts: number;

  active_contracts: number;
  contracts_due_for_renewal: number;

  total_employees: number;
  available_employees: number;
  allocated_employees: number;

  pending_resource_requests: number;
  pending_presales_approvals: number;

  created_at: string;
  updated_at: string;
}

export interface GenerateExecutiveKpiSnapshotRequest {
  snapshot_month: string;
}

export interface FinancialImportError {
  row: number;
  opportunity_id: string;
  message: string;
}

export interface FinancialImportResult {
  message: string;
  rows_processed: number;
  records_created: number;
  failed_rows: number;
  errors: FinancialImportError[];
}

export interface ExecutiveFinancialSummary {
  total_records: number;
  actual_revenue: string;
  actual_cost: string;
  actual_profit: string;
  actual_margin_percentage: string;
  projected_margin_percentage: string | null;
  margin_variance: string | null;
  timesheet_utilization_percentage: string | null;
  currency: string;
}

export interface RfpTurnaroundItem {
  rfp_id: number;
  rfp_number: string;
  title: string;
  received_date: string;
  completed_date: string;
  turnaround_days: number;
}

export interface RfpTurnaroundKpi {
  average_turnaround_days: number;
  completed_rfps: number;
  rfps: RfpTurnaroundItem[];
}

export interface AccountExpansionKpi {
  current_year: number;
  previous_year: number;
  current_year_revenue: number;
  previous_year_revenue: number;
  growth_amount: number;
  growth_percentage: number;
}

export interface PartnerInfluencedPipelineKpi {
  partner_influenced_pipeline: number;
  partner_influenced_won_value: number;
  active_partner_deals: number;
  won_partner_deals: number;
  total_referral_fees: number;
  total_tier_points: number;
}

export interface ExecutiveDashboardData {
  latest: ExecutiveKpiSnapshot | null;
  history: ExecutiveKpiSnapshot[];
}
