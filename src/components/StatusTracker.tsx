'use client'
import { useState, useEffect } from 'react'

const STATUSES = [
  { key: 'not_contacted', label: 'Not Contacted', color: '#6B7280', bg: '#F9FAFB' },
  { key: 'contacted',     label: 'Contacted',     color: '#2563EB', bg: '#EFF6FF' },
  { key: 'in_convo',      label: 'In Conversation', color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'proposal',      label: 'Proposal Sent', color: '#D97706', bg: '#FFFBEB' },
  { key: 'won',           label: 'Closed Won ✓',  color: '#16A34A', bg: '#F0FDF4' },
  { key: 'lost',          label: 'Not a Fit',     color: '#DC2626', bg: '#FEF2F2' },
]

export function StatusTracker({ pwsid }: { pwsid: string }) {
  const [status, setStatus] = useState('not_contacted')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(`raybern_status_${pwsid}`)
    if (saved) setStatus(saved)
  }, [pwsid])

  function pick(key: string) {
    setStatus(key)
    localStorage.setItem(`raybern_status_${pwsid}`, key)
    setOpen(false)
  }

  const current = STATUSES.find(s => s.key === status) || STATUSES[0]

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5"
        style={{ background: current.bg, color: current.color, borderColor: current.color + '40' }}>
        {current.label} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 rounded-lg border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)', minWidth: 160 }}>
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => pick(s.key)}
              className="w-full px-4 py-2 text-left text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ background: s.bg, color: s.color }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
