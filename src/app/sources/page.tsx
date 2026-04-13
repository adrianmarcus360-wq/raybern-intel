'use client'
import { useState } from 'react'

// Sources Registry — every data source used across the Growth Hub
// Purpose: full transparency for client and team. As new sources are added, they live here.

interface Source {
  id: string
  name: string
  url: string
  category: 'regulatory' | 'public_records' | 'research' | 'company' | 'tool'
  used_in: ('intelligence' | 'webinars' | 'newsletter')[]
  what_it_is: string
  what_we_use_it_for: string
  what_it_tells_us: string
  confidence_it_produces: 'verified' | 'high' | 'medium' | 'low'
  update_frequency: string
  notes?: string
}

const SOURCES: Source[] = [
  // ── REGULATORY ──────────────────────────────────────────────────
  {
    id: 'epa-sdwis',
    name: 'EPA SDWIS / SDWIS Federal Reports',
    url: 'https://sdwis.epa.gov/ords/sfdw_pub/f?p=108:1',
    category: 'regulatory',
    used_in: ['intelligence', 'newsletter'],
    what_it_is: 'The EPA\'s Safe Drinking Water Information System — the federal database of all public water systems in the U.S., their violations, enforcement actions, and compliance history.',
    what_we_use_it_for: 'Primary data source for all 69 utility prospect profiles. We pull violation counts, types, open vs. resolved status, population served, system ID (PWSID), and geographic data.',
    what_it_tells_us: 'Which utilities have active violations, what types (bacteria testing missed, reporting failures, disinfectant levels), how long violations have been open, and which are under formal enforcement. Directly signals urgency and Raybern opportunity.',
    confidence_it_produces: 'verified',
    update_frequency: 'Quarterly (EPA updates cycle)',
    notes: 'This is the only source where violations are 100% verified — it is the federal record. Everything built from this data carries "Verified" confidence.',
  },
  {
    id: 'epa-echo',
    name: 'EPA ECHO (Enforcement and Compliance History Online)',
    url: 'https://echo.epa.gov',
    category: 'regulatory',
    used_in: ['intelligence', 'newsletter'],
    what_it_is: 'EPA\'s public compliance database — a companion to SDWIS that adds enforcement actions, inspection history, and formal enforcement timelines.',
    what_we_use_it_for: 'Cross-referencing violation data; finding formal enforcement actions and consent orders that SDWIS alone doesn\'t surface; confirming violation timelines.',
    what_it_tells_us: 'Whether a utility has received formal enforcement letters, consent orders, or is under a compliance schedule. Escalates urgency score for affected leads.',
    confidence_it_produces: 'verified',
    update_frequency: 'Near real-time (EPA updates within days)',
  },
  {
    id: 'epa-compliance-calendars',
    name: 'EPA Regulatory Calendars & Federal Register',
    url: 'https://www.federalregister.gov/agencies/environmental-protection-agency',
    category: 'regulatory',
    used_in: ['newsletter'],
    what_it_is: 'EPA\'s public rule-making and compliance deadline notices published via the Federal Register and EPA.gov regulatory calendar.',
    what_we_use_it_for: 'The "Compliance Calendar" section of each newsletter issue — surfacing upcoming federal deadlines, new rules taking effect, comment periods, and reporting windows.',
    what_it_tells_us: 'What water utilities need to prepare for in the next 30–90 days. Makes the newsletter immediately useful to compliance staff regardless of whether they\'re a Raybern client.',
    confidence_it_produces: 'verified',
    update_frequency: 'Continuous (Federal Register publishes daily)',
  },

  // ── PUBLIC RECORDS ───────────────────────────────────────────────
  {
    id: 'state-contracts',
    name: 'State Procurement Portals & Public Contract Databases',
    url: 'https://www.commbuys.com',
    category: 'public_records',
    used_in: ['intelligence'],
    what_it_is: 'State-level public contract databases (e.g., COMMBUYS for Massachusetts, MYFLORIDAMARKETPLACE for Florida) listing awarded contracts, vendors, amounts, and dates.',
    what_we_use_it_for: 'Finding which vendors each utility has contracted with — confirming Tyler Technologies, consulting firms, engineering contractors, and chemical suppliers. Also surfaces when contracts expire (potential switching window).',
    what_it_tells_us: 'Confirmed vendor relationships and contract amounts. When a Tyler MUNIS contract was last bid, who won, and when it\'s up. This is the highest-confidence source for vendor confirmation.',
    confidence_it_produces: 'verified',
    update_frequency: 'Per contract award (updated as contracts are filed)',
    notes: 'Contract data found here is flagged "Verified" in the intelligence profiles. If a contract is not found in procurement portals, vendor data is flagged "High" or "Medium" based on secondary confirmation.',
  },
  {
    id: 'annual-reports',
    name: 'Utility Annual Reports & CCRs (Consumer Confidence Reports)',
    url: 'https://www.epa.gov/ccr',
    category: 'public_records',
    used_in: ['intelligence'],
    what_it_is: 'Annual Consumer Confidence Reports that every public water utility is federally required to publish and make available to customers. Also includes utility-published annual reports.',
    what_we_use_it_for: 'Confirming decision maker names and titles, finding financial/operational data, identifying infrastructure improvement projects, and understanding a utility\'s self-reported priorities.',
    what_it_tells_us: 'Which systems the utility is upgrading, how they describe their compliance challenges, and who leads operations. Often names the exact person (Director of Public Works, Water Superintendent) we should contact.',
    confidence_it_produces: 'high',
    update_frequency: 'Annual (published by July 1 each year)',
  },
  {
    id: 'public-meeting-minutes',
    name: 'Municipal Meeting Minutes & Agendas',
    url: '',
    category: 'public_records',
    used_in: ['intelligence'],
    what_it_is: 'Publicly posted city council and utility board meeting minutes, available on municipal websites. Required to be public record in all U.S. states.',
    what_we_use_it_for: 'Finding references to system upgrades, vendor approvals, budget line items, compliance discussions, and consultant engagements — all in the utility\'s own words.',
    what_it_tells_us: 'What the utility has been actively discussing about infrastructure, billing, compliance, or technology. A utility that recently approved a meter upgrade budget in a council meeting is a high-signal lead.',
    confidence_it_produces: 'high',
    update_frequency: 'Per meeting (typically monthly or bi-monthly)',
  },
  {
    id: 'bond-disclosures',
    name: 'Municipal Bond Disclosures (MSRB EMMA)',
    url: 'https://emma.msrb.org',
    category: 'public_records',
    used_in: ['intelligence'],
    what_it_is: 'The Municipal Securities Rulemaking Board\'s EMMA system — the official public database of all municipal bond filings, continuing disclosures, and financial documents.',
    what_we_use_it_for: 'Understanding a utility\'s capital project pipeline and financial capacity. Utilities that have issued bonds for infrastructure often disclose their technology plans and infrastructure gaps.',
    what_it_tells_us: 'Whether a utility is actively raising capital for infrastructure, what projects they\'re funding, and their overall financial health — important context for timing outreach.',
    confidence_it_produces: 'verified',
    update_frequency: 'Per filing (continuous)',
  },

  // ── RESEARCH ─────────────────────────────────────────────────────
  {
    id: 'web-research',
    name: 'Targeted Web Research (News, Press Releases, RFPs)',
    url: '',
    category: 'research',
    used_in: ['intelligence'],
    what_it_is: 'Structured web searches across utility websites, local news, vendor press releases, and public RFP postings. Conducted programmatically using search APIs against each utility\'s name + PWSID.',
    what_we_use_it_for: 'Filling technology stack gaps not found in procurement data — confirming AMI systems (Sensus, Itron, Neptune), GIS platforms, SCADA systems, and ERP. Also capturing 5-year activity timelines (infrastructure events, leadership changes, major news).',
    what_it_tells_us: 'Which vendors are mentioned in the utility\'s own press releases, local news, and job postings (job postings for "Sensus administrator" are a strong signal). Confidence varies by source quality.',
    confidence_it_produces: 'medium',
    update_frequency: 'Per research cycle (refreshed with each platform build cycle)',
    notes: 'Web research results are tagged Medium (62%) or High (85%) confidence depending on source quality. Direct vendor press releases are High; news mentions alone are Medium. Never tagged Verified unless cross-referenced with procurement.',
  },
  {
    id: 'google-trends',
    name: 'Google Trends (Compliance Topic Signals)',
    url: 'https://trends.google.com',
    category: 'research',
    used_in: ['newsletter'],
    what_it_is: 'Google\'s public tool for surfacing relative search interest over time across topics and geographies.',
    what_we_use_it_for: 'Newsletter content signal — understanding what compliance topics are getting elevated attention nationally. Used to frame the Data Spotlight section with context about what people are actively searching and worried about.',
    what_it_tells_us: 'When national interest in topics like "water main failures", "PFAS compliance", or "lead service line replacement" spikes — useful framing for the newsletter\'s opening.',
    confidence_it_produces: 'medium',
    update_frequency: 'Real-time (updated continuously)',
  },

  // ── COMPANY ──────────────────────────────────────────────────────
  {
    id: 'utility-websites',
    name: 'Municipal & Utility Websites',
    url: '',
    category: 'company',
    used_in: ['intelligence'],
    what_it_is: 'The official websites of each water utility or municipality in the prospect list — typically at city.gov or utilityname.org.',
    what_we_use_it_for: 'Confirming decision maker names and titles; finding department org charts; locating annual reports and CCRs; identifying technology references in staff bios and job postings.',
    what_it_tells_us: 'Org structure, key contacts, and occasionally direct technology references. Job postings for software-specific roles (e.g., "Tyler Munis Financial Analyst") confirm a billing platform with High confidence.',
    confidence_it_produces: 'high',
    update_frequency: 'Per research cycle',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn (Public Profiles)',
    url: 'https://linkedin.com',
    category: 'company',
    used_in: ['intelligence'],
    what_it_is: 'LinkedIn\'s public-facing profile pages for decision makers at target utilities.',
    what_we_use_it_for: 'Verifying decision maker roles, finding direct contact name spellings, understanding career history and tenure (long tenure = relationship-based; short tenure = may be open to change).',
    what_it_tells_us: 'Whether a Director of Public Works has been in role for 2 years vs. 15 years, which affects outreach approach. Also surfaces who recently joined — new leadership is a high-signal window.',
    confidence_it_produces: 'high',
    update_frequency: 'Per research cycle',
    notes: 'Only public profiles referenced. No scraping of private or paywalled data.',
  },

  // ── TOOLS ────────────────────────────────────────────────────────
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    url: 'https://hubspot.com',
    category: 'tool',
    used_in: ['intelligence', 'webinars', 'newsletter'],
    what_it_is: 'Raybern\'s current CRM. Houses existing contacts, deal stages, and activity history.',
    what_we_use_it_for: 'Cross-referencing Intelligence leads against existing HubSpot contacts — so we know who Raybern already knows before reaching out. Webinar invite lists will reference HubSpot contacts. Newsletter subscribers can be seeded from HubSpot.',
    what_it_tells_us: 'Who Raybern has already engaged with. Prevents duplicate outreach and allows warm vs. cold framing in invite messaging.',
    confidence_it_produces: 'verified',
    update_frequency: 'Real-time (when connected)',
    notes: 'Currently on lower HubSpot tier — read access available. Automations/sequences available on upgrade. Connection designed in and ready.',
  },
  {
    id: 'beehiiv',
    name: 'Beehiiv',
    url: 'https://beehiiv.com',
    category: 'tool',
    used_in: ['newsletter'],
    what_it_is: 'Newsletter distribution platform. Handles subscriber management, issue delivery, and analytics (open rate, click rate).',
    what_we_use_it_for: 'Sending the national compliance digest. Will sync with this platform to manage content and scheduling, then deliver via Beehiiv\'s infrastructure.',
    what_it_tells_us: 'Who opens, what they click, who replies. This engagement data feeds back into Intelligence — a newsletter reader who clicked the alignment session CTA is a warm lead.',
    confidence_it_produces: 'verified',
    update_frequency: 'Real-time (when connected)',
    notes: 'Connection designed in and ready. Not yet live — waiting for initial system review.',
  },
]

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  regulatory:     { label: 'Regulatory / Federal',  color: '#991B1B', bg: '#FEF2F2', border: '#FECACA', icon: '🏛' },
  public_records: { label: 'Public Records',         color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', icon: '📋' },
  research:       { label: 'Research',               color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', icon: '🔍' },
  company:        { label: 'Company / Profile',      color: '#4C1D95', bg: '#EDE9FE', border: '#DDD6FE', icon: '🏢' },
  tool:           { label: 'Connected Tool',         color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: '🔌' },
}

const CONFIDENCE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  verified: { label: 'Verified (97%)',  color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  high:     { label: 'High (85%)',      color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  medium:   { label: 'Medium (62%)',    color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  low:      { label: 'Low (35%)',       color: '#6B21A8', bg: '#FAF5FF', border: '#E9D5FF' },
}

const MODULE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  intelligence: { color: '#1E3A5F', bg: '#DBEAFE', border: '#BFDBFE' },
  webinars:     { color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  newsletter:   { color: '#4C1D95', bg: '#EDE9FE', border: '#DDD6FE' },
}

type FilterModule = 'all' | 'intelligence' | 'webinars' | 'newsletter'
type FilterCat = 'all' | 'regulatory' | 'public_records' | 'research' | 'company' | 'tool'

export default function SourcesPage() {
  const [modFilter, setModFilter] = useState<FilterModule>('all')
  const [catFilter, setCatFilter] = useState<FilterCat>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = SOURCES.filter(s => {
    const modOk = modFilter === 'all' || s.used_in.includes(modFilter as any)
    const catOk = catFilter === 'all' || s.category === catFilter
    return modOk && catOk
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Sources & Methodology</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Every data source used across this platform — what it is, what we use it for, and what confidence it produces.
            This page grows as new sources are added.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = SOURCES.filter(s => s.category === key).length
            return (
              <button key={key} onClick={() => setCatFilter(catFilter === key ? 'all' : key as any)}
                className="rounded-xl p-3 border text-left transition-all"
                style={{
                  background: catFilter === key ? meta.bg : 'white',
                  borderColor: catFilter === key ? meta.border : 'var(--border)',
                }}>
                <div className="text-lg">{meta.icon}</div>
                <div className="text-lg font-bold mt-1" style={{ color: 'var(--navy)' }}>{count}</div>
                <div className="text-xs" style={{ color: catFilter === key ? meta.color : 'var(--text-muted)' }}>{meta.label}</div>
              </button>
            )
          })}
        </div>

        {/* Module filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <span className="text-xs font-semibold self-center" style={{ color: 'var(--text-muted)' }}>Used in:</span>
          {(['all', 'intelligence', 'webinars', 'newsletter'] as const).map(m => (
            <button key={m} onClick={() => setModFilter(m)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border transition-all capitalize"
              style={{
                background: modFilter === m ? 'var(--navy)' : 'white',
                color: modFilter === m ? 'white' : 'var(--text-muted)',
                borderColor: modFilter === m ? 'var(--navy)' : 'var(--border)',
              }}>
              {m === 'all' ? 'All modules' : m === 'intelligence' ? '🎯 Intelligence' : m === 'webinars' ? '🎙 Webinars' : '📬 Newsletter'}
            </button>
          ))}
          <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} source{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Source cards */}
        <div className="space-y-3">
          {filtered.map(src => {
            const cat = CATEGORY_META[src.category]
            const conf = CONFIDENCE_META[src.confidence_it_produces]
            const isOpen = expanded === src.id

            return (
              <div key={src.id}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: isOpen ? cat.border : 'var(--border)', background: 'white' }}>

                {/* Header row */}
                <button className="w-full text-left px-5 py-4 flex items-start gap-4"
                  onClick={() => setExpanded(isOpen ? null : src.id)}>
                  <div className="text-xl shrink-0 mt-0.5">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-bold text-sm" style={{ color: 'var(--navy)' }}>{src.name}</span>
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer"
                            className="ml-2 text-xs underline"
                            style={{ color: '#3B82F6' }}
                            onClick={e => e.stopPropagation()}>
                            ↗ Open
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {src.used_in.map(m => {
                          const mc = MODULE_COLORS[m]
                          return (
                            <span key={m} className="text-xs font-semibold px-2 py-0.5 rounded-full border capitalize"
                              style={{ background: mc.bg, color: mc.color, borderColor: mc.border }}>
                              {m}
                            </span>
                          )
                        })}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                          style={{ background: conf.bg, color: conf.color, borderColor: conf.border }}>
                          {conf.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {src.what_we_use_it_for}
                    </p>
                  </div>
                  <span className="text-xs shrink-0 mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">

                      <div className="rounded-lg p-4 border bg-white" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>What It Is</div>
                        <p className="text-sm" style={{ color: 'var(--text-dark)' }}>{src.what_it_is}</p>
                      </div>

                      <div className="rounded-lg p-4 border bg-white" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>What We Use It For</div>
                        <p className="text-sm" style={{ color: 'var(--text-dark)' }}>{src.what_we_use_it_for}</p>
                      </div>

                      <div className="rounded-lg p-4 border bg-white" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>What It Tells Us</div>
                        <p className="text-sm" style={{ color: 'var(--text-dark)' }}>{src.what_it_tells_us}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-3 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span><strong>Category:</strong> {cat.label}</span>
                      <span><strong>Update frequency:</strong> {src.update_frequency}</span>
                      <span><strong>Confidence produced:</strong> {conf.label}</span>
                    </div>

                    {src.notes && (
                      <div className="mt-3 text-xs p-3 rounded-lg border"
                        style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E3A5F' }}>
                        <strong>Note:</strong> {src.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Methodology note */}
        <div className="mt-8 rounded-xl p-5 border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
          <div className="font-bold text-sm mb-2" style={{ color: 'var(--navy)' }}>How Confidence Levels Work</div>
          <div className="grid md:grid-cols-4 gap-3">
            {Object.entries(CONFIDENCE_META).map(([key, meta]) => (
              <div key={key} className="rounded-lg p-3 border text-xs"
                style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}>
                <div className="font-bold mb-1">{meta.label}</div>
                <div style={{ color: meta.color + 'CC' }}>
                  {key === 'verified' ? 'Found in federal database or signed public contract. Treat as fact.' :
                   key === 'high'     ? 'Confirmed via utility\'s own website, press release, or CCR. Very likely accurate.' :
                   key === 'medium'   ? 'Inferred from web research — news, job postings, vendor mentions. Use for targeting, verify before direct reference.' :
                                        'Indirect signal only. Useful for internal scoring, not for outreach messaging.'}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            In outreach messaging, only reference Verified or High confidence data directly. Medium confidence informs <em>who</em> to target and <em>how</em> to frame the conversation — but don't say "we know you're on [Vendor X]" unless it's Verified.
          </p>
        </div>

      </div>
    </div>
  )
}
