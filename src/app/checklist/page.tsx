'use client'
import { useState, useEffect } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

type Item = { id: string; label: string }
type Section = { title: string; items: Item[] }
type Initiative = { id: string; icon: string; title: string; color: string; accent: string; sections: Section[] }

const INITIATIVES: Initiative[] = [
  {
    id: 'webinar',
    icon: '🎙',
    title: 'Webinar',
    color: '#EEF2FF',
    accent: '#4338CA',
    sections: [
      {
        title: 'Pre-Launch Setup',
        items: [
          { id: 'w1',  label: 'Define webinar topic / theme' },
          { id: 'w2',  label: 'Confirm date and time (min quarterly)' },
          { id: 'w3',  label: 'Confirm speakers / panelists' },
          { id: 'w4',  label: 'Select and configure webinar platform' },
          { id: 'w5',  label: 'Integrate webinar platform into Growth Hub' },
          { id: 'w6',  label: 'Build registration landing page' },
          { id: 'w7',  label: 'Set up Raybern LinkedIn admin access' },
          { id: 'w8',  label: 'Create LinkedIn event' },
        ],
      },
      {
        title: 'Outreach & Promotion',
        items: [
          { id: 'w9',  label: 'Import full contact list' },
          { id: 'w10', label: 'Draft email invite sequence (invite → reminder → day-of)' },
          { id: 'w11', label: 'Draft LinkedIn outreach / DM sequence' },
          { id: 'w12', label: 'Create promotional social posts' },
          { id: 'w13', label: 'Launch invite campaign and track registrations' },
        ],
      },
      {
        title: 'Execution & Follow-Up',
        items: [
          { id: 'w14', label: 'Run end-to-end platform test' },
          { id: 'w15', label: 'Record session for replay / repurposing' },
          { id: 'w16', label: 'Define post-webinar CTA' },
          { id: 'w17', label: 'Send follow-up sequence to attendees and no-shows' },
          { id: 'w18', label: 'Log attendee data into lead system' },
          { id: 'w19', label: 'Debrief (attendance, conversion, learnings)' },
        ],
      },
    ],
  },
  {
    id: 'newspaper',
    icon: '📰',
    title: 'Newspaper Launch (FLOW)',
    color: '#FFF7ED',
    accent: '#C2410C',
    sections: [
      {
        title: 'Brand & Concept',
        items: [
          { id: 'n1', label: 'Finalize newspaper name (FLOW)' },
          { id: 'n2', label: 'Lock masthead design and brand identity' },
          { id: 'n3', label: 'Define issue 1 section map (24–36 pages)' },
          { id: 'n4', label: 'Confirm anonymous framing guidelines' },
          { id: 'n5', label: 'Define QR code CTA placements' },
        ],
      },
      {
        title: 'Content Production',
        items: [
          { id: 'n6',  label: 'Pull EPA violation data by state' },
          { id: 'n7',  label: 'Write violations / compliance analysis section' },
          { id: 'n8',  label: 'Write regulatory deadline and funding section' },
          { id: 'n9',  label: 'Develop case study section' },
          { id: 'n10', label: 'Add games section (crossword, trivia, etc.)' },
          { id: 'n11', label: 'Write Raybern intro / about and back-page CTA' },
          { id: 'n12', label: 'Source visuals (maps, photos, infographics)' },
          { id: 'n13', label: 'Full copy proofread and legal review' },
        ],
      },
      {
        title: 'Print & Distribution',
        items: [
          { id: 'n14', label: 'Select color print vendor' },
          { id: 'n15', label: 'Finalize print run quantity' },
          { id: 'n16', label: 'Build mailing list of utility decision-maker addresses' },
          { id: 'n17', label: 'Submit final print file' },
          { id: 'n18', label: 'Confirm delivery and mail' },
          { id: 'n19', label: 'Track delivery and collect engagement signals' },
        ],
      },
    ],
  },
  {
    id: 'newsletter',
    icon: '📬',
    title: 'Newsletter Launch',
    color: '#F0FDF4',
    accent: '#166534',
    sections: [
      {
        title: 'Platform & Brand Setup',
        items: [
          { id: 'nl1', label: 'Select platform (Beehiiv)' },
          { id: 'nl2', label: 'Set up account / domain / sender identity' },
          { id: 'nl3', label: 'Design newsletter template' },
          { id: 'nl4', label: 'Confirm newsletter name and tagline' },
          { id: 'nl5', label: 'Define national content strategy' },
          { id: 'nl6', label: 'Map content pillars (compliance trends, public data, team wins, case studies)' },
        ],
      },
      {
        title: 'Content & Distribution',
        items: [
          { id: 'nl7',  label: 'Build subscriber import list' },
          { id: 'nl8',  label: 'Set up public data pipeline' },
          { id: 'nl9',  label: 'Write and publish issue 1' },
          { id: 'nl10', label: 'Define send cadence (bi-weekly or monthly)' },
          { id: 'nl11', label: 'Set up automated distribution' },
          { id: 'nl12', label: 'Create 3-issue content backlog before launch' },
          { id: 'nl13', label: 'Link newsletter to Growth Hub' },
          { id: 'nl14', label: 'Announce launch' },
          { id: 'nl15', label: 'Establish open rate benchmarks' },
        ],
      },
    ],
  },
  {
    id: 'flow-concept',
    icon: '🗞',
    title: 'Newspaper Build Out & Concept',
    color: '#F5F3FF',
    accent: '#6D28D9',
    sections: [
      {
        title: 'Strategy & Vision',
        items: [
          { id: 'fc1', label: 'Finalize FLOW concept document' },
          { id: 'fc2', label: 'Map each content section to a Raybern value prop' },
          { id: 'fc3', label: 'Define target audience segments within utilities' },
          { id: 'fc4', label: 'Define pass-around strategy' },
          { id: 'fc5', label: 'Decide on monetization model (vendor ads vs. ad-free)' },
        ],
      },
      {
        title: 'Content & Production System',
        items: [
          { id: 'fc6',  label: 'Build 4-issue content calendar (quarterly Year 1)' },
          { id: 'fc7',  label: 'Identify and validate recurring public data sources' },
          { id: 'fc8',  label: 'Create editorial style guide' },
          { id: 'fc9',  label: 'Establish content production workflow' },
          { id: 'fc10', label: 'Build review / approval process for named case studies' },
          { id: 'fc11', label: 'Design inspiration moodboard' },
        ],
      },
      {
        title: 'Distribution & Impact',
        items: [
          { id: 'fc12', label: 'Build master utility mailing list' },
          { id: 'fc13', label: 'Establish print vendor relationship and volume pricing' },
          { id: 'fc14', label: 'Define success metrics per issue' },
          { id: 'fc15', label: 'Plan supplemental digital version' },
          { id: 'fc16', label: 'Align newspaper release schedule with webinar and newsletter calendar' },
        ],
      },
    ],
  },
]

const STORAGE_KEY = 'raybern-checklist-v1'

function allItemIds(): string[] {
  return INITIATIVES.flatMap(i => i.sections.flatMap(s => s.items.map(it => it.id)))
}

function countItems(initiative: Initiative) {
  return initiative.sections.reduce((acc, s) => acc + s.items.length, 0)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setChecked(new Set(JSON.parse(raw)))
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
    } catch {}
  }, [checked, hydrated])

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalItems = allItemIds().length
  const totalDone = [...checked].filter(id => allItemIds().includes(id)).length
  const globalPct = Math.round((totalDone / totalItems) * 100)

  return (
    <div className='min-h-screen' style={{ background: 'var(--bg)' }}>
      <div className='max-w-5xl mx-auto px-6 py-8'>

        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-xl font-bold mb-1' style={{ color: 'var(--navy)' }}>
            Initiative Checklist
          </h1>
          <p className='text-sm mb-4' style={{ color: 'var(--text-muted)' }}>
            Track progress across Webinar, FLOW Newspaper, and Newsletter launch initiatives.
          </p>

          {/* Global progress bar */}
          <div className='flex items-center gap-3'>
            <div className='flex-1 h-2 rounded-full overflow-hidden' style={{ background: 'var(--border)' }}>
              <div
                className='h-2 rounded-full transition-all duration-500'
                style={{ width: `${globalPct}%`, background: 'var(--navy)' }}
              />
            </div>
            <span className='text-sm font-semibold tabular-nums' style={{ color: 'var(--navy)', minWidth: 48 }}>
              {totalDone}/{totalItems}
            </span>
            <span className='text-xs' style={{ color: 'var(--text-muted)' }}>{globalPct}% complete</span>
          </div>
        </div>

        {/* Initiative cards */}
        <div className='space-y-6'>
          {INITIATIVES.map(initiative => {
            const total = countItems(initiative)
            const done = initiative.sections
              .flatMap(s => s.items)
              .filter(it => checked.has(it.id)).length
            const pct = Math.round((done / total) * 100)

            return (
              <div key={initiative.id} className='rounded-2xl border overflow-hidden'
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>

                {/* Initiative header */}
                <div className='px-5 py-4 border-b' style={{ borderColor: 'var(--border)', background: initiative.color }}>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>{initiative.icon}</span>
                      <h2 className='font-bold text-base' style={{ color: initiative.accent }}>{initiative.title}</h2>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='w-28 h-1.5 rounded-full overflow-hidden' style={{ background: 'rgba(0,0,0,0.1)' }}>
                        <div
                          className='h-1.5 rounded-full transition-all duration-500'
                          style={{ width: `${pct}%`, background: initiative.accent }}
                        />
                      </div>
                      <span className='text-xs font-semibold tabular-nums' style={{ color: initiative.accent }}>
                        {done}/{total}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className='divide-y' style={{ borderColor: 'var(--border)' }}>
                  {initiative.sections.map(section => {
                    const secDone = section.items.filter(it => checked.has(it.id)).length
                    return (
                      <div key={section.title} className='px-5 py-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <h3 className='text-xs font-bold uppercase tracking-wide' style={{ color: 'var(--text-muted)' }}>
                            {section.title}
                          </h3>
                          <span className='text-xs tabular-nums' style={{ color: 'var(--text-muted)' }}>
                            {secDone}/{section.items.length}
                          </span>
                        </div>
                        <ul className='space-y-2'>
                          {section.items.map(item => {
                            const isDone = checked.has(item.id)
                            return (
                              <li key={item.id}>
                                <label
                                  className='flex items-start gap-3 cursor-pointer group select-none rounded-lg px-2 py-1.5 -mx-2 transition-colors'
                                  style={{
                                    background: isDone ? `${initiative.color}` : 'transparent',
                                  }}
                                >
                                  {/* Custom checkbox */}
                                  <div
                                    className='mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all'
                                    style={{
                                      background: isDone ? initiative.accent : 'white',
                                      borderColor: isDone ? initiative.accent : 'var(--border)',
                                    }}
                                  >
                                    {isDone && (
                                      <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
                                        <path d='M1 4L3.5 6.5L9 1' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                                      </svg>
                                    )}
                                  </div>
                                  <input
                                    type='checkbox'
                                    className='sr-only'
                                    checked={isDone}
                                    onChange={() => toggle(item.id)}
                                  />
                                  <span
                                    className='text-sm leading-relaxed transition-colors'
                                    style={{
                                      color: isDone ? initiative.accent : 'var(--text-dark)',
                                      textDecoration: isDone ? 'line-through' : 'none',
                                      opacity: isDone ? 0.65 : 1,
                                    }}
                                  >
                                    {item.label}
                                  </span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer reset */}
        <div className='mt-8 flex justify-end'>
          <button
            onClick={() => {
              if (confirm('Reset all checklist progress?')) setChecked(new Set())
            }}
            className='text-xs px-3 py-1.5 rounded-lg border transition-colors'
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'white' }}
          >
            Reset progress
          </button>
        </div>

      </div>
    </div>
  )
}
