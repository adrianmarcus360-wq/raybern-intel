'use client'
import { useState } from 'react'

// Webinar anatomy — each webinar is a full campaign system
interface Webinar {
  id: string
  title: string
  subtitle: string
  status: 'planning' | 'live' | 'completed'
  date: string | null
  platform: string | null
  meeting_link: string | null
  registration_link: string | null
  topic_angle: string
  target_audience: string[]
  invite_tiers: string[]
  phases: Phase[]
  assets: Asset[]
  post_event: PostEvent | null
}

interface Phase {
  name: string
  weeks: string
  items: string[]
  status: 'upcoming' | 'active' | 'done'
}

interface Asset {
  type: 'linkedin_post' | 'invite_email' | 'landing_copy' | 'follow_up' | 'slide_deck' | 'recording'
  label: string
  status: 'draft' | 'ready' | 'sent' | 'needed'
  notes?: string
}

interface PostEvent {
  registrants: number | null
  attendees: number | null
  audit_calls: number | null
  follow_up_status: 'pending' | 'in_progress' | 'done'
  notes: string
}

const WEBINARS: Webinar[] = [
  {
    id: 'q2-2026',
    title: 'Q2 2026 — Topic TBD',
    subtitle: 'Quarterly brand & relationship webinar',
    status: 'planning',
    date: null,
    platform: null,
    meeting_link: null,
    registration_link: null,
    topic_angle: 'To be defined — options: (1) "What your compliance data is actually telling you" · (2) "The hidden cost of disconnected utility systems" · (3) "How water utilities are silently failing their reporting requirements"',
    target_audience: ['Utility Directors', 'Compliance Officers', 'Finance / Admin', 'City/County Management'],
    invite_tiers: ['Tier 1 — All 21 leads', 'Tier 2 — Select warm leads', 'Existing HubSpot contacts'],
    phases: [
      {
        name: 'Content & Positioning',
        weeks: '8–6 weeks out',
        status: 'upcoming',
        items: [
          'Lock topic angle + working title',
          'Define the 3–5 key talking points (no vendor names)',
          'Draft 60-second "hook" intro that every guest hears',
          'Prep 1 anonymized case study (utility pattern, not client name — TBD)',
          'Align CTA language: "free alignment session" framing',
        ],
      },
      {
        name: 'Invitations & LinkedIn',
        weeks: '6–4 weeks out',
        status: 'upcoming',
        items: [
          'Pull Tier 1 + Tier 2 invite list from Intelligence module',
          'Pull existing HubSpot contacts (once connected)',
          'Draft cold invite email — verified facts only, no vendor assumptions',
          'LinkedIn post #1: topic tease (no pitch)',
          'LinkedIn post #2: "why this matters right now" + data point from EPA',
          'Send invites — week 5',
          'LinkedIn post #3: early registration nudge',
        ],
      },
      {
        name: 'Final Prep & Promotion',
        weeks: '3–1 weeks out',
        status: 'upcoming',
        items: [
          'Reminder email to registered (1 week out)',
          'LinkedIn post #4: "seats filling" (if applicable)',
          'Finalize slide deck (brand-consistent, data-forward)',
          'Day-before reminder email',
          'Final run-through / tech check',
        ],
      },
      {
        name: 'Webinar Day',
        weeks: 'Event day',
        status: 'upcoming',
        items: [
          'Open 15 min early for attendee networking',
          'Content: 35–40 min (no hard pitch)',
          'Q&A: 10–15 min',
          'CTA close: "If any of this resonated — we do a free alignment session, no agenda, just clarity."',
          'Drop registration/booking link in chat',
        ],
      },
      {
        name: 'Follow-Up & Conversion',
        weeks: '1–2 weeks after',
        status: 'upcoming',
        items: [
          'Send recording + summary to all registrants (next day)',
          'Identify hand-raisers (clicked CTA, asked questions, replied)',
          'Personal follow-up to hand-raisers within 48h',
          'Soft follow-up to all attendees at day 5',
          'Add qualified attendees back into Intelligence outreach sequences',
          'Log audit alignment sessions booked',
          'Newsletter: publish post-webinar recap issue',
        ],
      },
    ],
    assets: [
      { type: 'linkedin_post',  label: 'LinkedIn Post #1 — Topic Tease',       status: 'needed' },
      { type: 'linkedin_post',  label: 'LinkedIn Post #2 — Why It Matters',     status: 'needed' },
      { type: 'linkedin_post',  label: 'LinkedIn Post #3 — Registration Nudge', status: 'needed' },
      { type: 'linkedin_post',  label: 'LinkedIn Post #4 — Last Call',           status: 'needed' },
      { type: 'invite_email',   label: 'Cold Invite Email',                      status: 'needed' },
      { type: 'landing_copy',   label: 'Registration Page Copy',                 status: 'needed' },
      { type: 'invite_email',   label: 'Reminder Email (1 week out)',            status: 'needed' },
      { type: 'invite_email',   label: 'Day-Before Reminder',                    status: 'needed' },
      { type: 'slide_deck',     label: 'Slide Deck',                             status: 'needed' },
      { type: 'follow_up',      label: 'Post-Event Recording Email',             status: 'needed' },
      { type: 'follow_up',      label: 'Hand-Raiser Personal Follow-Up',         status: 'needed' },
      { type: 'follow_up',      label: 'All-Attendee Day-5 Follow-Up',           status: 'needed' },
    ],
    post_event: null,
  },
]

const PHASE_COLORS = {
  upcoming: { bg: '#F9FAFB', border: '#E5E7EB', dot: '#9CA3AF', label: 'Upcoming' },
  active:   { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', label: 'Active'   },
  done:     { bg: '#F0FDF4', border: '#BBF7D0', dot: '#10B981', label: 'Done'     },
}

const ASSET_TYPE_ICON: Record<string, string> = {
  linkedin_post: '💼',
  invite_email: '📧',
  landing_copy: '🌐',
  follow_up: '↩️',
  slide_deck: '🖥',
  recording: '▶️',
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  needed:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Needed'  },
  draft:   { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Draft'   },
  ready:   { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE', label: 'Ready'   },
  sent:    { bg: '#F0FDF4', color: '#065F46', border: '#BBF7D0', label: 'Sent ✓' },
}

export default function WebinarsPage() {
  const [selected, setSelected] = useState<string>(WEBINARS[0].id)
  const webinar = WEBINARS.find(w => w.id === selected)!

  const doneAssets = webinar.assets.filter(a => a.status === 'sent' || a.status === 'ready').length
  const totalAssets = webinar.assets.length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Webinar System</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Minimum 1 per quarter · Brand & relationship play · CTA: free alignment session
            </p>
          </div>
          <button className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--navy)' }}>
            + New Webinar
          </button>
        </div>

        {/* Webinar list + detail layout */}
        <div className="flex gap-5">

          {/* Sidebar: webinar list */}
          <div className="w-64 shrink-0 space-y-2">
            {WEBINARS.map(w => (
              <button key={w.id} onClick={() => setSelected(w.id)}
                className="w-full text-left rounded-xl p-4 border transition-all"
                style={{
                  background: selected === w.id ? 'var(--navy)' : 'white',
                  borderColor: selected === w.id ? 'var(--navy)' : 'var(--border)',
                  color: selected === w.id ? 'white' : 'var(--navy)',
                }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-1"
                  style={{ color: selected === w.id ? '#7EA4C4' : 'var(--text-muted)' }}>
                  {w.status === 'planning' ? '📋 Planning' : w.status === 'live' ? '🔴 Live' : '✓ Completed'}
                </div>
                <div className="font-semibold text-sm leading-tight">{w.title}</div>
                <div className="text-xs mt-1" style={{ color: selected === w.id ? '#7EA4C4' : 'var(--text-muted)' }}>
                  {w.date || 'Date TBD'}
                </div>
              </button>
            ))}

            {/* Quarterly schedule reminder */}
            <div className="rounded-xl p-4 border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="text-xs font-bold" style={{ color: '#92400E' }}>Quarterly Schedule</div>
              <div className="text-xs mt-1 space-y-1" style={{ color: '#78350F' }}>
                <div>Q2 2026 — TBD</div>
                <div className="opacity-50">Q3 2026 — Planned</div>
                <div className="opacity-50">Q4 2026 — Planned</div>
              </div>
            </div>
          </div>

          {/* Main: webinar detail */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Webinar header card */}
            <div className="detail-card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
                      style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' }}>
                      📋 Planning
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Assets: {doneAssets}/{totalAssets} ready
                    </span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>{webinar.title}</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{webinar.subtitle}</p>
                </div>
              </div>

              {/* Event details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Date', val: webinar.date || '—', note: 'TBD' },
                  { label: 'Platform', val: webinar.platform || '—', note: 'Zoom / Teams / TBD' },
                  { label: 'Meeting Link', val: webinar.meeting_link ? 'Set' : '—', note: 'Add when booked' },
                  { label: 'Registration', val: webinar.registration_link ? 'Live' : '—', note: 'Landing page URL' },
                ].map(f => (
                  <div key={f.label} className="rounded-lg p-3 border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</div>
                    <div className="font-bold text-sm" style={{ color: f.val === '—' ? '#9CA3AF' : 'var(--navy)' }}>{f.val}</div>
                    {f.val === '—' && <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{f.note}</div>}
                  </div>
                ))}
              </div>

              {/* Topic angle */}
              <div className="mt-4 rounded-lg p-4 border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#1E40AF' }}>Topic Angle Options</div>
                <p className="text-sm" style={{ color: '#1E3A5F' }}>{webinar.topic_angle}</p>
              </div>
            </div>

            {/* Invite targets */}
            <div className="detail-card">
              <h3 className="mb-3">Invite List</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {webinar.invite_tiers.map(t => (
                  <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{ background: '#DBEAFE', color: '#1E40AF', borderColor: '#BFDBFE' }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {webinar.target_audience.map(a => (
                  <div key={a} className="rounded-lg px-3 py-2 text-xs border text-center"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {a}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs p-3 rounded-lg border" style={{ background: '#FFF7ED', borderColor: '#FDE68A', color: '#78350F' }}>
                <strong>Invite messaging rule:</strong> Only reference verified facts (EPA violations, population size, service area). Do not mention specific vendor names. Frame as industry expertise, not individual research.
              </div>
            </div>

            {/* Phases */}
            <div className="detail-card">
              <h3 className="mb-4">Campaign Phases</h3>
              <div className="space-y-3">
                {webinar.phases.map((phase, i) => {
                  const c = PHASE_COLORS[phase.status]
                  return (
                    <div key={i} className="rounded-xl border overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ background: c.bg, borderColor: c.border }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }}></span>
                        <div className="flex-1">
                          <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>{phase.name}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{phase.weeks}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: c.dot + '20', color: c.dot }}>
                          {c.label}
                        </span>
                      </div>
                      <div className="px-4 py-3" style={{ background: 'white' }}>
                        <ul className="space-y-1.5">
                          {phase.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>○</span>
                              <span style={{ color: 'var(--text-dark)' }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assets */}
            <div className="detail-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="!mb-0">Assets Checklist</h3>
                <span className="text-sm font-bold" style={{ color: doneAssets === totalAssets ? '#16A34A' : 'var(--text-muted)' }}>
                  {doneAssets}/{totalAssets}
                </span>
              </div>
              <div className="space-y-2">
                {webinar.assets.map((asset, i) => {
                  const s = STATUS_STYLE[asset.status]
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{ASSET_TYPE_ICON[asset.type]}</span>
                        <span className="text-sm font-medium">{asset.label}</span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Post-event (placeholder) */}
            <div className="detail-card" style={{ opacity: 0.6 }}>
              <h3>Post-Event Results</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Available after the event — registrants, attendees, audit calls booked, follow-up status.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {['Registrants', 'Attendees', 'Audit Calls Booked'].map(l => (
                  <div key={l} className="rounded-lg p-4 border text-center" style={{ borderStyle: 'dashed', borderColor: 'var(--border)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#D1D5DB' }}>—</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
