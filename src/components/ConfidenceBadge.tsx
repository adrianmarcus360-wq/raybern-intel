'use client'

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none' | 'verified'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
  sourceLabel?: string
  sourceUrl?: string
  tooltip?: string
  inline?: boolean
}

const CONFIG: Record<ConfidenceLevel, { label: string; pct: number; bg: string; color: string; border: string; dot: string }> = {
  verified: { label: 'Verified',  pct: 97, bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  high:     { label: 'High',      pct: 85, bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', dot: '#3B82F6' },
  medium:   { label: 'Medium',    pct: 62, bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', dot: '#F97316' },
  low:      { label: 'Low',       pct: 35, bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  none:     { label: 'Unverified',pct: 18, bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' },
}

export function ConfidenceBadge({ level, sourceLabel, sourceUrl, tooltip, inline }: ConfidenceBadgeProps) {
  const c = CONFIG[level] || CONFIG.none

  return (
    <div className={`flex items-center gap-1 ${inline ? 'inline-flex' : ''}`}>
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border"
        style={{ background: c.bg, color: c.color, borderColor: c.border }}
        title={tooltip || `${c.label} confidence (${c.pct}%) — ${sourceLabel || 'web research'}`}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }}></span>
        {c.label} · {c.pct}%
      </span>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs underline shrink-0"
          style={{ color: '#2B5080' }}
          title={sourceLabel || 'View source'}>
          source ↗
        </a>
      )}
    </div>
  )
}

/** Render for a section header with confidence in the top-right */
export function SectionWithConfidence({
  title, level, sourceLabel, sourceUrl, tooltip, children
}: {
  title: string
  level: ConfidenceLevel
  sourceLabel?: string
  sourceUrl?: string
  tooltip?: string
  children: React.ReactNode
}) {
  return (
    <div className="detail-card mb-5">
      <div className="flex items-start justify-between mb-4 gap-2">
        <h3 className="!mb-0">{title}</h3>
        <ConfidenceBadge level={level} sourceLabel={sourceLabel} sourceUrl={sourceUrl} tooltip={tooltip} />
      </div>
      {children}
    </div>
  )
}
