import { notFound } from 'next/navigation'
import Link from 'next/link'
import leadsData from '@/data/leads_enriched.json'
import { Lead, ViolationDetail } from '@/lib/types'
import { CopyButton } from '@/components/CopyButton'

const leads = leadsData as unknown as Lead[]

export async function generateStaticParams() {
  return leads.map(l => ({ pwsid: l.pwsid }))
}

function statusBadge(status: string) {
  if (status === 'Open')    return 'badge-open'
  if (status === 'Active')  return 'badge-active'
  if (status === 'Resolved') return 'badge-resolved'
  return 'badge-unknown'
}

function ViolationTable({ violations }: { violations: ViolationDetail[] }) {
  if (!violations || violations.length === 0) {
    return <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No violation records found in EPA SDWIS.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--tan-dark)', borderBottom: '1px solid var(--border)' }}>
            {['Status', 'Category', 'Contaminant', 'Begin Date', 'End / RTC Date', 'Enforcement'].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {violations.map((v, i) => (
            <tr key={v.violation_id || i}
              style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--tan)' }}>
              <td className="px-3 py-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(v.status)}`}>
                  {v.status}
                </span>
                {v.is_health_based && (
                  <span className="ml-1 text-red-600 font-bold text-xs" title="Health-based violation">⚠ HB</span>
                )}
              </td>
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>{v.category}</td>
              <td className="px-3 py-2">{v.contaminant}</td>
              <td className="px-3 py-2 whitespace-nowrap">{v.begin_date || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {v.status === 'Resolved' ? (v.rtc_date || v.end_date || '—') : (
                  <span className="text-red-600 font-medium">Still Active</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {v.enforcement_date ? (
                  <span>{v.enforcement_date}{v.enforcement_action ? ` (${v.enforcement_action})` : ''}</span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LeadDetailPage({ params }: { params: { pwsid: string } }) {
  const lead = leads.find(l => l.pwsid === params.pwsid)
  if (!lead) notFound()

  const vs = lead.violations_summary
  const openCount = vs?.open || 0
  const activeCount = (lead.violations_detail || []).filter(v => v.status === 'Active').length
  const unresolvedTotal = openCount + activeCount

  const tierStyle: Record<string, string> = {
    'Tier 1': 'tier-hot', 'Tier 2': 'tier-warm',
    'Tier 3': 'tier-lukewarm', 'Tier 4': 'tier-watch',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <header style={{ background: 'var(--navy)', borderBottom: '1px solid #0D1E30' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'var(--navy-mid)' }}>R</div>
            <div>
              <div className="text-white font-semibold text-base leading-tight">Raybern Prospect Intelligence</div>
              <div className="text-xs" style={{ color: '#7EA4C4' }}>Powered by EPA SDWIS</div>
            </div>
          </div>
          <Link href="/"
            className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: '#2B5080', color: '#D9E4EF' }}>
            ← Back to All Prospects
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Hero */}
        <div className="detail-card mb-5" style={{ borderLeft: `4px solid var(--navy)` }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierStyle[lead.tier.key] || 'tier-watch'}`}>
                  {lead.tier.label}
                </span>
                {unresolvedTotal > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-open">
                    {unresolvedTotal} Open Violation{unresolvedTotal > 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--tan-dark)', color: 'var(--text-muted)' }}>
                  PWSID: {lead.pwsid}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
                {lead.name}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {lead.address} · EPA Region {lead.system_profile?.epa_region || '—'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold mx-auto"
                style={{
                  borderColor: lead.lead_score >= 70 ? '#EF4444' : lead.lead_score >= 50 ? '#F97316' : lead.lead_score >= 35 ? '#EAB308' : '#22C55E',
                  color: lead.lead_score >= 70 ? '#991B1B' : lead.lead_score >= 50 ? '#9A3412' : lead.lead_score >= 35 ? '#854D0E' : '#166534',
                  background: lead.lead_score >= 70 ? '#FEE2E2' : lead.lead_score >= 50 ? '#FFF7ED' : lead.lead_score >= 35 ? '#FEFCE8' : '#F0FDF4',
                }}>
                {lead.lead_score}
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Lead Score</div>
            </div>
          </div>
        </div>

        {/* 2-col: System Profile + Contact */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* System Profile */}
          <div className="detail-card">
            <h3>System Profile</h3>
            <div className="space-y-2.5">
              {[
                { label: 'System Type', val: lead.system_profile?.pws_type || 'Community Water System' },
                { label: 'Owner Type', val: lead.system_profile?.owner_type || '—' },
                { label: 'Activity Status', val: lead.system_profile?.activity || 'Active' },
                { label: 'Population Served', val: lead.population.toLocaleString() },
                { label: 'Service Connections', val: lead.connections.toLocaleString() },
                { label: 'Primary Water Source', val: lead.source_water_label },
                { label: 'Source Description', val: lead.source_water_description },
                { label: 'Is Wholesaler', val: lead.system_profile?.is_wholesaler ? 'Yes — sells water to other systems' : 'No' },
                { label: 'EPA Region', val: lead.system_profile?.epa_region ? `Region ${lead.system_profile.epa_region}` : '—' },
              ].map(row => (
                <div key={row.label} className="flex gap-3">
                  <span className="text-xs font-semibold w-36 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="detail-card">
            <h3>Decision Maker</h3>
            <div className="mb-4">
              <div className="text-lg font-bold mb-0.5" style={{ color: 'var(--navy)' }}>{lead.admin_name}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Water System Administrator</div>
            </div>
            <div className="space-y-3">
              {lead.email && (
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email</div>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${lead.email}`} className="text-sm font-medium"
                      style={{ color: 'var(--navy-mid)' }}>{lead.email.toLowerCase()}</a>
                    <CopyButton text={lead.email.toLowerCase()} label="Copy" />
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Phone</div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium">{lead.phone_formatted}</a>
                  <CopyButton text={lead.phone_formatted} label="Copy" />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Mailing Address</div>
                <div className="text-sm">{lead.address}</div>
              </div>
            </div>

            {/* Violations summary box */}
            <div className="mt-5 rounded-lg p-4" style={{ background: 'var(--tan-dark)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Violations at a Glance</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total on Record', val: vs?.total ?? lead.violation_count, warn: false },
                  { label: 'Open / Active', val: unresolvedTotal, warn: unresolvedTotal > 0 },
                  { label: 'Health-Based', val: vs?.health_based ?? lead.parsed_signals?.health_based ?? 0, warn: (vs?.health_based || 0) > 0 },
                  { label: 'Resolved', val: vs?.resolved ?? 0, warn: false },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-bold" style={{ color: s.warn ? '#B91C1C' : 'var(--navy)' }}>{s.val}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {vs?.latest_date && (
                <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Most recent: {vs.latest_date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Violation History */}
        <div className="detail-card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="!mb-0">Full EPA Violation History ({vs?.total ?? lead.violation_count} records)</h3>
            {unresolvedTotal > 0 && (
              <span className="badge-open px-3 py-1 rounded-full text-xs font-semibold">
                ⚠ {unresolvedTotal} unresolved
              </span>
            )}
          </div>
          <ViolationTable violations={lead.violations_detail || []} />
          <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            HB = Health-Based violation (MCL or Treatment Technique) · RTC = Return to Compliance date ·
            Source: <a href={lead.pwsid_url} target="_blank" rel="noopener" className="underline">EPA SDWIS {lead.pwsid}</a>
          </div>
        </div>

        {/* Facilities */}
        {lead.facilities && lead.facilities.length > 0 && (
          <div className="detail-card mb-5">
            <h3>Water System Facilities ({lead.facilities.length})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lead.facilities.map((f, i) => (
                <div key={i} className="rounded-lg px-4 py-3 border" style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--navy)' }}>{f.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {f.type}
                    {f.is_source && <span className="ml-2 text-blue-600 font-medium">· Source</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Intelligence */}
        {lead.vendor_intelligence && (
          <div className="detail-card mb-5" style={{ borderLeft: '3px solid #3D6FA3' }}>
            <h3>Vendor & Contract Intelligence</h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold border"
                style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}>
                {lead.vendor_intelligence.type}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {lead.vendor_intelligence.note}
            </p>
          </div>
        )}

        {/* Raybern Fit */}
        {lead.raybern_fit && (
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div className="detail-card" style={{ borderLeft: '3px solid var(--navy)' }}>
              <h3>Raybern Opportunity Assessment</h3>
              <div className="mb-4">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Primary Service Fit</div>
                <div className="text-base font-bold" style={{ color: 'var(--navy)' }}>
                  {lead.raybern_fit.primary_service}
                </div>
              </div>
              <div className="space-y-2">
                {lead.raybern_fit.signals.map((sig, i) => (
                  <div key={i} className="signal-info px-3 py-2 rounded text-sm">{sig}</div>
                ))}
              </div>
            </div>
            <div className="detail-card">
              <h3>Discovery Call Questions</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Ask these in Approach 1 to uncover the full opportunity:
              </p>
              <ol className="space-y-3">
                {lead.raybern_fit.discovery_questions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                      style={{ background: 'var(--navy)' }}>{i + 1}</span>
                    <span style={{ color: 'var(--text)' }}>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* EPA Signals */}
        <div className="detail-card mb-5">
          <h3>EPA Intelligence Signals</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {(lead.clean_signals || []).map((sig, i) => (
              <div key={i} className={`signal-${sig.type} px-4 py-3 rounded text-sm`}>
                {sig.text}
              </div>
            ))}
          </div>
        </div>

        {/* Outreach Draft */}
        {lead.email_draft && (
          <div className="detail-card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="!mb-0">Ready-to-Send Outreach Draft</h3>
              <CopyButton
                text={`Subject: ${lead.email_draft.subject}\n\n${lead.email_draft.body}`}
                label="Copy Full Email"
              />
            </div>
            <div className="rounded-lg p-4 mb-3 border" style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Subject Line</div>
              <div className="font-medium text-sm">{lead.email_draft.subject}</div>
            </div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-4 border"
              style={{ fontFamily: 'inherit', background: 'white', borderColor: 'var(--border)' }}>
              {lead.email_draft.body}
            </pre>
          </div>
        )}

        {/* Data Sources */}
        <div className="detail-card mb-5">
          <h3>Data Sources & Verification Links</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Every data point on this page is sourced from federal EPA databases. Click any link to verify directly.
          </p>
          <div className="space-y-3">
            {(lead.data_sources || []).map((src, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border"
                style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--navy)' }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5">{src.name}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{src.org} · {src.description}</div>
                  <a href={src.url} target="_blank" rel="noopener"
                    className="text-xs font-medium underline break-all"
                    style={{ color: 'var(--navy-mid)' }}>
                    {src.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex justify-between items-center mt-6 pb-8">
          <Link href="/"
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{ background: 'white', borderColor: 'var(--border)', color: 'var(--navy)' }}>
            ← Back to All Prospects
          </Link>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>
            PWSID {lead.pwsid} · Raybern Prospect Intelligence · EPA SDWIS
          </div>
        </div>

      </div>
    </div>
  )
}
