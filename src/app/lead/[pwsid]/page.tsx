import { notFound } from 'next/navigation'
import Link from 'next/link'
import leadsData from '@/data/leads_v4.json'
import { CopyButton } from '@/components/CopyButton'
import { EmailSequence } from '@/components/EmailSequence'
import { StatusTracker } from '@/components/StatusTracker'
import { ConfidenceBadge, SectionWithConfidence } from '@/components/ConfidenceBadge'
import { TimelineView } from '@/components/TimelineView'

const leads = leadsData as any[]

export async function generateStaticParams() {
  return leads.map(l => ({ pwsid: l.pwsid }))
}

// ---- Helpers ----

const VIOLATION_DEFS: Record<string, { plain: string; signal: string }> = {
  'TCR':   { plain: 'Required bacteria tests missed or exceeded limits in distribution system.', signal: 'Monitoring workflow failure — Raybern audit territory.' },
  'RTCR':  { plain: 'Updated bacteria monitoring rule — missed tests or positive coliform in distribution.', signal: 'Same as TCR — reporting pipeline gap.' },
  'SWTR':  { plain: 'Required surface water treatment not properly applied or monitored.', signal: 'SCADA/treatment data pipeline audit opportunity.' },
  'DBP':   { plain: 'Disinfection byproduct levels exceeded limits or monitoring was missed.', signal: 'Lab data management or reporting system failure.' },
  'LCR':   { plain: 'Lead/copper sampling missed, improperly conducted, or exceeded action levels.', signal: 'CIS sampling site management gap — direct Raybern opportunity.' },
  'MR':    { plain: 'Required water quality tests not conducted on schedule or results not submitted on time.', signal: 'Pure data workflow failure — most direct Raybern signal.' },
  'NITRTE':{ plain: 'Nitrate levels exceeded 10 mg/L — harmful to infants.', signal: 'Treatment upgrade or source analysis needed.' },
  'NPDWR': { plain: 'Federal maximum contaminant level or treatment technique violated.', signal: 'Treatment + compliance reporting audit.' },
}
function getViolDef(category: string) {
  if (!category) return null
  const upper = category.toUpperCase()
  for (const key of Object.keys(VIOLATION_DEFS)) {
    if (upper.includes(key)) return { ...VIOLATION_DEFS[key], key }
  }
  return null
}

type Confidence = 'verified' | 'high' | 'medium' | 'low' | 'none'
function confFromStr(s: string | undefined): Confidence {
  if (!s || s === 'none') return 'none'
  return s as Confidence
}

const TIER_STYLE: Record<string, string> = {
  'Tier 1': 'tier-hot', 'Tier 2': 'tier-warm',
  'Tier 3': 'tier-lukewarm', 'Watch': 'tier-watch',
}

function VendorRow({ label, data }: { label: string; data: any }) {
  if (!data) return (
    <tr>
      <td className="py-2 pr-4 text-xs font-semibold" style={{ color: 'var(--text-muted)', width: 140 }}>{label}</td>
      <td className="py-2">
        <span className="text-xs italic" style={{ color: 'var(--text-light)' }}>Not found in public records</span>
        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs" style={{ background: '#F9FAFB', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>Unverified · 18%</span>
      </td>
    </tr>
  )
  const conf = confFromStr(data.confidence)
  const confPct = { verified: 97, high: 85, medium: 62, low: 35, none: 18 }[conf]
  const confColors: Record<Confidence, { bg: string; color: string; border: string }> = {
    verified: { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
    high:     { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
    medium:   { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
    low:      { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    none:     { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
  }
  const cc = confColors[conf]
  return (
    <tr>
      <td className="py-2 pr-4 text-xs font-semibold" style={{ color: 'var(--text-muted)', width: 140 }}>{label}</td>
      <td className="py-2">
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-sm font-semibold">{data.product}</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border"
            style={{ background: cc.bg, color: cc.color, borderColor: cc.border }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cc.color }}></span>
            {conf === 'none' ? 'Unverified' : conf.charAt(0).toUpperCase() + conf.slice(1)} · {confPct}%
          </span>
          {data.source_url && (
            <a href={data.source_url} target="_blank" rel="noopener" className="text-xs underline" style={{ color: '#2B5080' }}>source ↗</a>
          )}
        </div>
        {data.evidence && (
          <div className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{data.evidence.slice(0, 120)}{data.evidence.length > 120 ? '…' : ''}"</div>
        )}
      </td>
    </tr>
  )
}

export default function LeadDetailPage({ params }: { params: { pwsid: string } }) {
  const lead = leads.find(l => l.pwsid === params.pwsid)
  if (!lead) notFound()

  const tech   = lead.tech_intel || {}
  const vendor = lead.vendor_intel || {}
  const vs     = lead.violations_summary || {}
  const openCount = (vs.open || 0) + (lead.violations_detail?.filter((v: any) => v.status === 'Active')?.length || 0)
  const isMunis  = (tech.billing_software || '').toLowerCase().includes('munis')
  const allContacts = [
    { name: lead.admin_name, title: 'Water System Administrator', email: lead.email, phone: lead.phone_formatted, primary: true },
    ...(tech.additional_contacts || []).map((c: any) => ({ ...c, primary: false })),
  ]

  // Score component breakdown
  const scoreComponents = [
    { label: 'Open Violations', pts: Math.min(openCount * 10, 40), max: 40, desc: `${openCount} × 10 pts`, color: '#DC2626' },
    { label: 'Violation History', pts: Math.round(Math.min((vs.total || 0) * 1.5, 15)), max: 15, desc: `${vs.total} × 1.5`, color: '#9A3412' },
    { label: 'Population Scale', pts: lead.population > 50000 ? 10 : lead.population > 20000 ? 7 : 4, max: 10, desc: lead.population?.toLocaleString(), color: '#1B3A5C' },
    { label: 'Technology Match', pts: lead.score_boost || 0, max: 35, desc: tech.billing_software || 'Not found', color: '#16A34A' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ background: 'var(--navy)', borderBottom: '1px solid #0D1E30' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: '#2B5080' }}>R</div>
            <div>
              <div className="text-white font-semibold text-base leading-tight">Raybern Prospect Intelligence</div>
              <div className="text-xs" style={{ color: '#7EA4C4' }}>Full Intelligence Profile</div>
            </div>
          </div>
          <Link href="/" className="text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: '#2B5080', color: '#D9E4EF' }}>← All Prospects</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ─── Hero Bar ─── */}
        <div className="detail-card mb-5" style={{ borderLeft: `4px solid var(--navy)` }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLE[lead.tier?.key] || 'tier-watch'}`}>
                  {lead.tier?.label}
                </span>
                {openCount > 0 && (
                  <span className="badge-open px-2.5 py-0.5 rounded-full text-xs font-semibold">⚠ {openCount} Open Violation{openCount > 1 ? 's' : ''}</span>
                )}
                {isMunis && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FCD34D' }}>★ Tyler MUNIS</span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>{lead.pwsid}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{lead.name}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lead.address}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusTracker pwsid={lead.pwsid} />
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold"
                  style={{
                    borderColor: lead.lead_score >= 70 ? '#EF4444' : lead.lead_score >= 50 ? '#F97316' : '#EAB308',
                    color: lead.lead_score >= 70 ? '#991B1B' : lead.lead_score >= 50 ? '#9A3412' : '#854D0E',
                    background: lead.lead_score >= 70 ? '#FEE2E2' : lead.lead_score >= 50 ? '#FFF7ED' : '#FEFCE8',
                  }}>
                  {lead.lead_score}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Lead Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Score Breakdown ─── */}
        <div className="detail-card mb-5" style={{ borderLeft: '3px solid #6366F1' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="!mb-0">Why This Score is {lead.lead_score}/100</h3>
            <ConfidenceBadge level="verified" tooltip="Score calculated directly from EPA data + web research" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {scoreComponents.map(s => {
              const pct = Math.round((s.pts / s.max) * 100)
              return (
                <div key={s.label} className="rounded-lg p-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>+{s.pts} pts</span>
                  </div>
                  <div className="w-full rounded-full h-1.5 mb-2" style={{ background: 'var(--border)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }}></div>
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>max {s.max} pts</div>
                </div>
              )
            })}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Total: {scoreComponents.reduce((s, c) => s + c.pts, 0)} pts → displayed as {lead.lead_score}/100.
            Scores &lt;25 = Watch · 25–44 = Tier 3 · 45–64 = Tier 2 · 65+ = Tier 1
          </div>
        </div>

        {/* ─── Raybern Positioning ─── */}
        {tech.raybern_positioning && (
          <div className="detail-card mb-5" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFDF0' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-base mb-1" style={{ color: '#92400E' }}>
                    {tech.raybern_positioning.headline}
                  </div>
                  <ConfidenceBadge level="high" tooltip="Based on documented Raybern case studies and public system data" />
                </div>
                <p className="text-sm mb-3" style={{ color: '#78350F' }}>{tech.raybern_positioning.detail}</p>
                <div className="rounded-lg p-3 border" style={{ background: 'white', borderColor: '#FCD34D' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>📞 OPENING LINE</div>
                  <p className="text-sm italic">{tech.raybern_positioning.call_to_action}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3-col: Profile + Tech Stack + Violations Summary ─── */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">

          {/* System Profile */}
          <div>
            <SectionWithConfidence title="System Profile"
              level="verified"
              sourceLabel="EPA SDWIS"
              sourceUrl={`https://enviro.epa.gov/enviro/sdw_report_v3.first_table?pws_id=${lead.pwsid}&state_code=${lead.state}&source=Surface water&population=&sys_num=0`}
              tooltip="Direct from EPA Safe Drinking Water Information System (SDWIS)">
              <div className="space-y-2">
                {[
                  { label: 'System Type', val: lead.system_profile?.pws_type || 'Community Water System' },
                  { label: 'Owner Type',  val: lead.system_profile?.owner_type || '—' },
                  { label: 'Status',      val: lead.system_profile?.activity || 'Active' },
                  { label: 'Population',  val: lead.population?.toLocaleString() },
                  { label: 'Connections', val: lead.connections?.toLocaleString() },
                  { label: 'Water Source', val: lead.source_water_label },
                  { label: 'EPA Region',  val: lead.system_profile?.epa_region ? `Region ${lead.system_profile.epa_region}` : '—' },
                  { label: 'Wholesaler',  val: lead.system_profile?.is_wholesaler ? 'Yes' : 'No' },
                ].map(r => (
                  <div key={r.label} className="flex gap-2">
                    <span className="text-xs font-semibold w-28 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                    <span className="text-xs flex-1">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                Source: <a href={`https://enviro.epa.gov/enviro/sdw_report_v3.first_table?pws_id=${lead.pwsid}&state_code=${lead.state}&source=Surface water&population=&sys_num=0`}
                  target="_blank" rel="noopener" className="underline" style={{ color: '#2B5080' }}>EPA SDWIS ↗</a>
              </div>
            </SectionWithConfidence>
          </div>

          {/* Technology Stack */}
          <div>
            <SectionWithConfidence title="Billing & Meter Technology"
              level={confFromStr(tech.billing_software_confidence || tech.ami_system_confidence)}
              sourceLabel="Web research"
              tooltip="Researched from public utility records, annual reports, and procurement documents">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>💻 BILLING / CIS SYSTEM</span>
                    <ConfidenceBadge level={confFromStr(tech.billing_software_confidence)} inline />
                  </div>
                  {tech.billing_software ? (
                    <div>
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold border ${isMunis ? 'border-yellow-300' : 'border-blue-200'}`}
                        style={{ background: isMunis ? '#FFFBEB' : '#EFF6FF', color: isMunis ? '#92400E' : '#1E40AF' }}>
                        {tech.billing_software} {isMunis && '★'}
                      </span>
                      {tech.billing_software_evidence && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{tech.billing_software_evidence.slice(0, 100)}…"</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'var(--text-light)' }}>Not found in public records</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>📡 AMI / METER READING</span>
                    <ConfidenceBadge level={confFromStr(tech.ami_system_confidence)} inline />
                  </div>
                  {tech.ami_system ? (
                    <div>
                      <span className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200"
                        style={{ background: '#EFF6FF', color: '#1E40AF' }}>{tech.ami_system}</span>
                      {tech.ami_system_evidence && (
                        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>"{tech.ami_system_evidence.slice(0, 100)}…"</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm italic" style={{ color: 'var(--text-light)' }}>Not found in public records</span>
                  )}
                </div>
                {tech.tech_notes && (
                  <div className="pt-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Notes: </span>
                    {tech.tech_notes}
                  </div>
                )}
                {tech.contract_signals && (
                  <div className="rounded p-2 text-xs" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}>
                    📋 {tech.contract_signals}
                  </div>
                )}
              </div>
            </SectionWithConfidence>
          </div>

          {/* Violations Summary */}
          <div>
            <SectionWithConfidence title="Violations at a Glance"
              level="verified"
              sourceLabel="EPA ECHO"
              sourceUrl={`https://echo.epa.gov/detailed-facility-report?fid=${lead.pwsid}`}
              tooltip="Direct from EPA SDWIS violation database">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Total on Record', val: vs.total ?? lead.violation_count, warn: false },
                  { label: 'Open / Active',   val: openCount, warn: openCount > 0 },
                  { label: 'Health-Based',    val: vs.health_based ?? 0, warn: (vs.health_based || 0) > 0 },
                  { label: 'Resolved',        val: vs.resolved ?? 0, warn: false },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="text-xl font-bold" style={{ color: s.warn ? '#B91C1C' : 'var(--navy)' }}>{s.val}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {(lead.clean_signals || []).slice(0, 3).map((sig: any, i: number) => (
                  <div key={i} className={`signal-${sig.type} px-3 py-2 rounded text-xs`}>{sig.text}</div>
                ))}
              </div>
            </SectionWithConfidence>
          </div>
        </div>

        {/* ─── Extended Vendor / Technology Profile ─── */}
        <div className="detail-card mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="!mb-0">Full Technology & Vendor Profile</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Every system category a water utility operates. All data sourced from public records.</p>
            </div>
            <ConfidenceBadge level="medium" tooltip="Web-researched from public procurement records, annual reports, conference materials" />
          </div>

          {/* Core systems table */}
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Core Systems</div>
            <table className="w-full">
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                <VendorRow label="Billing / CIS"
                  data={tech.billing_software ? {
                    product: tech.billing_software,
                    confidence: tech.billing_software_confidence,
                    evidence: tech.billing_software_evidence,
                    source_url: null,
                  } : null} />
                <VendorRow label="AMI / Meter"
                  data={tech.ami_system ? {
                    product: tech.ami_system,
                    confidence: tech.ami_system_confidence,
                    evidence: tech.ami_system_evidence,
                    source_url: null,
                  } : null} />
                <VendorRow label="GIS" data={vendor.vendors?.gis || null} />
                <VendorRow label="SCADA / Control" data={vendor.vendors?.scada || null} />
                <VendorRow label="Asset Management" data={vendor.vendors?.asset_management || null} />
                <VendorRow label="Customer Portal" data={vendor.vendors?.customer_portal || null} />
                <VendorRow label="Financial / ERP"
                  data={vendor.vendors?.financial_erp || (tech.billing_software?.toLowerCase().includes('munis') ? {
                    product: 'Tyler MUNIS (ERP + Billing)',
                    confidence: tech.billing_software_confidence,
                    evidence: tech.billing_software_evidence,
                    source_url: null,
                  } : null)} />
              </tbody>
            </table>
          </div>

          {/* Consulting firms */}
          {vendor.consulting_firms?.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                Engineering & Consulting Firms
                <ConfidenceBadge level="medium" tooltip="Found in public procurement records and project announcements" />
              </div>
              <div className="space-y-2">
                {vendor.consulting_firms.map((firm: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <span className="text-sm shrink-0">🏢</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{firm.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                          style={{ background: '#EDE9FE', color: '#4C1D95' }}>{firm.type}</span>
                        {firm.year && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{firm.year}</span>}
                      </div>
                      {firm.engagement && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{firm.engagement}</p>}
                    </div>
                    {firm.source_url && (
                      <a href={firm.source_url} target="_blank" rel="noopener" className="text-xs underline shrink-0" style={{ color: '#2B5080' }}>source ↗</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chemical suppliers */}
          {vendor.chemical_suppliers?.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                Chemical & Treatment Suppliers
                <ConfidenceBadge level="low" tooltip="Limited public procurement data for chemical suppliers" />
              </div>
              <div className="flex flex-wrap gap-2">
                {vendor.chemical_suppliers.map((s: any, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm"
                    style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#065F46' }}>
                    🧪 {s.name}
                    {s.source_url && <a href={s.source_url} target="_blank" rel="noopener" className="underline text-xs">↗</a>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Public contracts */}
          {vendor.public_contracts?.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-3 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                Public Contracts & Procurement
                <ConfidenceBadge level="medium" tooltip="Sourced from public bid/contract records" />
              </div>
              <div className="space-y-2">
                {vendor.public_contracts.map((c: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <span className="text-sm shrink-0">📋</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm">{c.description}</span>
                        {c.value && <span className="font-semibold text-sm" style={{ color: '#065F46' }}>{c.value}</span>}
                        {c.vendor && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#EFF6FF', color: '#1E40AF' }}>{c.vendor}</span>}
                        {c.year && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.year}</span>}
                      </div>
                    </div>
                    {c.source_url && (
                      <a href={c.source_url} target="_blank" rel="noopener" className="text-xs underline shrink-0" style={{ color: '#2B5080' }}>source ↗</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!vendor.consulting_firms?.length && !vendor.public_contracts?.length && (
            <div className="rounded-lg p-4 text-sm text-center" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              No consulting engagements or public contracts found in publicly available records.
            </div>
          )}
        </div>

        {/* ─── Activity News ─── */}
        {(tech.recent_news?.length > 0 || tech.recent_rfps?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {tech.recent_news?.length > 0 && (
              <div className="detail-card">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="!mb-0">Recent News & Activity</h3>
                  <ConfidenceBadge level="medium" tooltip="Web-researched news items — verify dates before using" />
                </div>
                <div className="space-y-2">
                  {tech.recent_news.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0" style={{ color: '#6366F1' }}>→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tech.recent_rfps?.length > 0 && (
              <div className="detail-card">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="!mb-0">RFP & Procurement Signals</h3>
                  <ConfidenceBadge level="medium" tooltip="Indicates active purchasing — verify directly with utility" />
                </div>
                <div className="space-y-2">
                  {tech.recent_rfps.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0">📋</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 5-Year Timeline ─── */}
        <div className="detail-card mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="!mb-0">5-Year Activity Timeline (2020–2025)</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Violations from EPA SDWIS · Other events from web research
              </p>
            </div>
            <ConfidenceBadge level="medium"
              sourceLabel="EPA SDWIS + web research"
              tooltip="Violations are verified from EPA. News/project events are web-researched and may be approximate." />
          </div>
          <TimelineView
            events={vendor.timeline_events || []}
            violations={lead.violations_detail}
          />
        </div>

        {/* ─── Decision Maker Tree ─── */}
        <div className="detail-card mb-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="!mb-0">Decision Maker Tree ({allContacts.length} contact{allContacts.length > 1 ? 's' : ''})</h3>
            <ConfidenceBadge level={allContacts.length > 1 ? 'medium' : 'verified'}
              sourceLabel="EPA SDWIS + web research"
              tooltip="Primary contact verified from EPA SDWIS. Additional contacts from web research." />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allContacts.map((c: any, i: number) => (
              <div key={i} className="rounded-lg p-4 border"
                style={{ background: c.primary ? 'white' : 'var(--bg)', borderColor: c.primary ? 'var(--navy)' : 'var(--border)', borderWidth: c.primary ? 2 : 1 }}>
                {c.primary && (
                  <div className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-full inline-block"
                    style={{ background: 'var(--navy)', color: 'white' }}>Primary · EPA Record</div>
                )}
                {!c.primary && (
                  <div className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-full inline-block"
                    style={{ background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA' }}>Web Research · Medium 62%</div>
                )}
                <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--navy)' }}>{c.name}</div>
                <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{c.title}</div>
                <div className="space-y-1.5">
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${c.email}`} className="text-xs font-medium truncate" style={{ color: '#2B5080', maxWidth: '160px' }}>{c.email.toLowerCase()}</a>
                      <CopyButton text={c.email.toLowerCase()} label="Copy" />
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${c.phone}`} className="text-xs">{c.phone}</a>
                      <CopyButton text={c.phone} label="Copy" />
                    </div>
                  )}
                  {!c.email && !c.phone && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Contact via utility main number</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Email Sequence ─── */}
        {lead.email_sequence?.length > 0 && (
          <EmailSequence emails={lead.email_sequence} utilityName={lead.name} />
        )}

        {/* ─── Full Violation History ─── */}
        <div className="detail-card mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="!mb-0">Full EPA Violation History ({vs.total ?? lead.violation_count} records)</h3>
              {openCount > 0 && (
                <span className="badge-open px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block">⚠ {openCount} unresolved</span>
              )}
            </div>
            <ConfidenceBadge level="verified"
              sourceLabel="EPA SDWIS"
              sourceUrl={`https://echo.epa.gov/detailed-facility-report?fid=${lead.pwsid}`}
              tooltip="Direct from EPA Safe Drinking Water Information System. 100% authoritative." />
          </div>

          {/* Violation category key */}
          <div className="mb-4 p-3 rounded-lg border text-xs" style={{ background: '#F0F7FF', borderColor: '#BFDBFE' }}>
            <div className="font-semibold mb-2" style={{ color: '#1E40AF' }}>What the violation categories mean:</div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              {[
                { code: 'TCR/RTCR', desc: 'Bacteria tests missed or exceeded limits (monitoring failure)' },
                { code: 'MR', desc: 'Required tests not submitted on time (reporting workflow gap)' },
                { code: 'SWTR', desc: 'Surface water treatment not properly applied/monitored' },
                { code: 'LCR', desc: 'Lead & copper sampling missed or exceeded action levels' },
                { code: 'DBP', desc: 'Disinfection byproduct levels exceeded or monitoring missed' },
                { code: 'NITRTE', desc: 'Nitrate exceeded 10 mg/L (health-based, harmful to infants)' },
              ].map(v => (
                <div key={v.code} className="flex gap-2">
                  <span className="font-bold shrink-0" style={{ color: '#1E40AF', minWidth: 60 }}>{v.code}</span>
                  <span style={{ color: '#374151' }}>{v.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t" style={{ borderColor: '#BFDBFE', color: '#374151' }}>
              <strong>⚠ HB</strong> = Health-Based violation (contaminant exceeded safe drinking water limit) · Higher urgency than monitoring violations.
            </div>
          </div>

          {lead.violations_detail?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    {['Status','Rule / Category','Contaminant','What It Means','Begin Date','End / RTC','Enforcement'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lead.violations_detail.map((v: any, i: number) => {
                    const def = getViolDef(v.category)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--bg)' }}>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            v.status === 'Open' ? 'badge-open' : v.status === 'Active' ? 'badge-active' : v.status === 'Resolved' ? 'badge-resolved' : 'badge-unknown'
                          }`}>{v.status}</span>
                          {v.is_health_based && <span className="ml-1 font-bold text-xs" style={{ color: '#DC2626' }}>⚠ HB</span>}
                        </td>
                        <td className="px-3 py-2 font-semibold">{v.category}</td>
                        <td className="px-3 py-2">{v.contaminant}</td>
                        <td className="px-3 py-2 max-w-[200px]">
                          {def ? (
                            <span title={def.signal} style={{ color: '#374151' }}>{def.plain}</span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>See EPA record</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{v.begin_date || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {v.status === 'Resolved' ? (v.rtc_date || v.end_date || '—') : (
                            <span className="font-semibold" style={{ color: '#DC2626' }}>Still Active</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{v.enforcement_date || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No violation records on file with EPA SDWIS.</p>
          )}
          <div className="mt-3 text-xs flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <span>Source:</span>
            <a href={`https://enviro.epa.gov/enviro/sdw_report_v3.first_table?pws_id=${lead.pwsid}&state_code=${lead.state}&source=Surface water&population=&sys_num=0`}
              target="_blank" rel="noopener" className="underline" style={{ color: '#2B5080' }}>EPA SDWIS {lead.pwsid} ↗</a>
            <a href={`https://echo.epa.gov/detailed-facility-report?fid=${lead.pwsid}`}
              target="_blank" rel="noopener" className="underline" style={{ color: '#2B5080' }}>EPA ECHO ↗</a>
          </div>
        </div>

        {/* ─── Facilities ─── */}
        {lead.facilities?.length > 0 && (
          <div className="detail-card mb-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="!mb-0">Infrastructure Facilities ({lead.facilities.length})</h3>
              <ConfidenceBadge level="verified" sourceLabel="EPA SDWIS Facilities" tooltip="Direct from EPA SDWIS facility database" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lead.facilities.map((f: any, i: number) => (
                <div key={i} className="rounded-lg px-4 py-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--navy)' }}>{f.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {f.type}{f.is_source && <span className="ml-2 font-medium" style={{ color: '#2563EB' }}>· Source Water</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Source: <a href={`https://enviro.epa.gov/enviro/sdw_report_v3.first_table?pws_id=${lead.pwsid}&state_code=${lead.state}&source=Surface water&population=&sys_num=0`}
                target="_blank" rel="noopener" className="underline" style={{ color: '#2B5080' }}>EPA SDWIS ↗</a>
            </div>
          </div>
        )}

        {/* ─── Discovery Questions ─── */}
        {lead.raybern_fit?.discovery_questions?.length > 0 && (
          <div className="detail-card mb-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="!mb-0">Discovery Call Questions</h3>
              <ConfidenceBadge level="high" tooltip="Questions generated based on this utility's specific violation history and tech stack" />
            </div>
            <ol className="space-y-3">
              {lead.raybern_fit.discovery_questions.map((q: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ background: 'var(--navy)' }}>{i + 1}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ─── Data Sources ─── */}
        <div className="detail-card mb-5">
          <h3>All Data Sources & Verification Links</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Every section in this profile is sourced from one or more of the following. Click to verify directly.
          </p>
          <div className="space-y-2">
            {[
              { name: 'EPA SDWIS — System Profile & Violations', url: `https://enviro.epa.gov/enviro/sdw_report_v3.first_table?pws_id=${lead.pwsid}&state_code=${lead.state}&source=Surface water&population=&sys_num=0`, confidence: 'verified' as const },
              { name: 'EPA ECHO — Enforcement & Compliance', url: `https://echo.epa.gov/detailed-facility-report?fid=${lead.pwsid}`, confidence: 'verified' as const },
              { name: 'EPA SDWIS — Facility Records', url: `https://www.epa.gov/ground-water-and-drinking-water/public-water-systems`, confidence: 'verified' as const },
              ...(Object.entries(vendor.source_urls || {}).slice(0, 6).map(([url, title]: [string, any]) => ({
                name: title || url,
                url,
                confidence: 'medium' as const,
              }))),
            ].map((src, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <div className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--navy)' }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={src.url} target="_blank" rel="noopener"
                      className="text-xs font-medium underline" style={{ color: '#2B5080' }}>
                      {String(src.name).slice(0, 80)}{String(src.name).length > 80 ? '…' : ''}
                    </a>
                    <ConfidenceBadge level={src.confidence} inline />
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-light)' }}>{src.url}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pb-8">
          <Link href="/" className="px-5 py-2 rounded-lg text-sm font-medium border"
            style={{ background: 'white', borderColor: 'var(--border)', color: 'var(--navy)' }}>← All Prospects</Link>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>
            {lead.pwsid} · Raybern Prospect Intelligence · EPA SDWIS + Web Research
          </div>
        </div>
      </div>
    </div>
  )
}
