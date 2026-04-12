'use client'
import type { Lead } from '@/lib/types'

interface StatsBarProps {
  leads: Lead[]
  filtered: Lead[]
}

export default function StatsBar({ leads, filtered }: StatsBarProps) {
  const t1 = leads.filter(l => l.tier.key === 'Tier 1').length
  const t2 = leads.filter(l => l.tier.key === 'Tier 2').length
  const totalViolations = leads.reduce((sum, l) => sum + l.violation_count, 0)
  const openViolations = leads.reduce((sum, l) => sum + l.parsed_signals.open_violations, 0)
  const states = [...new Set(leads.map(l => l.state))].sort()

  const stats = [
    { label: 'Total Utilities', value: leads.length, sub: `${filtered.length} shown`, color: '#e5e5e5' },
    { label: 'Hot Leads', value: t1, sub: 'Tier 1 — active violations', color: '#ef4444' },
    { label: 'Warm Leads', value: t2, sub: 'Tier 2 — compliance risk', color: '#f97316' },
    { label: 'Open Violations', value: openViolations, sub: 'Unresolved with EPA now', color: '#ef4444' },
    { label: 'Total EPA Violations', value: totalViolations, sub: 'Across all utilities', color: '#f97316' },
    { label: 'States Covered', value: states.join(' · '), sub: 'Geographic coverage', color: '#6366f1', isText: true },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 1,
      background: '#1a1a1a',
      border: '1px solid #1f1f1f',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            padding: '16px 20px',
            background: '#141414',
            borderRight: i < stats.length - 1 ? '1px solid #1f1f1f' : 'none',
          }}
        >
          <div style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{
            fontSize: s.isText ? 16 : 24,
            fontWeight: 700,
            color: s.color,
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {s.value}
          </div>
          <div style={{ fontSize: 11, color: '#525252' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
