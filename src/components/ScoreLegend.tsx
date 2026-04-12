'use client'
import { useState } from 'react'

interface ScoreLegendProps {
  score: number
  rawScore?: number
  boost?: number
}

export function ScoreLegend({ score, rawScore, boost }: ScoreLegendProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs underline decoration-dotted ml-1"
        style={{ color: 'var(--text-muted)' }}
        title="How is this score calculated?">
        How is this scored?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            style={{ background: 'white' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: 'var(--navy)', color: 'white' }}>
              <div>
                <div className="font-bold text-base">Lead Score System</div>
                <div className="text-xs mt-0.5" style={{ color: '#7EA4C4' }}>How every score is calculated</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white opacity-60 hover:opacity-100 text-xl font-bold">×</button>
            </div>

            {/* Breakdown */}
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Score Components (out of 100)</div>
                <div className="space-y-2">
                  {[
                    { label: 'Open EPA Violations', pts: 'up to 40 pts', desc: 'Each active violation +10 pts (capped at 4)', color: '#DC2626' },
                    { label: 'Total Violation History', pts: 'up to 15 pts', desc: 'Historical volume × 1.5 pts each', color: '#9A3412' },
                    { label: 'Population Size', pts: 'up to 10 pts', desc: '>50K: 10pts | >20K: 7pts | else: 4pts', color: '#1B3A5C' },
                    { label: 'Tyler MUNIS (Billing)', pts: '+20 pts', desc: 'Documented system Raybern has fixed', color: '#92400E' },
                    { label: 'Sensus FlexNet (AMI)', pts: '+15 pts', desc: 'Panama City integration pattern', color: '#1E40AF' },
                    { label: 'Itron / Neptune (AMI)', pts: '+12 pts', desc: 'AMI integration audit target', color: '#065F46' },
                    { label: 'Any billing system found', pts: '+8–10 pts', desc: 'Other identified systems', color: '#374151' },
                    { label: 'Active RFP / Procurement', pts: '+10 pts', desc: 'Currently buying technology', color: '#6D28D9' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: item.color + '18', color: item.color, minWidth: 64, textAlign: 'center' }}>
                        {item.pts}
                      </span>
                      <div>
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier ranges */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Score Ranges → Tier</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { range: '65–100', tier: 'Tier 1 – Hot', desc: 'Active violations + tech match', class: 'tier-hot' },
                    { range: '45–64', tier: 'Tier 2 – Warm', desc: 'Strong signals, no open violations', class: 'tier-warm' },
                    { range: '25–44', tier: 'Tier 3 – Lukewarm', desc: 'Historical violations, weak tech signal', class: 'tier-lukewarm' },
                    { range: '0–24', tier: 'Watch List', desc: 'Minimal signals, monitor', class: 'tier-watch' },
                  ].map(t => (
                    <div key={t.range} className={`px-3 py-2 rounded-lg border ${t.class}`}>
                      <div className="font-bold text-xs">{t.range}</div>
                      <div className="font-semibold text-xs">{t.tier}</div>
                      <div className="text-xs opacity-70">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data caveat */}
              <div className="rounded-lg p-3 text-xs border" style={{ background: '#FFFBEB', borderColor: '#FCD34D', color: '#78350F' }}>
                <strong>Note:</strong> Scores are based on public EPA data + web research. Technology stack information has varying confidence levels — each section on the detail page shows a confidence tag. Always verify before outreach.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
