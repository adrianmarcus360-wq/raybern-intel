export interface ViolationDetail {
  violation_id: string
  category: string
  category_code: string
  contaminant: string
  contaminant_code: string
  is_health_based: boolean
  is_major: boolean
  begin_date: string
  begin_date_raw: string
  end_date: string
  rtc_date: string
  enforcement_date: string
  enforcement_action: string
  status: 'Open' | 'Active' | 'Resolved' | string
  status_code: string
}

export interface Facility {
  name: string
  type: string
  type_code: string
  is_source: boolean
  activity: string
}

export interface SystemProfile {
  pws_type: string
  pws_type_code: string
  activity: string
  owner_type: string
  owner_type_code: string
  epa_region: string
  primary_source_code: string
  primary_source_label: string
  org_name: string
  is_wholesaler: boolean
}

export interface DataSource {
  name: string
  org: string
  url: string
  description: string
}

export interface RaybernFit {
  primary_service: string
  signals: string[]
  discovery_questions: string[]
}

export interface VendorIntelligence {
  type: string
  purchase_type: string
  note: string
}

export interface ViolationsSummary {
  total: number
  open: number
  resolved: number
  health_based: number
  open_health_based: number
  major: number
  latest_date: string
  oldest_date: string
}

export interface TierInfo {
  key: string
  label: string
  color: string
  description: string
}

export interface CleanSignal {
  type: 'danger' | 'warning' | 'positive' | 'info'
  text: string
}

export interface EmailDraft {
  subject: string
  body: string
}

export interface Lead {
  pwsid: string
  name: string
  city: string
  state: string
  target_group: string
  population: number
  connections: number
  source_water: string
  admin_name: string
  email: string | null
  phone: string
  address: string
  violation_count: number
  lead_score: number
  tier: TierInfo
  signals: string[]
  phone_formatted: string
  source_water_label: string
  source_water_description: string
  parsed_signals: {
    open_violations: number
    health_based: number
    total_violations: number
    recent_violations: number
    monitoring_gaps: number
  }
  clean_signals: CleanSignal[]
  email_draft: EmailDraft

  // Enriched fields
  system_profile?: SystemProfile
  violations_detail?: ViolationDetail[]
  violations_summary?: ViolationsSummary
  facilities?: Facility[]
  vendor_intelligence?: VendorIntelligence
  raybern_fit?: RaybernFit
  data_sources?: DataSource[]
  pwsid_url?: string
  echo_url?: string
}
