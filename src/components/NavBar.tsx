'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',           label: '🎯 Intelligence',  sub: 'Prospects & Outreach' },
  { href: '/webinars',   label: '🎙 Webinars',       sub: 'Events & Pipeline' },
  { href: '/newsletter', label: '📬 Newsletter',     sub: 'Compliance Digest' },
  { href: '/sources',    label: '📚 Sources',        sub: 'Data & Methodology' },
]

export function NavBar() {
  const path = usePathname()

  return (
    <div style={{ background: 'var(--navy)', borderBottom: '1px solid #0D1E30' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Brand row */}
        <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#1B3A5C' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
              style={{ background: '#2B5080' }}>R</div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Raybern Growth Hub</div>
              <div className="text-xs" style={{ color: '#5A8DB5' }}>Intelligence · Webinars · Newsletter</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: '#0D1E30', color: '#5A8DB5', border: '1px solid #1B3A5C' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }}></span>
              HubSpot — ready to connect
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: '#0D1E30', color: '#5A8DB5', border: '1px solid #1B3A5C' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }}></span>
              Beehiiv — ready to connect
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 pt-1">
          {NAV.map(n => {
            const active = n.href === '/' ? path === '/' : path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href}
                className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg transition-colors"
                style={{
                  background: active ? 'var(--bg)' : 'transparent',
                  color: active ? 'var(--navy)' : '#7EA4C4',
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? '2px solid var(--bg)' : '2px solid transparent',
                  marginBottom: active ? '-1px' : undefined,
                }}>
                <span>{n.label}</span>
                {active && <span className="text-xs hidden md:inline" style={{ color: 'var(--text-muted)' }}>/ {n.sub}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
