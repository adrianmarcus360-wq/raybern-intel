'use client'
import { useState } from 'react'

export interface TimelineEvent {
  year: number
  month?: string | null
  event: string
  category: 'violation' | 'capital_project' | 'rate_change' | 'contract' | 'technology' | 'compliance' | 'leadership' | 'other'
  source_url?: string | null
}

const CAT_STYLE: Record<string, { icon: string; bg: string; color: string; border: string }> = {
  violation:       { icon: '⚠',  bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  capital_project: { icon: '🏗',  bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  rate_change:     { icon: '💰',  bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  contract:        { icon: '📋',  bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  technology:      { icon: '💻',  bg: '#EDE9FE', color: '#4C1D95', border: '#DDD6FE' },
  compliance:      { icon: '📜',  bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  leadership:      { icon: '👤',  bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  other:           { icon: '📌',  bg: '#F9FAFB', color: '#374151', border: '#E5E7EB' },
}

interface TimelineViewProps {
  events: TimelineEvent[]
  violations?: any[]  // violations_detail from lead data
}

function buildFromViolations(violations: any[]): TimelineEvent[] {
  return violations
    .filter((v: any) => v.begin_date)
    .map((v: any) => {
      const year = parseInt(v.begin_date?.substring(0, 4) || '0')
      if (year < 2020 || year > 2025) return null
      return {
        year,
        month: v.begin_date?.substring(5, 7) ? monthName(v.begin_date.substring(5, 7)) : null,
        event: `EPA violation: ${v.contaminant || v.category} (${v.category || 'Rule violation'})${v.is_health_based ? ' — Health-Based' : ''} · Status: ${v.status}`,
        category: 'violation' as const,
        source_url: null,
      }
    })
    .filter(Boolean) as TimelineEvent[]
}

function monthName(mm: string): string {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return names[parseInt(mm) - 1] || ''
}

export function TimelineView({ events, violations }: TimelineViewProps) {
  const [showAll, setShowAll] = useState(false)

  // Merge violation timeline with research timeline
  const violationEvents = violations ? buildFromViolations(violations) : []
  const allEvents = [...(events || []), ...violationEvents]
    .filter(e => e.year >= 2020 && e.year <= 2025)
    .sort((a, b) => b.year - a.year || 0)

  if (allEvents.length === 0) {
    return (
      <div className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No dated events found in public records for 2020–2025.
      </div>
    )
  }

  const visible = showAll ? allEvents : allEvents.slice(0, 8)

  return (
    <div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }}></div>

        <div className="space-y-3">
          {visible.map((evt, i) => {
            const style = CAT_STYLE[evt.category] || CAT_STYLE.other
            return (
              <div key={i} className="flex gap-3 pl-10 relative">
                {/* Dot */}
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white z-10 shrink-0"
                  style={{ background: style.color }}></div>
                <div className="flex-1 rounded-lg p-3 border text-sm"
                  style={{ background: style.bg, borderColor: style.border }}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base leading-none">{style.icon}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'white', color: style.color, border: `1px solid ${style.border}` }}>
                        {evt.month ? `${evt.month} ${evt.year}` : String(evt.year)}
                      </span>
                      <span className="text-xs font-semibold capitalize"
                        style={{ color: style.color }}>
                        {evt.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {evt.source_url && (
                      <a href={evt.source_url} target="_blank" rel="noopener"
                        className="text-xs underline shrink-0" style={{ color: '#2B5080' }}>
                        source ↗
                      </a>
                    )}
                  </div>
                  <p className="mt-1.5" style={{ color: style.color }}>{evt.event}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {allEvents.length > 8 && (
        <button onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs underline"
          style={{ color: 'var(--text-muted)' }}>
          {showAll ? 'Show less' : `Show all ${allEvents.length} events`}
        </button>
      )}
      {allEvents.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: 'var(--text-light)' }}>
          Timeline sourced from EPA violation records + web research · 2020–2025
        </p>
      )}
    </div>
  )
}
