export interface ParsedSignals {
  open_violations: number
  health_based: number
  total_violations: number
  recent_violations: number
  monitoring_gaps: number
}

export interface CleanSignal {
  type: 'danger' | 'warning' | 'positive' | 'info'
  text: string
}

export interface TierInfo {
  key: string
  label: string
  color: string
  description: string
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
  source_water_label: string
  source_water_description: string
  admin_name: string
  email: string
  phone: string
  phone_formatted: string
  address: string
  violation_count: number
  lead_score: number
  tier: TierInfo
  parsed_signals: ParsedSignals
  clean_signals: CleanSignal[]
  email_draft: EmailDraft
}
