'use client'
import { useState } from 'react'

// Newsletter system — national compliance digest
// Platform: Beehiiv (connect when ready)
// Audience: utility directors, compliance officers, city/county management
// Cadence: TBD (monthly recommended)
// Angle: data-forward, "what the numbers say this month" + team insight + case study

interface Issue {
  id: string
  title: string
  subtitle: string
  status: 'draft' | 'scheduled' | 'sent'
  send_date: string | null
  subject_line: string | null
  preview_text: string | null
  sections: IssueSection[]
  stats?: { sent?: number; open_rate?: number; click_rate?: number; replies?: number }
}

interface IssueSection {
  type: 'data_spotlight' | 'team_insight' | 'case_study' | 'compliance_calendar' | 'cta'
  title: string
  content: string
  source?: string
  status: 'needed' | 'draft' | 'ready'
}

// Newsletter content formula
const FORMULA = [
  {
    block: '📊 Data Spotlight',
    desc: '2–3 data points from public EPA/SDWIS data this month — new violations issued, state trends, common failure patterns. Rounded into plain numbers anyone can understand.',
    source: 'EPA SDWIS, ECHO, state regulatory portals',
    why: 'Makes the newsletter worth reading every month even if nothing else changes — data is self-generating.',
  },
  {
    block: '👁 What We\'re Seeing',
    desc: 'One observation from Raybern\'s team — what\'s showing up in client work, a pattern in compliance failures, a system issue they\'ve encountered. 2–4 sentences, no client names required.',
    source: 'Team internal (Raybern adds this)',
    why: 'Signals expertise and builds trust. This is the "only Raybern can say this" section.',
  },
  {
    block: '📁 Case Study (Optional)',
    desc: 'Anonymized real example: "A mid-size utility in the Southeast was running X. Here\'s what we found when we looked under the hood, and what changed." Name optional — Raybern decides issue by issue.',
    source: 'Team — anonymized engagement',
    why: 'Highest-trust content type. People forward this.',
  },
  {
    block: '📅 Compliance Calendar',
    desc: 'What\'s coming up in the next 30–60 days — deadlines, reporting windows, new rules taking effect. Sourced from EPA and state regulators.',
    source: 'EPA, state regulatory calendars',
    why: 'Purely useful, no pitch. People save issues with compliance calendars.',
  },
  {
    block: '🤝 Work With Us (CTA)',
    desc: 'Soft, one paragraph. "If any of this mirrors what you\'re dealing with — we do a free alignment session. No agenda, just clarity on what\'s happening in your system." Link to book.',
    source: 'n/a',
    why: 'Same energy as the webinar close — soft, earned, non-pushy.',
  },
]

const ISSUES: Issue[] = [
  {
    id: 'issue-001',
    title: 'Issue #001 — Launch Issue',
    subtitle: 'Inaugural edition · Water utility compliance trends',
    status: 'draft',
    send_date: null,
    subject_line: null,
    preview_text: null,
    sections: [
      {
        type: 'data_spotlight',
        title: 'Data Spotlight: What the EPA numbers say right now',
        content: '',
        source: 'EPA SDWIS national data',
        status: 'needed',
      },
      {
        type: 'team_insight',
        title: "What We're Seeing",
        content: '',
        source: 'Raybern team',
        status: 'needed',
      },
      {
        type: 'case_study',
        title: 'Case Study',
        content: '',
        source: 'Raybern engagement (anonymized)',
        status: 'needed',
      },
      {
        type: 'compliance_calendar',
        title: 'Compliance Calendar — Next 60 Days',
        content: '',
        source: 'EPA + state regulators',
        status: 'needed',
      },
      {
        type: 'cta',
        title: 'Work With Us',
        content: 'If any of this mirrors what you\'re dealing with — we do a free alignment session. No agenda, just clarity on what\'s happening under the hood of your system.',
        status: 'draft',
      },
    ],
  },
]

const SECTION_ICON: Record<string, string> = {
  data_spotlight: '📊', team_insight: '👁', case_study: '📁', compliance_calendar: '📅', cta: '🤝',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  needed:    { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  draft:     { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  ready:     { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  scheduled: { bg: '#EDE9FE', color: '#4C1D95', border: '#DDD6FE' },
  sent:      { bg: '#F0FDF4', color: '#065F46', border: '#BBF7D0' },
}

export default function NewsletterPage() {
  const [tab, setTab] = useState<'issues' | 'formula' | 'connections'>('issues')
  const [selectedIssue, setSelectedIssue] = useState<string>(ISSUES[0].id)
  const issue = ISSUES.find(i => i.id === selectedIssue)!

  const readySections = issue.sections.filter(s => s.status === 'ready').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Newsletter</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              National compliance digest · Data-forward · Built for utility stakeholders
            </p>
          </div>
          <button className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--navy)' }}>
            + New Issue
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { key: 'issues',      label: '📋 Issues' },
            { key: 'formula',     label: '🧪 Content Formula' },
            { key: 'connections', label: '🔌 Connections' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: tab === t.key ? 'var(--navy)' : 'var(--text-muted)',
                borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
                marginBottom: '-1px',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ISSUES TAB */}
        {tab === 'issues' && (
          <div className="flex gap-5">
            {/* Issue sidebar */}
            <div className="w-64 shrink-0 space-y-2">
              {ISSUES.map(iss => (
                <button key={iss.id} onClick={() => setSelectedIssue(iss.id)}
                  className="w-full text-left rounded-xl p-4 border transition-all"
                  style={{
                    background: selectedIssue === iss.id ? 'var(--navy)' : 'white',
                    borderColor: selectedIssue === iss.id ? 'var(--navy)' : 'var(--border)',
                    color: selectedIssue === iss.id ? 'white' : 'var(--navy)',
                  }}>
                  <div className="text-xs font-bold mb-1"
                    style={{ color: selectedIssue === iss.id ? '#7EA4C4' : 'var(--text-muted)' }}>
                    {iss.status === 'draft' ? '✏️ Draft' : iss.status === 'scheduled' ? '⏰ Scheduled' : '✓ Sent'}
                  </div>
                  <div className="font-semibold text-sm leading-tight">{iss.title}</div>
                  <div className="text-xs mt-1"
                    style={{ color: selectedIssue === iss.id ? '#7EA4C4' : 'var(--text-muted)' }}>
                    {iss.send_date || 'Date TBD'}
                  </div>
                </button>
              ))}

              {/* Beehiiv connection card */}
              <div className="rounded-xl p-4 border"
                style={{ background: '#F9FAFB', borderColor: '#E5E7EB', borderStyle: 'dashed' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#374151' }}>📬 Beehiiv</div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Connect to sync subscribers and send directly. Ready when you are.
                </div>
                <button className="mt-2 w-full text-xs py-1.5 rounded-lg font-semibold border"
                  style={{ background: 'white', borderColor: '#D1D5DB', color: '#374151' }}>
                  Connect Beehiiv →
                </button>
              </div>
            </div>

            {/* Issue detail */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Issue meta */}
              <div className="detail-card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                        style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' }}>
                        ✏️ Draft
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Sections: {readySections}/{issue.sections.length} ready
                      </span>
                    </div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>{issue.title}</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{issue.subtitle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Send Date', val: issue.send_date || '—', note: 'TBD' },
                    { label: 'Subject Line', val: issue.subject_line ? 'Set' : '—', note: 'Add before scheduling' },
                    { label: 'Preview Text', val: issue.preview_text ? 'Set' : '—', note: 'Add before scheduling' },
                  ].map(f => (
                    <div key={f.label} className="rounded-lg p-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                      <div className="font-bold text-sm" style={{ color: f.val === '—' ? '#9CA3AF' : 'var(--navy)' }}>{f.val}</div>
                      {f.val === '—' && <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{f.note}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="detail-card">
                <h3 className="mb-4">Issue Sections</h3>
                <div className="space-y-3">
                  {issue.sections.map((sec, i) => {
                    const s = STATUS_STYLE[sec.status]
                    return (
                      <div key={i} className="rounded-xl border overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b"
                          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{SECTION_ICON[sec.type]}</span>
                            <span className="font-semibold text-sm">{sec.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {sec.source && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Source: {sec.source}
                              </span>
                            )}
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                              style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                              {sec.status}
                            </span>
                          </div>
                        </div>
                        <div className="px-4 py-3" style={{ background: 'white' }}>
                          {sec.content ? (
                            <p className="text-sm" style={{ color: 'var(--text-dark)' }}>{sec.content}</p>
                          ) : (
                            <p className="text-sm italic" style={{ color: '#9CA3AF' }}>
                              Content needed — {sec.type === 'data_spotlight' ? 'will be pulled from EPA SDWIS data' :
                                sec.type === 'team_insight' ? 'Raybern team to provide' :
                                sec.type === 'case_study' ? 'Raybern team to provide (anonymized)' :
                                sec.type === 'compliance_calendar' ? 'will be pulled from EPA + state regulatory calendars' :
                                'Copy ready above — customize booking link when available'}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* FORMULA TAB */}
        {tab === 'formula' && (
          <div className="max-w-2xl space-y-4">
            <div className="detail-card" style={{ borderLeft: '4px solid var(--navy)' }}>
              <div className="font-bold text-base mb-1" style={{ color: 'var(--navy)' }}>The Content Formula</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                National scope. No state-specific variants. Data-forward so it stays fresh every issue automatically.
                Multiple stakeholder types at each account should find it useful — from compliance officers to finance to directors.
              </p>
            </div>

            {FORMULA.map((block, i) => (
              <div key={i} className="detail-card">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{block.block.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1" style={{ color: 'var(--navy)' }}>
                      {block.block.split(' ').slice(1).join(' ')}
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-dark)' }}>{block.desc}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>
                        <strong>Source:</strong> {block.source}
                      </span>
                    </div>
                    <div className="mt-2 text-xs p-2 rounded-lg"
                      style={{ background: '#EFF6FF', color: '#1E3A5F' }}>
                      💡 {block.why}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-xl p-4 border text-sm" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#78350F' }}>
              <strong>On case study naming:</strong> Raybern decides issue by issue whether to name the client.
              Even anonymized ("a mid-size utility in the Southeast"), the specificity of the problem description builds more trust than most named examples.
              The story matters more than the logo.
            </div>
          </div>
        )}

        {/* CONNECTIONS TAB */}
        {tab === 'connections' && (
          <div className="max-w-2xl space-y-4">

            <div className="detail-card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div className="font-bold text-sm mb-1" style={{ color: 'var(--navy)' }}>Connection Status</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                These integrations are designed in and ready. Connect when the system has been reviewed and approved — no rebuild needed at that point.
              </p>
            </div>

            {/* Beehiiv */}
            <div className="detail-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ background: '#F3F4F6', color: '#374151' }}>B</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">Beehiiv</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                      ● Ready to connect
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    Newsletter distribution, subscriber list, open/click analytics, issue scheduling.
                  </p>
                  <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                    <div>✓ Subscriber sync — pull existing HubSpot contacts in when connected</div>
                    <div>✓ Send directly from Beehiiv with this platform managing content/schedule</div>
                    <div>✓ Open rate + click tracking feeds back here</div>
                    <div>✓ Web3Forms fallback if API is unavailable</div>
                  </div>
                  <button className="mt-3 text-sm px-4 py-2 rounded-lg font-medium border"
                    style={{ background: 'white', borderColor: '#D1D5DB', color: '#374151' }}>
                    Connect Beehiiv →
                  </button>
                </div>
              </div>
            </div>

            {/* HubSpot */}
            <div className="detail-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ background: '#FFF7ED', color: '#EA580C' }}>H</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm">HubSpot</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                      ● Ready to connect
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    Contact list sync, pipeline visibility, outreach deduplication. Current tier: read access + contact view.
                  </p>
                  <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                    <div>✓ See who in Intelligence is already in HubSpot before reaching out</div>
                    <div>✓ Tag HubSpot contacts for webinar invite lists</div>
                    <div>✓ Newsletter subscribers can be seeded from HubSpot contacts</div>
                    <div className="opacity-60">⏳ Automations/sequences — available on higher HubSpot tier</div>
                  </div>
                  <button className="mt-3 text-sm px-4 py-2 rounded-lg font-medium border"
                    style={{ background: 'white', borderColor: '#D1D5DB', color: '#374151' }}>
                    Connect HubSpot →
                  </button>
                </div>
              </div>
            </div>

            {/* Future integrations */}
            <div className="detail-card" style={{ opacity: 0.7 }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Future — Add When Ready
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Zoom / Webinar Platform', use: 'Webinar links, registrant list auto-sync' },
                  { name: 'LinkedIn',                use: 'Auto-schedule posts from webinar phase plan' },
                  { name: 'Calendly',                use: 'Audit alignment session booking link' },
                  { name: 'EPA SDWIS API',           use: 'Live violation data refresh (currently static)' },
                ].map(f => (
                  <div key={f.name} className="rounded-lg p-3 border" style={{ borderStyle: 'dashed', borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="text-xs font-semibold">{f.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.use}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
