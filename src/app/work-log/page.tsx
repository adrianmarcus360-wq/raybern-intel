'use client'
import worklogRaw from '../../data/worklog.json'
import { useState } from 'react'

type Entry = {
  id: number
  date_label: string
  work_date: string
  phase: string
  category: string
  milestone: string
  output: string
  status: string
  tldr: string
}

const ENTRIES: Entry[] = worklogRaw as Entry[]

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Research':             { bg: '#EEF2FF', color: '#4338CA' },
  'Strategy':             { bg: '#F0FDF4', color: '#166534' },
  'Data Architecture':    { bg: '#ECFEFF', color: '#0E7490' },
  'Data Pull':            { bg: '#FFF7ED', color: '#C2410C' },
  'Dashboard':            { bg: '#F5F3FF', color: '#6D28D9' },
  'SaaS Build':           { bg: '#F5F3FF', color: '#6D28D9' },
  'Growth Strategy':      { bg: '#F0FDF4', color: '#166534' },
  'Growth Documentation': { bg: '#F0FDF4', color: '#166534' },
  'Webinar':              { bg: '#FEF9C3', color: '#854D0E' },
  'Content Strategy':     { bg: '#FDF2F8', color: '#9D174D' },
  'Content Build':        { bg: '#FDF2F8', color: '#9D174D' },
  'LinkedIn Strategy':    { bg: '#EFF6FF', color: '#1D4ED8' },
  'Newsletter Development': { bg: '#FFF1F2', color: '#9F1239' },
  'Outreach':             { bg: '#ECFDF5', color: '#065F46' },
  'Campaign Planning':    { bg: '#FFF7ED', color: '#C2410C' },
  'Client Meeting':       { bg: '#F8FAFC', color: '#334155' },
  'Client Relations':     { bg: '#F8FAFC', color: '#334155' },
  'Client Communications':{ bg: '#F8FAFC', color: '#334155' },
  'Platform Setup':       { bg: '#EEF2FF', color: '#4338CA' },
  'Brand & Design':       { bg: '#FFF1F2', color: '#9F1239' },
  'Web':                  { bg: '#EFF6FF', color: '#1D4ED8' },
  'Conference':           { bg: '#FEF9C3', color: '#854D0E' },
  'Conference Video':     { bg: '#FEF9C3', color: '#854D0E' },
  'Sales Enablement':     { bg: '#ECFDF5', color: '#065F46' },
  'Work Log System':      { bg: '#F5F3FF', color: '#6D28D9' },
  'Billing Audit':        { bg: '#FFF7ED', color: '#C2410C' },
  'Documentation Strategy':{ bg: '#EFF6FF', color: '#1D4ED8' },
  'Project Kickoff':      { bg: '#F0FDF4', color: '#166534' },
}

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: '#F9FAFB', color: '#374151' }
}

function groupByDate(entries: Entry[]) {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    if (!map.has(e.work_date)) map.set(e.work_date, [])
    map.get(e.work_date)!.push(e)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function formatDate(d: string) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function monthOf(d: string) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const ALL_CATEGORIES = [...new Set(ENTRIES.map(e => e.category))].sort()

export default function WorkLogPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const filtered = ENTRIES.filter(e => {
    const s = search.toLowerCase()
    const matchSearch = !s || e.milestone.toLowerCase().includes(s) || e.tldr.toLowerCase().includes(s) ||
      e.category.toLowerCase().includes(s) || e.output.toLowerCase().includes(s) || e.phase.toLowerCase().includes(s)
    const matchCat = catFilter === 'all' || e.category === catFilter
    return matchSearch && matchCat
  })

  const grouped = groupByDate(filtered)
  const totalDays = grouped.length

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  let lastMonth = ''

  return (
    <div className='min-h-screen' style={{ background: 'var(--bg)' }}>
      <div className='max-w-4xl mx-auto px-6 py-8'>

        {/* Header */}
        <div className='mb-7'>
          <h1 className='text-xl font-bold mb-1' style={{ color: 'var(--navy)' }}>Work Log</h1>
          <p className='text-sm' style={{ color: 'var(--text-muted)' }}>
            Documented work sessions across all Raybern growth initiatives — {ENTRIES.length} entries across {[...new Set(ENTRIES.map(e => e.work_date))].length} days.
          </p>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-3 mb-6 items-center'>
          <input
            type='text'
            placeholder='Search entries…'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border outline-none'
            style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-dark)' }}
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className='px-3 py-2 text-sm rounded-lg border outline-none'
            style={{ borderColor: 'var(--border)', background: 'white', color: 'var(--text-dark)' }}>
            <option value='all'>All categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
            {filtered.length} entries · {totalDays} days
          </span>
        </div>

        {/* Timeline */}
        {grouped.length === 0 ? (
          <div className='text-center py-16 text-sm' style={{ color: 'var(--text-muted)' }}>No entries match your filters.</div>
        ) : (
          <div>
            {grouped.map(([date, entries]) => {
              const month = monthOf(date)
              const showMonth = month !== lastMonth
              lastMonth = month

              return (
                <div key={date}>
                  {showMonth && (
                    <div className='sticky top-0 z-10 py-2 mb-3' style={{ background: 'var(--bg)' }}>
                      <div className='text-xs font-bold uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>{month}</div>
                    </div>
                  )}

                  <div className='mb-6'>
                    {/* Date header */}
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-2 h-2 rounded-full flex-shrink-0' style={{ background: 'var(--navy)' }} />
                      <h2 className='text-sm font-bold' style={{ color: 'var(--navy)' }}>{formatDate(date)}</h2>
                      <span className='text-xs px-2 py-0.5 rounded-full' style={{ background: 'var(--card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {entries.length} {entries.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Entries */}
                    <div className='ml-5 space-y-2'>
                      {entries.map(e => {
                        const isOpen = expanded.has(e.id)
                        const cs = categoryStyle(e.category)
                        return (
                          <div key={e.id}
                            className='rounded-xl border overflow-hidden'
                            style={{ borderColor: 'var(--border)' }}>
                            <button
                              className='w-full text-left px-4 py-3 flex items-start gap-3'
                              style={{ background: 'var(--card)' }}
                              onClick={() => toggle(e.id)}>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 flex-wrap mb-1'>
                                  <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                                    style={{ background: cs.bg, color: cs.color }}>
                                    {e.category}
                                  </span>
                                </div>
                                <p className='text-sm font-medium leading-snug' style={{ color: 'var(--text-dark)' }}>
                                  {e.tldr}
                                </p>
                              </div>
                              <span className='text-xs mt-0.5 flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
                                {isOpen ? '▲' : '▼'}
                              </span>
                            </button>

                            {isOpen && (
                              <div className='px-4 pb-4 border-t' style={{ borderColor: 'var(--border)', background: '#F9FAFB' }}>
                                <div className='pt-3 space-y-3'>
                                  <div>
                                    <div className='text-xs font-bold uppercase tracking-wide mb-1' style={{ color: 'var(--text-muted)' }}>What we did</div>
                                    <p className='text-sm' style={{ color: 'var(--text-dark)' }}>{e.milestone}</p>
                                  </div>
                                  {e.output && (
                                    <div>
                                      <div className='text-xs font-bold uppercase tracking-wide mb-1' style={{ color: 'var(--text-muted)' }}>Output / Deliverable</div>
                                      <p className='text-sm' style={{ color: 'var(--text-dark)' }}>{e.output}</p>
                                    </div>
                                  )}
                                  <div className='flex items-center gap-2'>
                                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                                      style={{ background: '#ECFDF5', color: '#065F46' }}>
                                      {e.status}
                                    </span>
                                    <span className='text-xs' style={{ color: 'var(--text-muted)' }}>{e.phase}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
