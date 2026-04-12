// EPA Violation type definitions — plain English
// Maps violation category/rule to human-readable explanation

export const VIOLATION_DEFINITIONS: Record<string, {
  full_name: string
  plain_english: string
  health_risk: 'high' | 'medium' | 'low' | 'none'
  raybern_signal: string
}> = {
  // Total Coliform Rule
  'TCR': {
    full_name: 'Total Coliform Rule',
    plain_english: 'Utility missed required tests for bacteria in the water distribution system, or results exceeded limits.',
    health_risk: 'medium',
    raybern_signal: 'Monitoring violations often indicate data collection or reporting workflow failures — exactly what Raybern audits.',
  },
  // Surface Water Treatment Rule
  'SWTR': {
    full_name: 'Surface Water Treatment Rule',
    plain_english: 'Required treatment for surface water sources (rivers, lakes, reservoirs) was not properly applied or monitored.',
    health_risk: 'high',
    raybern_signal: 'Treatment compliance depends on real-time SCADA data feeding compliance reports — data pipeline audit opportunity.',
  },
  // Disinfection Byproducts
  'DBP': {
    full_name: 'Disinfection Byproduct Rule',
    plain_english: 'Levels of chemical byproducts from water treatment (like chlorine) exceeded legal limits or monitoring was missed.',
    health_risk: 'medium',
    raybern_signal: 'DBP monitoring violations often trace to lab data management or reporting system failures.',
  },
  // Lead and Copper Rule
  'LCR': {
    full_name: 'Lead and Copper Rule',
    plain_english: 'Sampling for lead or copper in customer taps was missed, improperly conducted, or exceeded action levels.',
    health_risk: 'high',
    raybern_signal: 'Lead/copper sampling program violations frequently indicate inadequate sampling site management in the CIS/billing system.',
  },
  // Monitoring/Reporting
  'MR': {
    full_name: 'Monitoring & Reporting',
    plain_english: 'Required water quality tests were not conducted on schedule, or results were not submitted to the state on time.',
    health_risk: 'none',
    raybern_signal: 'Pure data workflow failure — this is the most direct signal of a broken operations/reporting pipeline that Raybern can fix.',
  },
  // Nitrate
  'NITRTE': {
    full_name: 'Nitrate MCL Violation',
    plain_english: 'Nitrate levels in the water exceeded the maximum contaminant level (10 mg/L). Can be harmful to infants.',
    health_risk: 'high',
    raybern_signal: 'Source water quality issue — may require treatment system upgrade or source diversification analysis.',
  },
  // Other rule types
  'OTHER': {
    full_name: 'Other Rule Violation',
    plain_english: 'Violation of a specific EPA rule not covered by the major categories above.',
    health_risk: 'low',
    raybern_signal: 'Evaluate specific rule to determine Raybern service relevance.',
  },
  'RTCR': {
    full_name: 'Revised Total Coliform Rule',
    plain_english: 'Updated bacteria monitoring rule — missed tests or positive coliform detections in the distribution system.',
    health_risk: 'medium',
    raybern_signal: 'Same as TCR — monitoring workflow and data reporting audit opportunity.',
  },
  'NPDWR': {
    full_name: 'National Primary Drinking Water Regulation',
    plain_english: 'Violation of a federally enforceable maximum contaminant level or treatment technique.',
    health_risk: 'high',
    raybern_signal: 'Treatment and compliance reporting audit opportunity.',
  },
  'SDWA': {
    full_name: 'Safe Drinking Water Act',
    plain_english: 'General SDWA compliance violation — covers reporting, monitoring, or public notification requirements.',
    health_risk: 'low',
    raybern_signal: 'Regulatory compliance audit — public notification system and reporting workflow review.',
  },
}

export function getViolationDef(category: string) {
  if (!category) return null
  const upper = category.toUpperCase()
  // Try exact match
  if (VIOLATION_DEFINITIONS[upper]) return VIOLATION_DEFINITIONS[upper]
  // Try prefix match
  for (const key of Object.keys(VIOLATION_DEFINITIONS)) {
    if (upper.includes(key) || key.includes(upper)) return VIOLATION_DEFINITIONS[key]
  }
  return VIOLATION_DEFINITIONS['OTHER']
}
