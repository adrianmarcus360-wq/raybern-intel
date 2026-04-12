'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import leadsData from '@/data/leads_enriched.json'
import { Lead } from '@/lib/types'

const leads = leadsData as unknown as Lead[]

const TIER_STYLE: Record<string, string> = {
  'Tier 1': 'tier-hot',
  'Tier 2': 'tier-warm',
  'Tier 3': 'tier-lukewarm',
  'Tier 4': 'tier-watch',
}

const TIER_DOT: Record<string, string> = {
  'Tier 1': 'bg-red-500',
  'Tier 2': 'bg-orange-400',
  'Tier 3': 'bg-yellow-400',
  'Tier 4': 'bg-green-500',
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#991B1B' : score >= 50 ? '#9A3412' : score >= 35 ? '#854D0E' : '#166534'
  const bg    = score >= 70 ? '#FEE2E2' : score >= 50 ? '#FFF7ED' : score >= 35 ? '#FEFCE8' : '#F0FDF4'
  return (
    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2"
      style={{ color, background: bg, borderColor: color }}>
      {score}
    </span>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'lead_score' | 'violation_count' | 'population' | 'name'>('lead_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const states = useMemo(() => ['All', ...Array.from(new Set(leads.map(l => l.state))).sort()], [])
  const tiers  = ['All', 'Tier 1 – Hot', 'Tier 2 – Warm', 'Tier 3 – Lukewarm', 'Tier 4 – Watch']

  const filtered = useMemo(() => {
    let out = [...leads]
    if (search) {
      const q = search.toLowerCase()
      out = out.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.admin_name?.toLowerCase().includes(q) ||
        l.pwsid.toLowerCase().includes(q)
      )
    }
    if (stateFilter !== 'All') out = out.filter(l => l.state === stateFilter)
    if (tierFilter !== 'All') {
      const key = tierFilter.split(' – ')[0]
      out = out.filter(l => l.tier.key === key)
    }
    out.sort((a, b) => {
      let av = a[sortBy] as number | string
      let bv = b[sortBy] as number | string
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return out
  }, [search, stateFilter, tierFilter, sortBy, sortDir])

  const stats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter(l => l.tier.key === 'Tier 1').length,
    warm: leads.filter(l => l.tier.key === 'Tier 2').length,
    open: leads.reduce((s, l) => s + (l.violations_summary?.open || l.parsed_signals?.open_violations || 0), 0),
    totalViols: leads.reduce((s, l) => s + l.violation_count, 0),
  }), [])

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  function SortArrow({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span className="text-tan-deep ml-1">↕</span>
    return <span className="text-navy ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
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
              <div className="text-xs" style={{ color: '#7EA4C4' }}>Powered by EPA SDWIS · {leads.length} utilities</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 rounded-full text-xs font-medium border"
              style={{ background: '#1B3A5C', borderColor: '#3D6FA3', color: '#B3C9DF' }}>
              📡 Live EPA Data
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Prospects', val: stats.total, sub: 'in 4 states', color: 'var(--navy)' },
            { label: '🔴 Hot Leads', val: stats.hot, sub: 'active violations', color: '#991B1B' },
            { label: '🟠 Warm Leads', val: stats.warm, sub: 'recent issues', color: '#9A3412' },
            { label: 'Open Violations', val: stats.open, sub: 'across all utilities', color: '#B45309' },
            { label: 'Total Violations', val: stats.totalViols, sub: 'on EPA record', color: '#6B7280' },
          ].map(s => (
            <div key={s.label} className="detail-card !p-4">
              <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs font-semibold text-gray-800">{s.label}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { tier: 'Tier 1', label: 'Hot Lead', desc: 'Active EPA violations right now', cls: 'tier-hot' },
            { tier: 'Tier 2', label: 'Warm Lead', desc: 'Multiple or recent violations', cls: 'tier-warm' },
            { tier: 'Tier 3', label: 'Lukewarm', desc: 'Moderate history, worth nurturing', cls: 'tier-lukewarm' },
            { tier: 'Tier 4', label: 'Watch List', desc: 'Clean record, right profile', cls: 'tier-watch' },
          ].map(t => (
            <div key={t.tier} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${t.cls}`}>
              <span>{t.label}</span>
              <span className="opacity-60 hidden md:inline">— {t.desc}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="detail-card !p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'white', focusRingColor: 'var(--navy)' }}
            placeholder="Search utility name, city, contact, PWSID…"
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
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {leads.length} shown
          </span>
        </div>

        {/* Table */}
        <div className="detail-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--tan-dark)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)', width: 52 }}>Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('name')}>
                    Utility <SortArrow col="name" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Contact</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('population')}>
                    Pop <SortArrow col="population" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Source</th>
                  <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: 'var(--text-muted)' }} onClick={() => toggleSort('violation_count')}>
                    Violations <SortArrow col="violation_count" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Tier</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>Service Fit</th>
                  <th className="px-4 py-3" style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const openCount = lead.violations_summary?.open || lead.parsed_signals?.open_violations || 0
                  const activeCount = (lead.violations_detail || []).filter(v => v.status === 'Active').length
                  const openTotal = openCount + activeCount
                  return (
                    <tr key={lead.pwsid}
                      className="lead-row border-b"
                      style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'white' : 'var(--tan)' }}
                      onClick={() => router.push(`/lead/${lead.pwsid}`)}>
                      <td className="px-4 py-3">
                        <ScoreBadge score={lead.lead_score} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                          {lead.name.split('(')[0].trim()}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {lead.city}, {lead.state} · {lead.pwsid}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{lead.admin_name}</div>
                        {lead.email && (
                          <div className="text-xs truncate max-w-[180px]" style={{ color: 'var(--navy-light, #3D6FA3)' }}>
                            {lead.email.toLowerCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-medium">{lead.population.toLocaleString()}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.connections.toLocaleString()} conn.
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">{lead.source_water_label}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-sm" style={{ color: lead.violation_count > 0 ? '#B91C1C' : '#166534' }}>
                          {lead.violation_count}
                        </div>
                        {openTotal > 0 && (
                          <div className="text-xs font-semibold text-red-600">{openTotal} open</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${TIER_STYLE[lead.tier.key] || 'tier-watch'}`}>
                          {lead.tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium" style={{ color: 'var(--navy)' }}>
                          {lead.raybern_fit?.primary_service || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg" style={{ color: 'var(--navy-light, #3D6FA3)' }}>→</span>
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

        <div className="mt-4 text-xs text-center" style={{ color: 'var(--text-light)' }}>
          Data sourced from U.S. EPA Safe Drinking Water Information System (SDWIS) · Updated automatically · Click any row for full detail view
        </div>
      </div>
    </div>
  )
}
