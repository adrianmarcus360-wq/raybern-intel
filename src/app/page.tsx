'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import leadsData from '@/data/leads_final.json'

const leads = leadsData as any[]

const TIER_STYLE: Record<string, string> = {
  'Tier 1': 'tier-hot',
  'Tier 2': 'tier-warm',
  'Tier 3': 'tier-lukewarm',
  'Watch':  'tier-watch',
}

function TechBadge({ system, type }: { system: string | null; type: 'billing' | 'ami' }) {
  if (!system) return <span className="text-xs" style={{ color: 'var(--text-light)' }}>Unknown</span>

  const isMunis   = system.toLowerCase().includes('munis')
  const isSensus  = system.toLowerCase().includes('sensus')
  const isOracle  = system.toLowerCase().includes('oracle') || system.toLowerCase().includes('peoplesoft')
  const isItron   = system.toLowerCase().includes('itron')
  const isNeptune = system.toLowerCase().includes('neptune')

  let bg = '#F3F4F6', color = '#374151', ring = '#E5E7EB'
  if (isMunis)         { bg = '#FEF3C7'; color = '#92400E'; ring = '#FDE68A' }
  else if (isSensus)   { bg = '#DBEAFE'; color = '#1E40AF'; ring = '#BFDBFE' }
  else if (isOracle)   { bg = '#FCE7F3'; color = '#9D174D'; ring = '#FBCFE8' }
  else if (isItron)    { bg = '#D1FAE5'; color = '#065F46'; ring = '#A7F3D0' }
  else if (isNeptune)  { bg = '#EDE9FE'; color = '#4C1D95'; ring = '#DDD6FE' }

  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold border"
      style={{ background: bg, color, borderColor: ring }}>
      {system.length > 20 ? system.split(' ').slice(0, 2).join(' ') : system}
    </span>
  )
}

function ScoreBadge({ score, boost }: { score: number; boost?: number }) {
  const color = score >= 70 ? '#991B1B' : score >= 50 ? '#9A3412' : score >= 35 ? '#854D0E' : '#166534'
  const bg    = score >= 70 ? '#FEE2E2' : score >= 50 ? '#FFF7ED' : score >= 35 ? '#FEFCE8' : '#F0FDF4'
  return (
    <div className="flex flex-col items-center">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2"
        style={{ color, background: bg, borderColor: color }}>
        {score}
      </span>
      {boost && boost > 0 && (
        <span className="text-xs font-medium mt-0.5" style={{ color: '#16A34A' }}>+{boost}</span>
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  const [billingFilter, setBillingFilter] = useState('All')
  const [amiFilter, setAmiFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'lead_score' | 'violation_count' | 'population' | 'name'>('lead_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const states   = useMemo(() => ['All', ...Array.from(new Set(leads.map((l: any) => l.state))).sort()], [])
  const tiers    = ['All', 'Tier 1 – Hot', 'Tier 2 – Warm', 'Tier 3 – Lukewarm', 'Watch List']
  const billings = useMemo(() => {
    const systems = leads.map((l: any) => l.tech_intel?.billing_software).filter(Boolean)
    const unique = Array.from(new Set(systems.map((s: string) => s.split(' ').slice(0,2).join(' '))))
    return ['All', 'Unknown', ...unique.sort()]
  }, [])
  const amis = useMemo(() => {
    const systems = leads.map((l: any) => l.tech_intel?.ami_system).filter(Boolean)
    const unique = Array.from(new Set(systems.map((s: string) => s.split(' ').slice(0,2).join(' '))))
    return ['All', 'Unknown', ...unique.sort()]
  }, [])

  const filtered = useMemo(() => {
    let out = [...leads]
    if (search) {
      const q = search.toLowerCase()
      out = out.filter((l: any) =>
        l.name?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.admin_name?.toLowerCase().includes(q) ||
        l.pwsid?.toLowerCase().includes(q) ||
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
      if (billingFilter === 'Unknown') {
        out = out.filter((l: any) => !l.tech_intel?.billing_software)
      } else {
        out = out.filter((l: any) =>
          (l.tech_intel?.billing_software || '').toLowerCase().includes(billingFilter.toLowerCase())
        )
      }
    }
    if (amiFilter !== 'All') {
      if (amiFilter === 'Unknown') {
        out = out.filter((l: any) => !l.tech_intel?.ami_system)
      } else {
        out = out.filter((l: any) =>
          (l.tech_intel?.ami_system || '').toLowerCase().includes(amiFilter.toLowerCase())
        )
      }
    }
    out.sort((a: any, b: any) => {
      let av = a[sortBy], bv = b[sortBy]
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

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  function Arrow({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span className="opacity-30 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  function exportCSV() {
    const rows = [
      ['Score','Boost','PWSID','Name','City','State','Tier','Population','Connections','Billing Software','AMI System','Open Violations','Total Violations','Admin Name','Email','Phone','Raybern Positioning'],
      ...filtered.map((l: any) => [
        l.lead_score, l.score_boost||0, l.pwsid, l.name, l.city, l.state, l.tier?.label,
        l.population, l.connections,
        l.tech_intel?.billing_software||'', l.tech_intel?.ami_system||'',
        (l.violations_summary?.open||0), l.violation_count,
        l.admin_name, l.email||'', l.phone_formatted||'',
        l.tech_intel?.raybern_positioning?.headline||'',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], {type: 'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'raybern-prospects.csv'
    a.click()
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
              <div className="text-xs" style={{ color: '#7EA4C4' }}>EPA SDWIS · Technology Stack · Decision Makers · {leads.length} utilities</div>
            </div>
          </div>
          <button onClick={exportCSV}
            className="text-sm px-4 py-2 rounded-lg font-medium border transition-colors"
            style={{ background: '#2B5080', borderColor: '#3D6FA3', color: '#D9E4EF' }}>
            ↓ Export CSV
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {[
            { label: 'Total Prospects', val: stats.total, sub: '4 states', color: 'var(--navy)' },
            { label: '🔴 Tier 1 Hot', val: stats.tier1, sub: 'active violations + tech', color: '#991B1B' },
            { label: '🟠 Tier 2 Warm', val: stats.tier2, sub: 'strong tech match', color: '#9A3412' },
            { label: 'MUNIS Users', val: stats.munis, sub: 'Raybern\'s proven territory', color: '#92400E', highlight: true },
            { label: 'Sensus FlexNet', val: stats.sensus, sub: 'AMI audit candidates', color: '#1E40AF' },
            { label: 'Open Violations', val: stats.openViol, sub: 'active EPA issues', color: '#B45309' },
          ].map(s => (
            <div key={s.label} className="detail-card !p-4" style={s.highlight ? {borderLeft: '3px solid #F59E0B'} : {}}>
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
                {stats.munis} of your {stats.total} leads are running Tyler MUNIS — Raybern's documented target system
              </div>
              <div className="text-xs mt-1" style={{ color: '#78350F' }}>
                From the KKW engagement: MUNIS module interdependencies create systemic workflow failures that are invisible to utility staff. 
                Every MUNIS user here is a qualified candidate for a billing operations audit.
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="detail-card !p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              placeholder="Search utility, city, contact, PWSID, software…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              {tiers.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              value={billingFilter} onChange={e => setBillingFilter(e.target.value)}>
              <option value="All">All Billing Systems</option>
              {billings.filter(b => b !== 'All').map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'white' }}
              value={amiFilter} onChange={e => setAmiFilter(e.target.value)}>
              <option value="All">All AMI Systems</option>
              {amis.filter(a => a !== 'All').map(a => <option key={a}>{a}</option>)}
            </select>
            <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {filtered.length}/{leads.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="detail-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--tan-dark)', borderBottom: '2px solid var(--border)' }}>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)', width: 56 }}>Score</th>
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
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)', background: '#EFF6FF' }}>
                    📡 AMI / Meter
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('violation_count')}>
                    Violations <Arrow col="violation_count" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Tier</th>
                  <th className="px-3 py-3" style={{ width: 32 }}></th>
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
                      style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'white' : 'var(--tan)' }}
                      onClick={() => router.push(`/lead/${lead.pwsid}`)}>
                      <td className="px-3 py-3">
                        <ScoreBadge score={lead.lead_score} boost={lead.score_boost} />
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
                          <div className="text-xs truncate max-w-[160px]" style={{ color: '#2B5080' }}>
                            {lead.email.toLowerCase()}
                          </div>
                        )}
                        {lead.tech_intel?.additional_contacts?.length > 0 && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            +{lead.tech_intel.additional_contacts.length} more contacts
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="font-medium text-sm">{lead.population?.toLocaleString()}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.connections?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-3" style={{ background: isMunis ? '#FFFBEB' : undefined }}>
                        <TechBadge system={lead.tech_intel?.billing_software || null} type="billing" />
                        {isMunis && (
                          <div className="text-xs mt-0.5 font-medium" style={{ color: '#92400E' }}>
                            ★ Target system
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <TechBadge system={lead.tech_intel?.ami_system || null} type="ami" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="font-bold text-sm" style={{ color: lead.violation_count > 0 ? '#B91C1C' : '#166534' }}>
                          {lead.violation_count}
                        </div>
                        {openCount > 0 && (
                          <div className="text-xs font-semibold" style={{ color: '#DC2626' }}>{openCount} open</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLE[lead.tier?.key] || 'tier-watch'}`}>
                          {lead.tier?.key}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-lg" style={{ color: '#2B5080' }}>→</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              No results match your filters.
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-light)' }}>
          EPA SDWIS violation data · Web-researched technology stack · Decision maker contacts · Click any row for full intelligence profile
        </div>
      </div>
    </div>
  )
}
