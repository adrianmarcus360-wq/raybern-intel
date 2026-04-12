'use client'
import { useState } from 'react'
import { CopyButton } from './CopyButton'

interface Email {
  touch: number
  day: number
  subject: string
  body: string
}

export function EmailSequence({ emails, utilityName }: { emails: Email[]; utilityName: string }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="detail-card mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="!mb-0">3-Touch Outreach Sequence</h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--tan-dark)', color: 'var(--text-muted)' }}>
          Pre-written for {utilityName.split('(')[0].trim()}
        </span>
      </div>
      <div className="flex gap-2 mb-4">
        {emails.map((e, i) => (
          <button key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-all text-left"
            style={{
              background: open === i ? 'var(--navy)' : 'var(--tan)',
              color: open === i ? 'white' : 'var(--text)',
              borderColor: open === i ? 'var(--navy)' : 'var(--border)',
            }}>
            <div className="font-semibold">Touch {e.touch}</div>
            <div className="text-xs opacity-70">Day {e.day}</div>
          </button>
        ))}
      </div>
      {emails.map((e, i) => open === i && (
        <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--tan-dark)' }}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide mr-2" style={{ color: 'var(--text-muted)' }}>Subject:</span>
              <span className="text-sm font-medium">{e.subject}</span>
            </div>
            <CopyButton text={`Subject: ${e.subject}\n\n${e.body}`} label="Copy email" />
          </div>
          <pre className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap bg-white"
            style={{ fontFamily: 'inherit' }}>
            {e.body}
          </pre>
        </div>
      ))}
    </div>
  )
}
