'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import leadsData from '@/data/leads_v4.json'
import { ScoreLegend } from '@/components/ScoreLegend'

const leads = leadsData as any[]

const TIER_ORDER: Record<string, number> = { 'Tier 1': 0, 'Tier 2': 1, 'Tier 3': 2, 'Watch': 3 }

const TIER_STYLE: Record<string, string> = {
  'Tier 1': 'tier-hot',
  'Tier 2': 'tier-warm',
  'Tier 3': 'tier-lukewarm',
  'Watch':  'tier-watch',
}

function TechBadge({ system, type }: { system: string | null; type: 'billing' | 'ami' }) {
  if (!system) return <span className="text-xs italic" style={{ color: 'var(--text-light)' }}>Unknown</span>
  const lower = system.toLowerCase()
  const isMunis  = lower.includes('munis')
  const isSensus = lower.includes('sensus')
  const isOracle = lower.includes('oracle') || lower.includes('peoplesoft')
  const isItron  = lower.includes('itron')
  const isNeptune = lower.includes('neptune')

  let bg = '#F3F4F6', color = '#374151', border = '#E5E7EB'
  if (isMunis)         { bg = '#FEF3C7'; color = '#92400E'; border = '#FDE68A' }
  else if (isSensus)   { bg = '#DBEAFE'; color = '#1E40AF'; border = '#BFDBFE' }
  else if (isOracle)   { bg = '#FCE7F3'; color = '#9D174D'; border = '#FBCFE8' }
  else if (isItron)    { bg = '#D1FAE5'; color = '#065F46'; border = '#A7F3D0' }
  else if (isNeptune)  { bg = '#EDE9FE'; color = '#4C1D95'; border = '#DDD6FE' }

  const short = system.split(' ').slice(0, 2).join(' ')
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold border"
      style={{ background: bg, color, borderColor: border }}>
      {short.length > 18 ? short.slice(0, 18) + '…' : short}
    </span>
  )
}

type SortCol = 'lead_score' | 'violation_count' | 'population' | 'name' | 'ami_system' | 'tier'

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('All')
  const [view, setView] = useState<'prospects' | 'workflow'>('prospects')
  const [tierFilter, setTierFilter] = useState('All')
  const [billingFilter, setBillingFilter] = useState('All')
  const [amiFilter, setAmiFilter] = useState('All')
  const [sortBy, setSortBy] = useState<SortCol>('lead_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const states   = useMemo(() => ['All', ...Array.from(new Set(leads.map((l: any) => l.state))).sort()], [])
  const billings = useMemo(() => {
    const systems = leads.map((l: any) => l.tech_intel?.billing_software).filter(Boolean)
    const unique = Array.from(new Set(systems.map((s: string) => s.split(' ').slice(0, 2).join(' '))))
    return ['All', 'Unknown', ...unique.sort()]
  }, [])
  const amis = useMemo(() => {
    const systems = leads.map((l: any) => l.tech_intel?.ami_system).filter(Boolean)
    const unique = Array.from(new Set(systems.map((s: string) => s.split(' ').slice(0, 2).join(' '))))
    return ['All', 'Unknown', ...unique.sort()]
  }, [])

  const filtered = useMemo(() => {
    let out = [...leads]
    if (search) {
      const q = search.toLowerCase()
      out = out.filter((l: any) =>
        l.name?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) ||
        l.admin_name?.toLowerCase().includes(q) || l.pwsid?.toLowerCase().includes(q) ||
        l.tech_intel?.billing_software?.toLowerCase().includes(q) ||
        l.tech_intel?.ami_system?.toLowerCase().includes(q)
      )
    }
    if (stateFilter !== 'All') out = out.filter((l: any) => l.state === stateFilter)
    if (tierFilter !== 'All') {
      const key = tierFilter.split(' – ')[0].replace(' List', '')
      out = out.filter((l: any) => l.tier?.key === key)
    }
    if (billingFilter !== 'All') {
      out = billingFilter === 'Unknown'
        ? out.filter((l: any) => !l.tech_intel?.billing_software)
        : out.filter((l: any) => (l.tech_intel?.billing_software || '').toLowerCase().includes(billingFilter.toLowerCase()))
    }
    if (amiFilter !== 'All') {
      out = amiFilter === 'Unknown'
        ? out.filter((l: any) => !l.tech_intel?.ami_system)
        : out.filter((l: any) => (l.tech_intel?.ami_system || '').toLowerCase().includes(amiFilter.toLowerCase()))
    }

    out.sort((a: any, b: any) => {
      let av: any, bv: any
      switch (sortBy) {
        case 'ami_system':
          av = (a.tech_intel?.ami_system || 'zzz').toLowerCase()
          bv = (b.tech_intel?.ami_system || 'zzz').toLowerCase()
          break
        case 'tier':
          av = TIER_ORDER[a.tier?.key] ?? 99
          bv = TIER_ORDER[b.tier?.key] ?? 99
          break
        default:
          av = a[sortBy]
          bv = b[sortBy]
      }
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return out
  }, [search, stateFilter, tierFilter, billingFilter, amiFilter, sortBy, sortDir])

  const stats = useMemo(() => ({
    total:   leads.length,
    tier1:   leads.filter((l: any) => l.tier?.key === 'Tier 1').length,
    tier2:   leads.filter((l: any) => l.tier?.key === 'Tier 2').length,
    munis:   leads.filter((l: any) => (l.tech_intel?.billing_software || '').toLowerCase().includes('munis')).length,
    sensus:  leads.filter((l: any) => (l.tech_intel?.ami_system || '').toLowerCase().includes('sensus')).length,
    openViol: leads.reduce((s: number, l: any) => s + (l.violations_summary?.open || 0), 0),
  }), [])

  function toggleSort(col: SortCol) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir(col === 'name' || col === 'ami_system' ? 'asc' : 'desc') }
  }

  function Arrow({ col }: { col: SortCol }) {
    if (sortBy !== col) return <span className="opacity-25 ml-0.5 text-xs">↕</span>
    return <span className="ml-0.5 text-xs">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  function exportCSV() {
    const rows = [
      ['Score','Boost','PWSID','Name','City','State','Tier','Pop','Connections','Billing','AMI','Open Viol','Total Viol','Admin','Email','Phone','Positioning'],
      ...filtered.map((l: any) => [
        l.lead_score, l.score_boost || 0, l.pwsid, l.name, l.city, l.state, l.tier?.label,
        l.population, l.connections, l.tech_intel?.billing_software || '', l.tech_intel?.ami_system || '',
        l.violations_summary?.open || 0, l.violation_count,
        l.admin_name, l.email || '', l.phone_formatted || '',
        l.tech_intel?.raybern_positioning?.headline || '',
      ])
    ]
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'raybern-prospects.csv'; a.click()
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Intelligence sub-tabs */}
        <div className="flex items-center justify-between mb-5 border-b pb-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-1">
            {[
              { key: 'prospects', label: '📋 Prospects', sub: `${leads.length} utilities` },
              { key: 'workflow',  label: '🗺 How It Works', sub: 'Example walkthrough' },
            ].map(t => (
              <button key={t.key} onClick={() => setView(t.key as any)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: view === t.key ? 'var(--navy)' : 'var(--text-muted)',
                  borderBottom: view === t.key ? '2px solid var(--navy)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}>
                {t.label}
                <span className="text-xs hidden md:inline" style={{ color: 'var(--text-light)' }}>/ {t.sub}</span>
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="text-sm px-4 py-1.5 rounded-lg font-medium border mb-1"
            style={{ background: 'white', borderColor: 'var(--border)', color: 'var(--navy)' }}>
            ↓ Export CSV
          </button>
        </div>

        {/* ── WORKFLOW VIEW ─────────────────────────────────────────────── */}
        {view === 'workflow' && <WorkflowView onOpenProspects={() => setView('prospects')} />}

        {/* ── PROSPECTS VIEW ────────────────────────────────────────────── */}
        {view === 'prospects' && <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {[
            { label: 'Total Prospects', val: stats.total, sub: '4 states', color: 'var(--navy)' },
            { label: '🔴 Tier 1 Hot', val: stats.tier1, sub: 'violations + tech match', color: '#991B1B' },
            { label: '🟠 Tier 2 Warm', val: stats.tier2, sub: 'strong tech match', color: '#9A3412' },
            { label: 'MUNIS Users', val: stats.munis, sub: "Raybern's proven territory", color: '#92400E', highlight: true },
            { label: 'Sensus FlexNet', val: stats.sensus, sub: 'AMI audit candidates', color: '#1E40AF' },
            { label: 'Open Violations', val: stats.openViol, sub: 'active EPA issues', color: '#B45309' },
          ].map(s => (
            <div key={s.label} className="detail-card !p-4" style={(s as any).highlight ? { borderLeft: '3px solid #F59E0B' } : {}}>
              <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MUNIS callout */}
        <div className="mb-5 rounded-lg p-4 border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#92400E' }}>
                {stats.munis} of {stats.total} leads run Tyler MUNIS — Raybern's documented target system
              </div>
              <div className="text-xs mt-1" style={{ color: '#78350F' }}>
                From the KKW engagement: MUNIS module interdependencies create systemic billing failures invisible to utility staff.
                Every MUNIS user here is a pre-qualified candidate.
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="detail-card !p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              placeholder="Search utility, city, contact, PWSID, software…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'white' }}
              value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'white' }}
              value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              {['All', 'Tier 1 – Hot', 'Tier 2 – Warm', 'Tier 3 – Lukewarm', 'Watch List'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'white' }}
              value={billingFilter} onChange={e => setBillingFilter(e.target.value)}>
              <option value="All">All Billing Systems</option>
              {billings.filter(b => b !== 'All').map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ borderColor: 'var(--border)', background: 'white' }}
              value={amiFilter} onChange={e => setAmiFilter(e.target.value)}>
              <option value="All">All AMI Systems</option>
              {amis.filter(a => a !== 'All').map(a => <option key={a}>{a}</option>)}
            </select>
            <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{filtered.length}/{leads.length}</span>
          </div>
        </div>

        {/* Score system link */}
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Lead scores are 0–100.</span>
          <ScoreLegend score={0} />
          <span className="ml-4">Click any row for the full intelligence profile.</span>
        </div>

        {/* Table */}
        <div className="detail-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border)' }}>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)', width: 64 }} onClick={() => toggleSort('lead_score')}>
                    Score <Arrow col="lead_score" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('name')}>
                    Utility <Arrow col="name" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Decision Maker</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('population')}>
                    Pop <Arrow col="population" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)', background: '#FFFBEB' }}>
                    💻 Billing System
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)', background: '#EFF6FF' }}
                    onClick={() => toggleSort('ami_system')}>
                    📡 AMI / Meter <Arrow col="ami_system" />
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('violation_count')}>
                    Violations <Arrow col="violation_count" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('tier')}>
                    Tier <Arrow col="tier" />
                  </th>
                  <th className="px-3 py-3" style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead: any, i: number) => {
                  const openCount = (lead.violations_summary?.open || 0) +
                    (lead.violations_detail?.filter((v: any) => v.status === 'Active')?.length || 0)
                  const isMunis = (lead.tech_intel?.billing_software || '').toLowerCase().includes('munis')
                  return (
                    <tr key={lead.pwsid}
                      className="lead-row border-b"
                      style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'white' : 'var(--bg)' }}
                      onClick={() => router.push(`/lead/${lead.pwsid}`)}>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                            style={{
                              borderColor: lead.lead_score >= 70 ? '#EF4444' : lead.lead_score >= 50 ? '#F97316' : '#EAB308',
                              color: lead.lead_score >= 70 ? '#991B1B' : lead.lead_score >= 50 ? '#9A3412' : '#854D0E',
                              background: lead.lead_score >= 70 ? '#FEE2E2' : lead.lead_score >= 50 ? '#FFF7ED' : '#FEFCE8',
                            }}>
                            {lead.lead_score}
                          </div>
                          {lead.score_boost > 0 && (
                            <span className="text-xs font-semibold mt-0.5" style={{ color: '#16A34A' }}>+{lead.score_boost}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--navy)' }}>
                          {lead.name?.split('(')[0].trim()}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {lead.city}, {lead.state} · {lead.pwsid}
                        </div>
                        {lead.tech_intel?.recent_news?.length > 0 && (
                          <div className="text-xs mt-0.5" style={{ color: '#6366F1' }}>
                            📰 {lead.tech_intel.recent_news.length} recent update{lead.tech_intel.recent_news.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-sm">{lead.admin_name}</div>
                        {lead.email && (
                          <div className="text-xs truncate max-w-[160px]" style={{ color: '#2B5080' }}>{lead.email.toLowerCase()}</div>
                        )}
                        {lead.tech_intel?.additional_contacts?.length > 0 && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            +{lead.tech_intel.additional_contacts.length} more
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="font-medium text-sm">{lead.population?.toLocaleString()}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.connections?.toLocaleString()} conn.</div>
                      </td>
                      <td className="px-3 py-3" style={{ background: isMunis ? '#FFFDF5' : undefined }}>
                        <TechBadge system={lead.tech_intel?.billing_software || null} type="billing" />
                        {isMunis && <div className="text-xs mt-0.5 font-semibold" style={{ color: '#92400E' }}>★ Target</div>}
                      </td>
                      <td className="px-3 py-3">
                        <TechBadge system={lead.tech_intel?.ami_system || null} type="ami" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="font-bold text-sm" style={{ color: lead.violation_count > 0 ? '#B91C1C' : '#166534' }}>
                          {lead.violation_count}
                        </div>
                        {openCount > 0 && <div className="text-xs font-bold" style={{ color: '#DC2626' }}>{openCount} open</div>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLE[lead.tier?.key] || 'tier-watch'}`}>
                          {lead.tier?.key}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span style={{ color: '#2B5080' }}>→</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No results.</div>
          )}
        </div>

        <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-light)' }}>
          Sortable: Score · Utility · Population · AMI System · Violations · Tier · Click any row for full profile
        </div>
        </>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW VIEW — Example walkthrough from raw data to first message sent
// ─────────────────────────────────────────────────────────────────────────────

function WorkflowView({ onOpenProspects }: { onOpenProspects: () => void }) {
  const [step, setStep] = useState(0)

  const STEPS = [
    {
      label: 'The Data',
      icon: '📊',
      headline: 'We start with what\'s public and provable',
      narrative: `Everything in this platform starts with the EPA's federal water system database (SDWIS) — updated quarterly, publicly accessible, 100% verified. We pulled every public water utility in Massachusetts, Florida, Alabama, and New York: 69 utilities total. For each one, we now have violation history, compliance status, population served, geographic data, and their federal system ID (PWSID).

From there, we layered in technology research: state procurement databases confirmed billing platforms, AMI system contracts, and vendor relationships. Web research filled in gaps — job postings that mention "Tyler MUNIS administrator", press releases naming Sensus FlexNet deployments, council meeting minutes discussing meter upgrade budgets.

Every data point in this system has a confidence badge. Verified means it came from a federal database or signed public contract. High means it came from the utility's own website or CCR. Medium means it was inferred from web research. You always know what you can say directly and what to hold back.`,
      sources: ['EPA SDWIS (verified)', 'State procurement portals (verified)', 'Utility websites + CCRs (high)', 'Web research (medium)'],
      callout: { label: '69 utilities', detail: '44 confirmed Tyler MUNIS · 44 Sensus FlexNet AMI' },
    },
    {
      label: 'The Opportunity',
      icon: '🎯',
      headline: 'Here\'s what the data tells us — and why it matters',
      narrative: `Of the 69 utilities, 44 run Tyler MUNIS — the same billing platform Raybern already has a documented case study with (the KKW engagement). That's not a coincidence or a guess; it's confirmed via public procurement contracts.

The MUNIS pattern is specific: its module interdependencies create billing failures that are invisible to internal utility staff. They look like data entry errors or one-off exceptions. They're actually systemic. The utility doesn't know that until someone looks under the hood — which is exactly what Raybern does.

On top of the MUNIS pattern, 21 of these utilities are Tier 1 — meaning they have both the tech match AND active EPA violations. Open violations are the urgency signal. A utility with 36 open violations and a MUNIS billing system isn't just a prospect; they're a utility where something is likely wrong that nobody has diagnosed yet.

This is the opportunity. Not "we think we can help them" — "we have data that shows a documented failure pattern in their exact system, and they have active compliance issues that make finding the root cause time-sensitive."`,
      sources: ['Tyler MUNIS procurement contracts', 'EPA SDWIS open violation data', 'KKW case study pattern (internal)'],
      callout: { label: '21 Tier 1 leads', detail: 'MUNIS + active violations = pre-qualified opportunity' },
    },
    {
      label: 'The Leads',
      icon: '👥',
      headline: 'Specific people at specific utilities, ranked by opportunity',
      narrative: `Each utility profile in this platform includes the full decision maker tree: the Water Superintendent or Director of Public Works (operational decision-maker), the Finance Director (budget authority), and the City Manager or Mayor (executive sponsor). Names, emails, and phone numbers where publicly available.

The scoring system weights four factors: violation severity and count, tech stack match (MUNIS gets +20 points, Sensus +15), population size (larger systems have more complexity and more budget), and open enforcement actions (the highest urgency signal). A Tier 1 lead is a utility scoring 70+ with at least one active violation.

Take Brockton Water Authority in Massachusetts as an example: 97,000 population, confirmed Tyler MUNIS billing, Sensus FlexNet AMI, 54 total violations with 36 currently open. Lead score: 89. The Water Superintendent is the right first contact. We know their name. We know their system. We know their compliance history. We know which violation types map to billing workflow failures.

That's not a cold call — that's a warm diagnostic conversation.`,
      sources: ['Municipal websites + CCRs (decision maker names)', 'EPA SDWIS (violation data)', 'State contracts (billing/AMI confirmation)'],
      callout: { label: 'Tier 1 example', detail: 'Brockton, MA — Score 89 · 36 open violations · MUNIS + Sensus' },
    },
    {
      label: 'The Approach',
      icon: '✉️',
      headline: 'How to start the conversation — what to say and what not to say',
      narrative: `The outreach rule here is simple: only reference what's Verified or High confidence. If something came from web research (Medium), it informs who we're targeting and how we frame the call — but we don't say "we know you're on MUNIS" unless it came from a public procurement contract.

Instead, the framing is: "We've worked extensively with Tyler-based billing environments and have identified a pattern of systemic billing failures that utilities using similar configurations rarely catch internally." That's true, accurate, and doesn't expose our research method. If they're on MUNIS, they'll immediately recognize themselves in that description. If not, it still opens a conversation.

Each lead profile includes a pre-written 3-touch email sequence: a positioning intro that references their violation history (which is 100% public and Verified), a follow-up that provides context on what Raybern found in a similar utility's system, and a final soft offer for the free alignment session — "no agenda, just clarity on what's happening."

The goal of touch 1 is not to sell. It's to get a reply. The goal of touch 3 is the alignment session. The alignment session is where Raybern's value becomes undeniable.`,
      sources: ['Confidence badge system (internal rule)', 'Pre-written sequences (per-lead)'],
      callout: { label: 'Touch 1 goal', detail: 'Not a sale — a reply. The conversation sells itself.' },
    },
    {
      label: 'The Workflow',
      icon: '⚙️',
      headline: 'How the team actually uses this tool, start to finish',
      narrative: `Step 1: Open Intelligence → sort by Score (default). Tier 1 leads are at the top. Start there.

Step 2: Click into a lead profile. Review the score breakdown to understand why this lead ranked high — is it violations? MUNIS match? Enforcement action? That context shapes the first line of the email.

Step 3: Review the violation definitions. Each violation type in the profile maps to a plain-English explanation of what it likely means operationally (e.g., "TCR = bacteria monitoring tests weren't run on schedule" → "this is a reporting workflow problem, which is the kind of thing MUNIS module misconfigurations produce").

Step 4: Review the decision maker tree. Identify the Water Superintendent or Director — they're the first contact. Note anyone in Finance or City management for CC or future touches.

Step 5: Use the pre-written email sequence as a starting point. The positioning headline and touch 1 draft are already written to their specific system. Adjust the opening line to reference the most specific Verified fact about that utility.

Step 6: Mark the lead as "Outreach Sent" in the status tracker. The tracker persists across sessions — so the team always knows what stage each lead is at.

Step 7: Log responses in HubSpot (once connected). As the newsletter builds a subscriber list and the webinar brings attendees, cross-reference: did any Tier 1 leads sign up for the webinar? Those are the warmest hand-raisers in the funnel.

That's the full loop: data → scoring → profile → outreach → newsletter → webinar → alignment session.`,
      sources: ['All modules: Intelligence + Newsletter + Webinars'],
      callout: { label: 'Full loop', detail: 'Intelligence → Newsletter → Webinar → Alignment Session → Client' },
    },
  ]

  const current = STEPS[step]

  return (
    <div className="max-w-3xl">

      {/* Title */}
      <div className="mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>How It Works</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          A narrative walkthrough of the Intelligence module — from raw public data to the first conversation with a prospect.
        </p>
      </div>

      {/* Step nav */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all"
            style={{
              background: step === i ? 'var(--navy)' : 'white',
              color: step === i ? 'white' : 'var(--text-muted)',
              borderColor: step === i ? 'var(--navy)' : 'var(--border)',
            }}>
            <span>{s.icon}</span>
            <span>{i + 1}. {s.label}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="detail-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">{current.icon}</div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Step {step + 1} of {STEPS.length}
            </div>
            <h3 className="text-base font-bold !mb-0" style={{ color: 'var(--navy)' }}>{current.headline}</h3>
          </div>
        </div>

        {/* Callout */}
        <div className="mb-4 rounded-lg p-3 border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>{current.callout.label}  </span>
          <span className="text-sm" style={{ color: '#1E3A5F' }}>{current.callout.detail}</span>
        </div>

        {/* Narrative */}
        <div className="space-y-3">
          {current.narrative.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-dark)' }}>{para}</p>
          ))}
        </div>

        {/* Sources used */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Sources powering this step</div>
          <div className="flex flex-wrap gap-2">
            {current.sources.map(s => (
              <span key={s} className="text-xs px-2 py-1 rounded-full border"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex justify-between mt-4">
        <button onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-sm px-4 py-2 rounded-lg font-medium border disabled:opacity-30"
          style={{ background: 'white', borderColor: 'var(--border)', color: 'var(--navy)' }}>
          ← Previous
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--navy)' }}>
            Next →
          </button>
        ) : (
          <button onClick={() => onOpenProspects()}
            className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: '#16A34A' }}>
            Open Prospects →
          </button>
        )}
      </div>

    </div>
  )
}

