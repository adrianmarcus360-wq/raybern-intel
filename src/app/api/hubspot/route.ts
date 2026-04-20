import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const key = process.env.HUBSPOT_API_KEY
  if (!key) return NextResponse.json({ contacts: [], error: 'No API key' })

  const contacts: any[] = []
  let after: string | null = null

  try {
    // Paginate up to 500 contacts (5 pages of 100)
    for (let page = 0; page < 5; page++) {
      const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts')
      url.searchParams.set('properties', 'email,firstname,lastname,company,hs_object_id')
      url.searchParams.set('limit', '100')
      if (after) url.searchParams.set('after', after)

      const res = await fetch(url.toString(), {
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ contacts, error: err.slice(0, 200) })
      }
      const data = await res.json()
      for (const c of (data.results || [])) {
        contacts.push({
          id: c.id,
          email: c.properties?.email || '',
          first: c.properties?.firstname || '',
          last: c.properties?.lastname || '',
          company: c.properties?.company || '',
          name: ((c.properties?.firstname || '') + ' ' + (c.properties?.lastname || '')).trim(),
        })
      }
      if (data.paging?.next?.after) {
        after = data.paging.next.after
      } else {
        break
      }
    }
    return NextResponse.json({ contacts, total: contacts.length }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' }
    })
  } catch (e: any) {
    return NextResponse.json({ contacts, error: e.message })
  }
}
