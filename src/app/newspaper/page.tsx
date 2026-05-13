'use client'

export default function NewspaperPage() {
  const slides = [
    {
      num: '01',
      label: 'The Problem',
      title: 'Most utilities never hear from consultants until something breaks.',
      body: `The standard consulting playbook is reactive — respond to RFPs, attend conferences, send cold emails. By the time a utility is in active problem-solving mode, the vendor shortlist is already written.

The real opportunity is upstream: building a presence before the pain point hits. That requires showing up in the day-to-day of the utility professional — not as a sales pitch, but as a trusted source of intelligence.`,
      accent: '#C2410C',
      bg: '#FFF7ED',
    },
    {
      num: '02',
      label: 'The Insight',
      title: 'Utility professionals are starved for industry context they can actually use.',
      body: `EPA violation data is public. Regulatory deadlines are public. State-level compliance trends are public. But nobody packages it in a format that's useful to the person sitting at a utility desk.

Industry publications tend to be dry, overly technical, or buried in vendor advertising. There's a real gap for something that feels like a peer resource — informative, honest, and easy to read.`,
      accent: '#4338CA',
      bg: '#EEF2FF',
    },
    {
      num: '03',
      label: 'The Opportunity',
      title: 'FLOW: a physical newspaper that earns a place on the desk.',
      body: `FLOW is a quarterly print newspaper mailed directly to utility offices — 24 to 36 pages of curated compliance intelligence, national violation data, regulatory deadlines, state comparisons, and case studies. Anonymous. Unbiased. Genuinely useful.

The physical format is intentional. It doesn't get buried in an inbox. It lands on the desk, gets picked up, gets passed around. Ten to fifty copies per utility means it circulates — to the director, the operations lead, the board member who walks through.`,
      accent: '#166534',
      bg: '#F0FDF4',
    },
    {
      num: '04',
      label: 'The Approach',
      title: 'Data-driven content. Anonymous framing. Raybern positioned throughout.',
      body: `Each edition is built on publicly available EPA data — violation counts, compliance rates, regulatory deadlines, funding alerts. No specific utilities are named. No cities called out. The analysis surfaces patterns that every utility professional recognizes as real.

Raybern appears throughout the publication: QR codes that link to resources, a case study section (with client approval), and a clear call to action on the back page. The newspaper is a useful industry resource first and a Raybern touchpoint second — that's what makes it work.`,
      accent: '#0369A1',
      bg: '#F0F9FF',
    },
    {
      num: '05',
      label: 'The Model',
      title: 'Quarterly cadence. Long shelf life. Compounding presence.',
      body: `Publishing quarterly for one year builds a body of work that speaks for itself. Each edition reinforces the last. By issue four, FLOW is part of the utility's routine — something they look for, share internally, and associate with Raybern's name.

The distribution model also opens options over time: vendor ad spots for non-competing services, a companion digital version, and cross-promotion with the webinar and newsletter programs already in motion. The newspaper anchors the broader content engine.`,
      accent: '#6D28D9',
      bg: '#F5F3FF',
    },
    {
      num: '06',
      label: 'The Demo',
      title: 'See Edition 1 — built as a client-ready preview.',
      body: `The first edition is designed and ready to view. It demonstrates the visual direction, content structure, games section, and overall tone — blending serious compliance intelligence with something that actually feels worth reading.`,
      accent: '#0F172A',
      bg: '#F8FAFC',
      cta: true,
    },
  ]

  return (
    <div className='min-h-screen' style={{ background: 'var(--bg)' }}>
      <div className='max-w-4xl mx-auto px-6 py-8'>

        {/* Header */}
        <div className='mb-10'>
          <div className='flex items-center gap-2 mb-3'>
            <span className='text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full'
              style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
              Initiative
            </span>
          </div>
          <h1 className='text-2xl font-bold mb-2' style={{ color: 'var(--navy)' }}>
            FLOW: The Municipal Water Intelligence Quarterly
          </h1>
          <p className='text-base' style={{ color: 'var(--text-muted)', maxWidth: '640px', lineHeight: '1.6' }}>
            A physical newspaper mailed directly to utility offices — compliance intelligence, national data, and industry context packaged in a format that earns a place on the desk.
          </p>
        </div>

        {/* Slides */}
        <div className='space-y-4'>
          {slides.map(slide => (
            <div key={slide.num} className='rounded-2xl border overflow-hidden'
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>

              {/* Slide header strip */}
              <div className='px-6 py-4 border-b flex items-center gap-4'
                style={{ borderColor: 'var(--border)', background: slide.bg }}>
                <span className='text-2xl font-black tabular-nums' style={{ color: slide.accent, opacity: 0.3 }}>
                  {slide.num}
                </span>
                <div>
                  <div className='text-xs font-bold uppercase tracking-widest mb-0.5' style={{ color: slide.accent }}>
                    {slide.label}
                  </div>
                  <h2 className='text-base font-bold leading-snug' style={{ color: slide.accent }}>
                    {slide.title}
                  </h2>
                </div>
              </div>

              {/* Body */}
              <div className='px-6 py-5'>
                <p className='text-sm leading-relaxed whitespace-pre-line' style={{ color: 'var(--text-dark)', opacity: 0.85 }}>
                  {slide.body}
                </p>

                {slide.cta && (
                  <div className='mt-5 flex flex-wrap gap-3'>
                    <a
                      href='https://demosite1234567.co/flip'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80'
                      style={{ background: '#0F172A', color: 'white' }}
                    >
                      <span>📄</span>
                      Page Flip Preview
                    </a>
                    <a
                      href='https://demosite1234567.co/scroll'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80'
                      style={{ background: 'var(--bg)', color: 'var(--navy)', border: '1px solid var(--border)' }}
                    >
                      <span>📜</span>
                      Long Scroll View
                    </a>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Bottom context */}
        <div className='mt-8 rounded-2xl border px-6 py-5'
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h3 className='text-sm font-bold mb-3' style={{ color: 'var(--navy)' }}>Publication specs</h3>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {[
              { label: 'Format', value: 'Full-color print' },
              { label: 'Length', value: '24 – 36 pages' },
              { label: 'Cadence', value: 'Quarterly (Year 1)' },
              { label: 'Distribution', value: '10–50 copies / utility' },
            ].map(spec => (
              <div key={spec.label} className='rounded-xl p-3' style={{ background: 'var(--bg)' }}>
                <div className='text-xs mb-1' style={{ color: 'var(--text-muted)' }}>{spec.label}</div>
                <div className='text-sm font-semibold' style={{ color: 'var(--navy)' }}>{spec.value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
