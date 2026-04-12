import { notFound } from 'next/navigation'
import Link from 'next/link'
import leadsData from '@/data/leads_final.json'
import { CopyButton } from '@/components/CopyButton'
import { EmailSequence } from '@/components/EmailSequence'
import { StatusTracker } from '@/components/StatusTracker'

const leads = leadsData as any[]

export async function generateStaticParams() {
  return leads.map(l => ({ pwsid: l.pwsid }))
}

function statusBadge(status: string) {
  if (status === 'Open')     return 'badge-open'
  if (status === 'Active')   return 'badge-active'
  if (status === 'Resolved') return 'badge-resolved'
  return 'badge-unknown'
}

function TechPill({ system, highlight }: { system: string | null; highlight?: boolean }) {
  if (!system) return <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Not found in public records</span>
  const isMunis = system.toLowerCase().includes('munis')
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${isMunis ? 'border-yellow-300' : 'border-blue-200'}`}
      style={{ background: isMunis ? '#FFFBEB' : '#EFF6FF', color: isMunis ? '#92400E' : '#1E40AF' }}>
      {system}
      {isMunis && <span className="text-yellow-600 text-xs">★</span>}
    </div>
  )
}

export default function LeadDetailPage({ params }: { params: { pwsid: string } }) {
  const lead = leads.find(l => l.pwsid === params.pwsid)
  if (!lead) notFound()

  const tech = lead.tech_intel || {}
  const vs   = lead.violations_summary || {}
  const openCount = (vs.open || 0) + (lead.violations_detail?.filter((v: any) => v.status === 'Active')?.length || 0)
  const isMunis   = (tech.billing_software || '').toLowerCase().includes('munis')
  const isSensus  = (tech.ami_system || '').toLowerCase().includes('sensus')
  const allContacts = [
    { name: lead.admin_name, title: 'Water System Administrator', email: lead.email, phone: lead.phone_formatted, primary: true },
    ...(tech.additional_contacts || []).map((c: any) => ({ ...c, primary: false })),
  ]

  const tierStyle: Record<string, string> = {
    'Tier 1': 'tier-hot', 'Tier 2': 'tier-warm',
    'Tier 3': 'tier-lukewarm', 'Watch': 'tier-watch',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
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
            style={{ background: '#2B5080', color: '#D9E4EF' }}>
            ← All Prospects
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Hero bar */}
        <div className="detail-card mb-5" style={{ borderLeft: `4px solid var(--navy)` }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierStyle[lead.tier?.key] || 'tier-watch'}`}>
                  {lead.tier?.label}
                </span>
                {openCount > 0 && (
                  <span className="badge-open px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    ⚠ {openCount} Open Violation{openCount > 1 ? 's' : ''}
                  </span>
                )}
                {isMunis && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FCD34D' }}>
                    ★ Tyler MUNIS — Target System
                  </span>
                )}
                {isSensus && !isMunis && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}>
                    Sensus FlexNet AMI
                  </span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--tan-dark)', color: 'var(--text-muted)' }}>
                  {lead.pwsid}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{lead.name}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {lead.address} · EPA Region {lead.system_profile?.epa_region || '—'}
              </p>
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
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Lead Score</div>
                {lead.score_boost > 0 && (
                  <div className="text-xs font-semibold" style={{ color: '#16A34A' }}>+{lead.score_boost} tech boost</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="detail-card mb-5" style={{ borderLeft: '3px solid #6366F1' }}>
          <h3>Why This Score ({lead.lead_score}/100)</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Open Violations', val: openCount, max: 4, pts: Math.min(openCount * 10, 40), color: '#DC2626', desc: 'Active EPA violations on record' },
              { label: 'Total Violations', val: vs.total || lead.violation_count, max: 30, pts: Math.min((vs.total || 0) * 1.5, 15), color: '#9A3412', desc: 'Historical violation count' },
              { label: 'Population Scale', val: lead.population?.toLocaleString(), max: null, pts: lead.population > 50000 ? 10 : lead.population > 20000 ? 7 : 4, color: 'var(--navy)', desc: 'Size of customer base' },
              { label: 'Tech Stack Match', val: tech.billing_software || 'Unknown', max: null, pts: lead.score_boost || 0, color: '#16A34A', desc: 'Billing/AMI system alignment with Raybern services' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 border" style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>+{Math.round(s.pts)} pts</span>
                </div>
                <div className="text-sm font-semibold truncate">{s.val}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Raybern Positioning — only if found */}
        {tech.raybern_positioning && (
          <div className="detail-card mb-5" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFDF0' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-bold text-base mb-1" style={{ color: '#92400E' }}>
                  {tech.raybern_positioning.headline}
                </div>
                <p className="text-sm mb-3" style={{ color: '#78350F' }}>
                  {tech.raybern_positioning.detail}
                </p>
                <div className="rounded-lg p-3 border" style={{ background: 'white', borderColor: '#FCD34D' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>📞 OPENING LINE FOR OUTREACH</div>
                  <p className="text-sm italic" style={{ color: '#1C1917' }}>{tech.raybern_positioning.call_to_action}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-col: System Profile + Technology Stack + Violations Summary */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">

          {/* System Profile */}
          <div className="detail-card">
            <h3>System Profile</h3>
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
          </div>

          {/* Technology Stack */}
          <div className="detail-card" style={isMunis ? { borderTop: '3px solid #F59E0B' } : {}}>
            <h3>Technology Stack</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  💻 BILLING / CIS SYSTEM
                </div>
                <TechPill system={tech.billing_software} />
                {tech.billing_software_confidence && tech.billing_software_confidence !== 'none' && (
                  <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Confidence: <span className="font-medium capitalize">{tech.billing_software_confidence}</span>
                    {tech.billing_software_evidence && (
                      <span> · "{tech.billing_software_evidence.slice(0, 80)}{tech.billing_software_evidence.length > 80 ? '…' : ''}"</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  📡 AMI / METER READING
                </div>
                <TechPill system={tech.ami_system} />
                {tech.ami_system_confidence && tech.ami_system_confidence !== 'none' && (
                  <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Confidence: <span className="font-medium capitalize">{tech.ami_system_confidence}</span>
                    {tech.ami_system_evidence && (
                      <span> · "{tech.ami_system_evidence.slice(0, 80)}{tech.ami_system_evidence.length > 80 ? '…' : ''}"</span>
                    )}
                  </div>
                )}
              </div>
              {tech.tech_notes && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>NOTES</div>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>{tech.tech_notes}</p>
                </div>
              )}
              {tech.contract_signals && (
                <div className="rounded p-2" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: '#166534' }}>📋 CONTRACT SIGNAL</div>
                  <p className="text-xs" style={{ color: '#166534' }}>{tech.contract_signals}</p>
                </div>
              )}
            </div>
          </div>

          {/* Violations Summary */}
          <div className="detail-card">
            <h3>Violations at a Glance</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Total on Record', val: vs.total ?? lead.violation_count, warn: false },
                { label: 'Open / Active', val: openCount, warn: openCount > 0 },
                { label: 'Health-Based', val: vs.health_based ?? 0, warn: (vs.health_based || 0) > 0 },
                { label: 'Resolved', val: vs.resolved ?? 0, warn: false },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--tan)', border: '1px solid var(--border)' }}>
                  <div className="text-xl font-bold" style={{ color: s.warn ? '#B91C1C' : 'var(--navy)' }}>{s.val}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {vs.latest_date && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Most recent: {vs.latest_date}
              </div>
            )}
            <div className="mt-3 space-y-1">
              {(lead.clean_signals || []).slice(0, 3).map((sig: any, i: number) => (
                <div key={i} className={`signal-${sig.type} px-3 py-2 rounded text-xs`}>{sig.text}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent News & RFPs */}
        {(tech.recent_news?.length > 0 || tech.recent_rfps?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {tech.recent_news?.length > 0 && (
              <div className="detail-card" style={{ borderLeft: '3px solid #6366F1' }}>
                <h3>Recent News & Activity</h3>
                <div className="space-y-2">
                  {tech.recent_news.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 text-indigo-400 font-bold">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tech.recent_rfps?.length > 0 && (
              <div className="detail-card" style={{ borderLeft: '3px solid #10B981' }}>
                <h3>Recent RFPs & Procurement Activity</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  These are signals the utility is actively buying or evaluating technology.
                </p>
                <div className="space-y-2">
                  {tech.recent_rfps.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 text-emerald-500 font-bold">📋</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decision Maker Tree */}
        <div className="detail-card mb-5">
          <h3>Decision Maker Tree ({allContacts.length} contact{allContacts.length > 1 ? 's' : ''})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allContacts.map((c: any, i: number) => (
              <div key={i} className={`rounded-lg p-4 border ${c.primary ? '' : ''}`}
                style={{
                  background: c.primary ? 'white' : 'var(--tan)',
                  borderColor: c.primary ? 'var(--navy)' : 'var(--border)',
                  borderWidth: c.primary ? '2px' : '1px'
                }}>
                {c.primary && (
                  <div className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-full inline-block"
                    style={{ background: 'var(--navy)', color: 'white' }}>Primary Contact</div>
                )}
                <div className="font-bold text-sm mb-0.5" style={{ color: 'var(--navy)' }}>{c.name}</div>
                <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{c.title}</div>
                <div className="space-y-1.5">
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${c.email}`} className="text-xs font-medium truncate"
                        style={{ color: '#2B5080', maxWidth: '160px' }}>{c.email.toLowerCase()}</a>
                      <CopyButton text={c.email.toLowerCase()} label="Copy" />
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${c.phone}`} className="text-xs">{c.phone}</a>
                      <CopyButton text={c.phone} label="Copy" />
                    </div>
                  )}
                  {!c.email && !c.phone && (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Contact via utility main number</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Touch Email Sequence */}
        {lead.email_sequence?.length > 0 && (
          <EmailSequence emails={lead.email_sequence} utilityName={lead.name} />
        )}

        {/* Full Violation History */}
        <div className="detail-card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="!mb-0">Full EPA Violation History ({vs.total ?? lead.violation_count} records)</h3>
            {openCount > 0 && (
              <span className="badge-open px-3 py-1 rounded-full text-xs font-semibold">
                ⚠ {openCount} unresolved
              </span>
            )}
          </div>
          {(lead.violations_detail || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--tan-dark)', borderBottom: '1px solid var(--border)' }}>
                    {['Status','Category','Contaminant','Begin Date','End / RTC','Enforcement'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lead.violations_detail.map((v: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--tan)' }}>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.status === 'Open' ? 'badge-open' : v.status === 'Active' ? 'badge-active' : v.status === 'Resolved' ? 'badge-resolved' : 'badge-unknown'
                        }`}>{v.status}</span>
                        {v.is_health_based && <span className="ml-1 text-red-600 font-bold text-xs">⚠ HB</span>}
                      </td>
                      <td className="px-3 py-2 font-medium">{v.category}</td>
                      <td className="px-3 py-2">{v.contaminant}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{v.begin_date || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {v.status === 'Resolved' ? (v.rtc_date || v.end_date || '—') : (
                          <span className="font-semibold" style={{ color: '#DC2626' }}>Still Active</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{v.enforcement_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No violation records in EPA SDWIS.</p>
          )}
          <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            HB = Health-Based violation · Source: <a href={lead.pwsid_url} target="_blank" rel="noopener" className="underline">EPA SDWIS {lead.pwsid}</a>
          </div>
        </div>

        {/* Facilities */}
        {lead.facilities?.length > 0 && (
          <div className="detail-card mb-5">
            <h3>Infrastructure Facilities ({lead.facilities.length})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lead.facilities.map((f: any, i: number) => (
                <div key={i} className="rounded-lg px-4 py-3 border"
                  style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--navy)' }}>{f.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {f.type}{f.is_source && <span className="ml-2 text-blue-600 font-medium">· Source</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Intel */}
        {lead.vendor_intelligence && (
          <div className="detail-card mb-5">
            <h3>Vendor & Contract Context</h3>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{lead.vendor_intelligence.note}</p>
          </div>
        )}

        {/* Discovery Questions */}
        {lead.raybern_fit?.discovery_questions?.length > 0 && (
          <div className="detail-card mb-5">
            <h3>Discovery Call Questions</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Ask these in order to uncover the full scope of opportunity:
            </p>
            <ol className="space-y-3">
              {lead.raybern_fit.discovery_questions.map((q: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ background: 'var(--navy)' }}>{i+1}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Data Sources */}
        {lead.data_sources?.length > 0 && (
          <div className="detail-card mb-5">
            <h3>Data Sources & Verification</h3>
            <div className="space-y-2">
              {lead.data_sources.map((src: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ background: 'var(--tan)', borderColor: 'var(--border)' }}>
                  <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'var(--navy)' }}>{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs mb-0.5">{src.name}</div>
                    <a href={src.url} target="_blank" rel="noopener"
                      className="text-xs underline break-all" style={{ color: '#2B5080' }}>
                      {src.url}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pb-8">
          <Link href="/" className="px-5 py-2 rounded-lg text-sm font-medium border"
            style={{ background: 'white', borderColor: 'var(--border)', color: 'var(--navy)' }}>
            ← All Prospects
          </Link>
          <div className="text-xs" style={{ color: 'var(--text-light)' }}>
            {lead.pwsid} · Raybern Prospect Intelligence · EPA SDWIS + Web Research
          </div>
        </div>
      </div>
    </div>
  )
}
