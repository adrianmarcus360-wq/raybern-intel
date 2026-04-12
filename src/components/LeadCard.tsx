'use client'
import { useState } from 'react'
import { Mail, Phone, MapPin, Users, Droplets, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react'
import type { Lead } from '@/lib/types'
import ScoreRing from './ScoreRing'
import CopyButton from './CopyButton'

interface LeadCardProps {
  lead: Lead
}

const SIGNAL_ICONS = {
  danger: <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />,
  warning: <AlertTriangle size={13} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />,
  positive: <CheckCircle size={13} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />,
  info: <Info size={13} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />,
}

const SIGNAL_COLORS = {
  danger: '#ef4444',
  warning: '#f97316',
  positive: '#22c55e',
  info: '#6b7280',
}

export default function LeadCard({ lead }: LeadCardProps) {
  const [showDraft, setShowDraft] = useState(false)
  const [draftCopied, setDraftCopied] = useState(false)

  const tierColor = lead.tier.color
  const openViolations = lead.parsed_signals.open_violations

  const handleCopyDraft = async () => {
    const full = `Subject: ${lead.email_draft.subject}\n\n${lead.email_draft.body}`
    await navigator.clipboard.writeText(full)
    setDraftCopied(true)
    setTimeout(() => setDraftCopied(false), 2500)
  }

  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.2s ease',
        animation: 'fadeIn 0.3s ease-in-out',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#2d2d2d')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f1f1f')}
    >
      {/* TOP ACCENT BAR */}
      <div style={{ height: 3, background: tierColor, opacity: 0.8 }} />

      {/* HEADER */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <ScoreRing score={lead.lead_score} color={tierColor} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#e5e5e5',
                lineHeight: 1.3,
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lead.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#737373', fontSize: 12 }}>
                <MapPin size={11} />
                <span>{lead.city}, {lead.state}</span>
              </div>
            </div>
            {/* TIER BADGE */}
            <div style={{
              padding: '3px 9px',
              borderRadius: 20,
              background: `${tierColor}18`,
              border: `1px solid ${tierColor}30`,
              color: tierColor,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {lead.tier.label}
            </div>
          </div>

          {/* Open violations warning */}
          {openViolations > 0 && (
            <div style={{
              marginTop: 8,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#ef4444',
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <AlertCircle size={11} />
              {openViolations} unresolved violation{openViolations > 1 ? 's' : ''} with EPA right now
            </div>
          )}
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ height: 1, background: '#1e1e1e', margin: '0 20px' }} />

      {/* DECISION MAKER */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#525252', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Decision Maker
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#d4d4d4', marginBottom: 10 }}>
          {lead.admin_name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Mail size={12} style={{ color: '#525252', flexShrink: 0 }} />
            {lead.email ? (
              <>
                <a
                  href={`mailto:${lead.email}`}
                  style={{
                    color: '#6366f1',
                    fontSize: 12,
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {lead.email.toLowerCase()}
                </a>
                <CopyButton text={lead.email.toLowerCase()} label="email" />
              </>
            ) : (
              <span style={{ color: '#525252', fontSize: 12, fontStyle: 'italic' }}>Not publicly listed</span>
            )}
          </div>
          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={12} style={{ color: '#525252', flexShrink: 0 }} />
            <a
              href={`tel:${lead.phone}`}
              style={{ color: '#a3a3a3', fontSize: 12, textDecoration: 'none' }}
            >
              {lead.phone_formatted}
            </a>
            <CopyButton text={lead.phone_formatted} label="phone" />
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ height: 1, background: '#1e1e1e', margin: '0 20px' }} />

      {/* UTILITY PROFILE */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#525252', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Utility Profile
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#525252', marginBottom: 2 }}>People Served</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} style={{ color: '#525252' }} />
              {lead.population.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#525252', marginBottom: 2 }}>Meter Connections</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4' }}>
              {lead.connections.toLocaleString()}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 10, color: '#525252', marginBottom: 3 }}>Water Source</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Droplets size={12} style={{ color: '#6366f1', marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#d4d4d4' }}>
                  {lead.source_water_label}
                </div>
                <div style={{ fontSize: 11, color: '#737373', marginTop: 2, lineHeight: 1.4 }}>
                  {lead.source_water_description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ height: 1, background: '#1e1e1e', margin: '0 20px' }} />

      {/* WHY THIS LEAD */}
      <div style={{ padding: '14px 20px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#525252', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Why This Lead
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {lead.clean_signals.slice(0, 5).map((signal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {SIGNAL_ICONS[signal.type]}
              <span style={{ fontSize: 12, color: SIGNAL_COLORS[signal.type], lineHeight: 1.4 }}>
                {signal.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OUTREACH DRAFT TOGGLE */}
      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={() => setShowDraft(!showDraft)}
          style={{
            width: '100%',
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid #2a2a2a',
            background: showDraft ? '#1f1f1f' : 'transparent',
            color: '#a3a3a3',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1f1f1f'; e.currentTarget.style.color = '#e5e5e5' }}
          onMouseLeave={e => { e.currentTarget.style.background = showDraft ? '#1f1f1f' : 'transparent'; e.currentTarget.style.color = '#a3a3a3' }}
        >
          <Mail size={13} />
          {showDraft ? 'Hide Outreach Draft' : 'View Outreach Draft'}
          {showDraft ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showDraft && (
          <div style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 8,
            background: '#0f0f0f',
            border: '1px solid #232323',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Subject</div>
              <div style={{ fontSize: 12, color: '#d4d4d4', fontWeight: 500, lineHeight: 1.4 }}>
                {lead.email_draft.subject}
              </div>
            </div>
            <div style={{ height: 1, background: '#1e1e1e', marginBottom: 10 }} />
            <div style={{ fontSize: 12, color: '#a3a3a3', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {lead.email_draft.body}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopyDraft}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #2a2a2a',
                  background: draftCopied ? 'rgba(34,197,94,0.1)' : '#1a1a1a',
                  color: draftCopied ? '#22c55e' : '#a3a3a3',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {draftCopied ? '✓ Copied to clipboard' : '⎘ Copy entire email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
