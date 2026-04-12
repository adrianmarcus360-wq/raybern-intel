'use client'
import { useState, useMemo } from 'react'
import type { Lead } from '@/lib/types'
import leadsData from '@/data/leads.json'
import LeadCard from '@/components/LeadCard'
import StatsBar from '@/components/StatsBar'
import FilterBar from '@/components/FilterBar'
import { Droplets, ExternalLink } from 'lucide-react'

const leads = leadsData as Lead[]

const TIER_ORDER: Record<string, number> = { 'Tier 1': 0, 'Tier 2': 1, 'Tier 3': 2, 'Watch': 3 }

export default function Home() {
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [sort, setSort] = useState('score')

  const filtered = useMemo(() => {
    let result = leads.filter(l => {
      if (search) {
        const q = search.toLowerCase()
        if (!l.name.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q) && !l.admin_name.toLowerCase().includes(q)) return false
      }
      if (stateFilter && l.state !== stateFilter) return false
      if (tierFilter && l.tier.key !== tierFilter) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'violations': return b.violation_count - a.violation_count
        case 'population': return b.population - a.population
        case 'open': return b.parsed_signals.open_violations - a.parsed_signals.open_violations
        default: {
          const td = TIER_ORDER[a.tier.key] - TIER_ORDER[b.tier.key]
          return td !== 0 ? td : b.lead_score - a.lead_score
        }
      }
    })

    return result
  }, [search, stateFilter, tierFilter, sort])

  // Group by state for display
  const stateLabels: Record<string, string> = {
    MA: 'Massachusetts',
    FL: 'Florida — Miami Area',
    AL: 'Alabama — Birmingham Area',
    NY: 'New York — Yonkers',
  }

  const grouped = useMemo(() => {
    if (stateFilter || sort !== 'score') return null // flat view when filtered/sorted differently
    const groups: Record<string, Lead[]> = {}
    for (const l of filtered) {
      if (!groups[l.state]) groups[l.state] = []
      groups[l.state].push(l)
    }
    return groups
  }, [filtered, stateFilter, sort])

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      {/* TOP NAV */}
      <nav style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Droplets size={15} color="white" />
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.02em' }}>Raybern</span>
            <span style={{ fontSize: 14, color: '#525252', marginLeft: 8 }}>Prospect Intelligence</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#818cf8',
            fontSize: 11,
            fontWeight: 500,
          }}>
            EPA SDWIS · Live Data
          </div>
          <span style={{ fontSize: 11, color: '#525252' }}>Updated {dateStr}</span>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Lead Intelligence
          </h1>
          <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.6 }}>
            {leads.length} water utilities scored across MA, FL, AL, NY — sourced from EPA's Safe Drinking Water Information System.{' '}
            Each lead is scored on violation history, compliance pressure, and ideal client fit.
          </p>
        </div>

        {/* STATS */}
        <StatsBar leads={leads} filtered={filtered} />

        {/* TIER LEGEND */}
        <div style={{
          marginBottom: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: '#141414',
          border: '1px solid #1f1f1f',
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: '#525252', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lead Tiers</span>
          {[
            { key: 'Tier 1', label: 'Hot Lead', color: '#ef4444', desc: 'Unresolved violations + health risk — active regulatory pressure' },
            { key: 'Tier 2', label: 'Warm Lead', color: '#f97316', desc: 'Multiple violations or recent issues — strong consulting fit' },
            { key: 'Tier 3', label: 'Lukewarm', color: '#eab308', desc: 'Moderate history — worth nurturing over time' },
            { key: 'Watch', label: 'Watch List', color: '#22c55e', desc: 'Clean record — right size/type for future outreach' },
          ].map(t => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>{t.label}</span>
              <span style={{ fontSize: 11, color: '#525252' }}>— {t.desc}</span>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <FilterBar
          search={search} onSearch={setSearch}
          state={stateFilter} onState={setStateFilter}
          tier={tierFilter} onTier={setTierFilter}
          sort={sort} onSort={setSort}
          count={filtered.length} total={leads.length}
        />

        {/* LEADS GRID */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#525252' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No utilities match your filters</p>
            <p style={{ fontSize: 13 }}>Try adjusting your search or clearing a filter</p>
          </div>
        ) : grouped ? (
          // Grouped by state view
          Object.entries(grouped).sort(([a], [b]) => {
            const order = ['MA', 'FL', 'AL', 'NY']
            return order.indexOf(a) - order.indexOf(b)
          }).map(([state, stateleads]) => (
            <div key={state} style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#d4d4d4' }}>
                  {stateLabels[state] || state}
                </h2>
                <div style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#1a1a1a',
                  border: '1px solid #242424',
                  color: '#737373',
                  fontSize: 11,
                }}>
                  {stateleads.length} utilities
                </div>
                <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
              }}>
                {stateleads.map(lead => (
                  <LeadCard key={lead.pwsid} lead={lead} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat sorted view
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(lead => (
              <LeadCard key={lead.pwsid} lead={lead} />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#525252',
        fontSize: 11,
      }}>
        <span>Raybern Prospect Intelligence · Internal Use Only</span>
        <span>Data source: EPA SDWIS (Safe Drinking Water Information System)</span>
      </footer>
    </div>
  )
}
