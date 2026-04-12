'use client'
import { Search, SlidersHorizontal } from 'lucide-react'

interface FilterBarProps {
  search: string
  onSearch: (v: string) => void
  state: string
  onState: (v: string) => void
  tier: string
  onTier: (v: string) => void
  sort: string
  onSort: (v: string) => void
  count: number
  total: number
}

const SELECT_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #242424',
  background: '#141414',
  color: '#a3a3a3',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  paddingRight: 28,
}

export default function FilterBar({
  search, onSearch, state, onState, tier, onTier, sort, onSort, count, total
}: FilterBarProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search utility or city..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #242424',
              background: '#141414',
              color: '#e5e5e5',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* State filter */}
        <div style={{ position: 'relative' }}>
          <select value={state} onChange={e => onState(e.target.value)} style={SELECT_STYLE}>
            <option value="">All States</option>
            <option value="MA">Massachusetts</option>
            <option value="FL">Florida (Miami)</option>
            <option value="AL">Alabama (Birmingham)</option>
            <option value="NY">New York (Yonkers)</option>
          </select>
          <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#525252" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </div>

        {/* Tier filter */}
        <div style={{ position: 'relative' }}>
          <select value={tier} onChange={e => onTier(e.target.value)} style={SELECT_STYLE}>
            <option value="">All Tiers</option>
            <option value="Tier 1">🔴 Hot Leads (Tier 1)</option>
            <option value="Tier 2">🟠 Warm Leads (Tier 2)</option>
            <option value="Tier 3">🟡 Lukewarm (Tier 3)</option>
            <option value="Watch">🟢 Watch List</option>
          </select>
          <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#525252" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select value={sort} onChange={e => onSort(e.target.value)} style={SELECT_STYLE}>
            <option value="score">Sort: Lead Score</option>
            <option value="violations">Sort: Violations</option>
            <option value="population">Sort: Population</option>
            <option value="open">Sort: Open Violations</option>
          </select>
          <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#525252" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </div>

        {/* Count */}
        <div style={{ fontSize: 12, color: '#525252', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#a3a3a3', fontWeight: 600 }}>{count}</span> of {total} utilities
        </div>
      </div>
    </div>
  )
}
