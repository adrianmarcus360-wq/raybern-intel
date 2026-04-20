'use client'
import { useState } from 'react'
import leadsRaw from '@/data/leads_v4.json'

// Types
type PStatus = 'to_invite'|'invited'|'confirmed'|'declined'
type IStatus = 'not_invited'|'linkedin_invited'|'email_invited'|'registered'|'attended'|'no_show'
interface Panelist { id:string; name:string; title:string; company:string; linkedin:string; bio:string; notes:string; status:PStatus }
interface PanelCfg { topic:string; date:string; host_name:string; host_title:string; platform:'riverside'|'zoom'|''; goal_outcome:string; linkedin_event_url:string; registration_link:string; capacity:string }

const LEADS = (leadsRaw as any[]).map((l:any) => ({
  pwsid: l.pwsid, name: l.name, city: l.city, state: l.state,
  population: l.population, admin_name: l.admin_name, email: l.email,
  score: (l.lead_score_raw||0)+(l.score_boost||0),
  tier: l.tier?.key||'Tier 3',
  billing: l.tech_intel?.billing?.system||null,
})).sort((a:any,b:any)=>b.score-a.score)

const TC: Record<string,{bg:string;text:string;border:string}> = {
  'Tier 1':{bg:'#FEF2F2',text:'#991B1B',border:'#FECACA'},
  'Tier 2':{bg:'#FFF7ED',text:'#92400E',border:'#FED7AA'},
  'Tier 3':{bg:'#F0FDF4',text:'#14532D',border:'#BBF7D0'},
  'Watch': {bg:'#EFF6FF',text:'#1E3A5F',border:'#BFDBFE'},
}

function pMsg(p:Panelist,topic:string,host:string,date:string):string {
  if(!topic) return '[Set panel topic first]'
  const ds = date ? 'on '+new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'in Q2 2026'
  const lines = ['Hi '+p.name.split(' ')[0]+',','','I am '+(host||'[Host]')+' at Raybern Consulting. We work with water utilities on billing compliance -- organizing a panel '+ds+' on: '+topic+'.','','Given your background'+(p.company?' at '+p.company:'')+', you would bring a valuable perspective. Honest, practitioner-level discussion -- no sales pitch.','','Format: 4-5 panelists, ~45 min, recorded.','','Open to a 15-min call?','','-- '+(host||'[Host]')]
  return lines.join('\n')
}

function lMsg(lead:any,topic:string,url:string):string {
  if(!topic) return '[Set panel topic first in Panel Builder]'
  const lines = ['Hi '+(lead.admin_name?.split(' ')[0]||'there')+',','','Raybern Consulting is hosting a panel discussion on: '+topic+' -- a practitioner conversation for water utility leaders.','','Given '+lead.name+' compliance profile, I thought this might be worth an hour.','','RSVP here: '+(url||'[LinkedIn Event link -- set in Panel Builder]'),'','Happy to answer any questions.']
  return lines.join('\n')
}
const PM = {
  to_invite:{c:'#6B7280',bg:'#F9FAFB',border:'#E5E7EB'},
  invited:  {c:'#1E40AF',bg:'#EFF6FF',border:'#BFDBFE'},
  confirmed:{c:'#065F46',bg:'#ECFDF5',border:'#A7F3D0'},
  declined: {c:'#991B1B',bg:'#FEF2F2',border:'#FECACA'},
} as const
const SM = {
  not_invited:     {label:'Not invited',    c:'#6B7280',bg:'#F9FAFB'},
  linkedin_invited:{label:'LinkedIn invited',c:'#1E40AF',bg:'#EFF6FF'},
  email_invited:   {label:'Email invited',  c:'#92400E',bg:'#FFFBEB'},
  registered:      {label:'Registered',     c:'#065F46',bg:'#ECFDF5'},
  attended:        {label:'Attended',       c:'#14532D',bg:'#F0FDF4'},
  no_show:         {label:'No-show',        c:'#991B1B',bg:'#FEF2F2'},
} as const

export default function WebinarsPage() {
  const [tab,setTab]=useState<'builder'|'invites'|'assets'|'tools'>('builder')
  const [cfg,setCfg]=useState<PanelCfg>({topic:'',date:'',host_name:'',host_title:'',platform:'',goal_outcome:'',linkedin_event_url:'',registration_link:'',capacity:''})
  const [panelists,setPanelists]=useState<Panelist[]>([])
  const [addingP,setAddingP]=useState(false)
  const [newP,setNewP]=useState({name:'',title:'',company:'',linkedin:'',bio:'',notes:''})
  const [expandedP,setExpandedP]=useState<string|null>(null)
  const [copied,setCopied]=useState<string|null>(null)
  const [invSt,setInvSt]=useState<Record<string,IStatus>>({})
  const [tierF,setTierF]=useState('all')
  const [srch,setSrch]=useState('')

  const upd=(k:keyof PanelCfg,v:string)=>setCfg(p=>({...p,[k]:v}))
  const cp=(text:string,key:string)=>{navigator.clipboard.writeText(text).catch(()=>{});setCopied(key);setTimeout(()=>setCopied(null),2000)}
  const addPanelist=()=>{if(!newP.name)return;setPanelists(p=>[...p,{...newP,id:Date.now().toString(),status:'to_invite'}]);setNewP({name:'',title:'',company:'',linkedin:'',bio:'',notes:''});setAddingP(false)}
  const confirmed=panelists.filter(p=>p.status==='confirmed').length
  const invited=Object.values(invSt).filter(s=>s!=='not_invited').length
  const ready=!!(cfg.topic&&cfg.date&&cfg.host_name&&cfg.platform&&cfg.goal_outcome)
  const filtLeads=LEADS.filter((l:any)=>{
    const t=tierF==='all'||l.tier===tierF
    const s=!srch||l.name.toLowerCase().includes(srch.toLowerCase())||(l.admin_name||'').toLowerCase().includes(srch.toLowerCase())||l.city.toLowerCase().includes(srch.toLowerCase())
    return t&&s
  })

  return (
    <div className='min-h-screen' style={{background:'var(--bg)'}}>
      <div className='max-w-6xl mx-auto px-6 py-6'>
        <div className='mb-5 flex items-start justify-between flex-wrap gap-3'>
          <div>
            <h1 className='text-xl font-bold' style={{color:'var(--navy)'}}>Panel Discussion Builder</h1>
            <p className='text-sm mt-0.5' style={{color:'var(--text-muted)'}}>Build and run your quarterly panel — topic, panelists, invites, assets, follow-up.</p>
          </div>
          <div className='flex gap-2 flex-wrap'>
            {[
              {label:ready?'✓ Panel configured':'○ Setup incomplete',ok:ready},
              {label:confirmed+'/'+panelists.length+' confirmed',ok:confirmed>0},
              {label:invited+' leads invited',ok:invited>0},
            ].map((p,i)=>(
              <span key={i} className='text-xs font-semibold px-2.5 py-1 rounded-full border'
                style={p.ok?{background:'#ECFDF5',color:'#065F46',borderColor:'#A7F3D0'}:{background:'#F9FAFB',color:'#6B7280',borderColor:'#E5E7EB'}}>
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className='flex gap-1 mb-6 border-b' style={{borderColor:'var(--border)'}}>
          {[
            {k:'builder',label:'🎙 Panel Builder',   sub:'Setup & Panelists'},
            {k:'invites',label:'👥 Invite Strategy', sub:LEADS.length+' leads'},
            {k:'assets', label:'📋 Campaign Assets', sub:'Content & Phases'},
            {k:'tools',  label:'🔧 Tools & Setup',   sub:'What to configure'},
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k as any)}
              className='px-4 py-2.5 text-sm font-medium whitespace-nowrap'
              style={{color:tab===t.k?'var(--navy)':'var(--text-muted)',borderBottom:tab===t.k?'2px solid var(--navy)':'2px solid transparent',marginBottom:'-1px'}}>
              {t.label}
              <span className='text-xs ml-1.5 hidden md:inline' style={{color:'var(--text-light)'}}>/ {t.sub}</span>
            </button>
          ))}
        </div>

        {tab==='builder' && <BuilderTab cfg={cfg} upd={upd} panelists={panelists} setPanelists={setPanelists} addingP={addingP} setAddingP={setAddingP} newP={newP} setNewP={setNewP} addPanelist={addPanelist} expandedP={expandedP} setExpandedP={setExpandedP} copied={copied} cp={cp} confirmed={confirmed} invited={invited} ready={ready} PM={PM} />}
        {tab==='invites' && <InvitesTab cfg={cfg} invSt={invSt} setInvSt={setInvSt} tierF={tierF} setTierF={setTierF} srch={srch} setSrch={setSrch} filtLeads={filtLeads} copied={copied} cp={cp} SM={SM} />}
        {tab==='assets' && <CampaignAssetsView topic={cfg.topic} />}
        {tab==='tools' && <ToolsSetupView />}
      </div>
    </div>
  )
}

// ── BUILDER TAB ──────────────────────────────────────────────────────────────
function BuilderTab({cfg,upd,panelists,setPanelists,addingP,setAddingP,newP,setNewP,addPanelist,expandedP,setExpandedP,copied,cp,confirmed,invited,ready,PM}:any) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
      <div className='lg:col-span-2 space-y-4'>
        <div className='detail-card'>
          <div className='font-bold text-sm mb-4 flex items-center gap-2' style={{color:'var(--navy)'}}>
            📋 Panel Configuration
            {ready && <span className='text-xs px-2 py-0.5 rounded-full font-semibold' style={{background:'#ECFDF5',color:'#065F46'}}>Complete</span>}
          </div>
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>PANEL TOPIC *</label>
              <input type='text' value={cfg.topic} onChange={(e:any)=>upd('topic',e.target.value)}
                placeholder='e.g. What your compliance data is actually telling you'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:cfg.topic?'#A7F3D0':'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>EVENT DATE *</label>
              <input type='date' value={cfg.date} onChange={(e:any)=>upd('date',e.target.value)}
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:cfg.date?'#A7F3D0':'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>CAPACITY</label>
              <input type='text' value={cfg.capacity} onChange={(e:any)=>upd('capacity',e.target.value)}
                placeholder='e.g. 50 attendees max'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>HOST NAME *</label>
              <input type='text' value={cfg.host_name} onChange={(e:any)=>upd('host_name',e.target.value)}
                placeholder='e.g. Adrian Marcus'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:cfg.host_name?'#A7F3D0':'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>HOST TITLE</label>
              <input type='text' value={cfg.host_title} onChange={(e:any)=>upd('host_title',e.target.value)}
                placeholder='e.g. Founder, Raybern Consulting'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-xs font-semibold mb-2' style={{color:'var(--text-muted)'}}>HOSTING PLATFORM *</label>
              <div className='grid grid-cols-2 gap-3'>
                {[
                  {k:'riverside',icon:'🎙',name:'Riverside.fm',tag:'Recommended',tc:'#065F46',tb:'#ECFDF5',detail:'Local recording per speaker = broadcast quality on any connection. AI clips + transcript. $19/mo.'},
                  {k:'zoom',icon:'🎥',name:'Zoom Webinar',tag:'Alternative',tc:'#1E40AF',tb:'#EFF6FF',detail:'Best for 200+ audiences. Everyone has it. Recording quality depends on internet.'},
                ].map(p=>(
                  <button key={p.k} onClick={()=>upd('platform',p.k)}
                    className='text-left p-3 rounded-xl border-2 transition-all'
                    style={{borderColor:cfg.platform===p.k?(p.k==='riverside'?'#A7F3D0':'#BFDBFE'):'var(--border)',background:cfg.platform===p.k?(p.k==='riverside'?'#ECFDF5':'#EFF6FF'):'white'}}>
                    <div className='flex items-center gap-2 mb-1'>
                      <span>{p.icon}</span>
                      <span className='font-bold text-sm' style={{color:'var(--navy)'}}>{p.name}</span>
                      <span className='text-xs font-semibold px-1.5 py-0.5 rounded-full ml-auto' style={{background:p.tb,color:p.tc}}>{p.tag}</span>
                    </div>
                    <p className='text-xs' style={{color:'var(--text-muted)'}}>{p.detail}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>LINKEDIN EVENT URL</label>
              <input type='url' value={cfg.linkedin_event_url} onChange={(e:any)=>upd('linkedin_event_url',e.target.value)}
                placeholder='https://linkedin.com/events/...'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:cfg.linkedin_event_url?'#A7F3D0':'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
              {!cfg.linkedin_event_url && <a href='https://www.linkedin.com/events/create' target='_blank' rel='noopener noreferrer' className='text-xs mt-1 inline-block underline' style={{color:'#3B82F6'}}>Create LinkedIn Event →</a>}
            </div>
            <div>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>SESSION LINK</label>
              <input type='url' value={cfg.registration_link} onChange={(e:any)=>upd('registration_link',e.target.value)}
                placeholder='Riverside or Zoom meeting link'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none'
                style={{borderColor:'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-xs font-semibold mb-1.5' style={{color:'var(--text-muted)'}}>AGREED-UPON GOAL / OUTCOME *</label>
              <textarea value={cfg.goal_outcome} onChange={(e:any)=>upd('goal_outcome',e.target.value)}
                rows={3} placeholder='e.g. Generate 3-5 alignment session conversations; establish thought leadership; produce 4 LinkedIn clips + 1 newsletter recap'
                className='w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none'
                style={{borderColor:cfg.goal_outcome?'#A7F3D0':'var(--border)',background:'var(--bg)',color:'var(--text-dark)'}} />
            </div>
          </div>
        </div>

        <div className='detail-card'>
          <div className='flex items-center justify-between mb-4'>
            <div className='font-bold text-sm' style={{color:'var(--navy)'}}>
              👤 Panelists
              <span className='ml-2 text-xs font-normal' style={{color:'var(--text-muted)'}}>{panelists.length} added · {confirmed} confirmed</span>
            </div>
            <button onClick={()=>setAddingP(true)} className='text-xs font-semibold px-3 py-1.5 rounded-lg text-white' style={{background:'var(--navy)'}}>+ Add Panelist</button>
          </div>
          {addingP && (
            <div className='mb-4 p-4 rounded-xl border-2' style={{borderColor:'#BFDBFE',background:'#EFF6FF'}}>
              <div className='font-semibold text-sm mb-3' style={{color:'var(--navy)'}}>New Panelist</div>
              <div className='grid grid-cols-2 gap-3'>
                {[{k:'name',l:'Full Name *',ph:'Dr. Jane Smith'},{k:'title',l:'Title',ph:'Director of Public Works'},{k:'company',l:'Company',ph:'Springfield Water Authority'},{k:'linkedin',l:'LinkedIn URL',ph:'https://linkedin.com/in/...'}].map(f=>(
                  <div key={f.k}>
                    <label className='block text-xs font-semibold mb-1' style={{color:'var(--text-muted)'}}>{f.l}</label>
                    <input type='text' value={(newP as any)[f.k]} onChange={(e:any)=>setNewP((p:any)=>({...p,[f.k]:e.target.value}))}
                      placeholder={f.ph} className='w-full text-sm px-3 py-2 rounded-lg border outline-none bg-white' style={{borderColor:'var(--border)',color:'var(--text-dark)'}} />
                  </div>
                ))}
                <div className='col-span-2'>
                  <label className='block text-xs font-semibold mb-1' style={{color:'var(--text-muted)'}}>Bio / Why on This Panel</label>
                  <textarea value={newP.bio} onChange={(e:any)=>setNewP((p:any)=>({...p,bio:e.target.value}))}
                    rows={2} placeholder='e.g. 15 years in municipal water compliance...'
                    className='w-full text-sm px-3 py-2 rounded-lg border outline-none bg-white resize-none' style={{borderColor:'var(--border)',color:'var(--text-dark)'}} />
                </div>
              </div>
              <div className='flex gap-2 mt-3'>
                <button onClick={addPanelist} className='text-sm px-4 py-2 rounded-lg font-semibold text-white' style={{background:'var(--navy)'}}>Add to Panel</button>
                <button onClick={()=>setAddingP(false)} className='text-sm px-4 py-2 rounded-lg font-semibold border' style={{borderColor:'var(--border)',color:'var(--text-muted)'}}>Cancel</button>
              </div>
            </div>
          )}
          {panelists.length===0&&!addingP ? (
            <div className='text-center py-8 text-sm' style={{color:'var(--text-muted)'}}>No panelists yet. Who is joining you?</div>
          ) : (
            <div className='space-y-3'>
              {panelists.map((p:any)=>{
                const m=PM[p.status as keyof typeof PM]
                const msg=pMsg(p,cfg.topic,cfg.host_name,cfg.date)
                const isExp=expandedP===p.id
                return (
                  <div key={p.id} className='rounded-xl border overflow-hidden' style={{borderColor:m.border,background:'white'}}>
                    <div className='px-4 py-3 flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0' style={{background:m.bg,color:m.c}}>{p.name[0]}</div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-semibold text-sm' style={{color:'var(--navy)'}}>{p.name}</div>
                        <div className='text-xs' style={{color:'var(--text-muted)'}}>{p.title}{p.company?' · '+p.company:''}</div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <select value={p.status} onChange={(e:any)=>setPanelists((ps:any[])=>ps.map(x=>x.id===p.id?{...x,status:e.target.value}:x))}
                          className='text-xs font-semibold px-2 py-1 rounded-full border outline-none'
                          style={{background:m.bg,color:m.c,borderColor:m.border}}>
                          <option value='to_invite'>To invite</option>
                          <option value='invited'>Invited</option>
                          <option value='confirmed'>Confirmed</option>
                          <option value='declined'>Declined</option>
                        </select>
                        <button onClick={()=>setExpandedP(isExp?null:p.id)} className='text-xs px-2 py-1 rounded border' style={{borderColor:'var(--border)',color:'var(--text-muted)'}}>{isExp?'▲':'Outreach ▼'}</button>
                        <button onClick={()=>setPanelists((ps:any[])=>ps.filter(x=>x.id!==p.id))} className='text-xs px-2 py-1 rounded' style={{color:'#EF4444'}}>×</button>
                      </div>
                    </div>
                    {isExp && (
                      <div className='px-4 pb-4 border-t' style={{borderColor:'var(--border)',background:'var(--bg)'}}>
                        {p.linkedin && <a href={p.linkedin} target='_blank' rel='noopener noreferrer' className='inline-block mt-2 mb-2 text-xs underline' style={{color:'#3B82F6'}}>View LinkedIn →</a>}
                        <div className='text-xs font-bold uppercase tracking-wide mb-2 mt-2' style={{color:'var(--text-muted)'}}>Outreach Message</div>
                        <pre className='text-xs p-3 rounded-lg border whitespace-pre-wrap font-sans' style={{background:'white',borderColor:'var(--border)',color:'var(--text-dark)',lineHeight:'1.6'}}>{msg}</pre>
                        <button onClick={()=>cp(msg,'p-'+p.id)} className='mt-2 text-xs px-3 py-1.5 rounded-lg border font-semibold'
                          style={{background:copied==='p-'+p.id?'#ECFDF5':'white',borderColor:copied==='p-'+p.id?'#A7F3D0':'var(--border)',color:copied==='p-'+p.id?'#065F46':'var(--navy)'}}>
                          {copied==='p-'+p.id?'✓ Copied':'↗ Copy message'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className='space-y-4'>
        <div className='detail-card'>
          <div className='font-bold text-sm mb-3' style={{color:'var(--navy)'}}>✅ Readiness Checklist</div>
          <div className='space-y-2'>
            {[
              {l:'Panel topic set',d:!!cfg.topic},
              {l:'Event date confirmed',d:!!cfg.date},
              {l:'Host identified',d:!!cfg.host_name},
              {l:'Platform chosen',d:!!cfg.platform},
              {l:'Goal outcome written',d:!!cfg.goal_outcome},
              {l:'LinkedIn Event created',d:!!cfg.linkedin_event_url},
              {l:'2+ panelists added',d:panelists.length>=2},
              {l:'1+ panelist confirmed',d:confirmed>=1},
              {l:'Session link set',d:!!cfg.registration_link},
              {l:'5+ leads invited',d:invited>=5},
            ].map((item,i)=>(
              <div key={i} className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0'
                  style={{borderColor:item.d?'#22C55E':'#E5E7EB',background:item.d?'#22C55E':'transparent'}}>
                  {item.d && <span className='text-white' style={{fontSize:9}}>✓</span>}
                </div>
                <span className='text-xs' style={{color:item.d?'var(--text-dark)':'var(--text-muted)'}}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className='detail-card'>
          <div className='font-bold text-sm mb-2' style={{color:'var(--navy)'}}>🎙 Platform Pick</div>
          <div className='rounded-lg p-3 mb-3' style={{background:'#ECFDF5',border:'1px solid #A7F3D0'}}>
            <div className='font-semibold text-sm mb-1' style={{color:'#065F46'}}>Use Riverside.fm</div>
            <div className='text-xs' style={{color:'#065F46'}}>Local recording per speaker = broadcast quality on any internet. AI clips get you 4 LinkedIn posts from one session. $19/mo Starter.</div>
          </div>
          <div className='text-xs' style={{color:'var(--text-muted)'}}><strong>Use Zoom when:</strong> Audience is 200+ or attendees refuse non-Zoom.</div>
        </div>
        <div className='detail-card'>
          <div className='font-bold text-sm mb-3' style={{color:'var(--navy)'}}>💼 LinkedIn Event Setup</div>
          <ol className='space-y-2'>
            {['Go to linkedin.com/events/create','Host: Raybern Consulting company page','Name: panel topic verbatim','Date + Riverside/Zoom session link','Description: panelists, topic, goal (no pitch)','Publish → copy URL → paste in Panel Builder','Invite leads from Invite Strategy tab'].map((s,i)=>(
              <li key={i} className='flex gap-2 text-xs' style={{color:'var(--text-muted)'}}>
                <span className='shrink-0 w-4 h-4 rounded-full text-white font-bold flex items-center justify-center' style={{background:'var(--navy)',fontSize:9}}>{i+1}</span>
                {s}
              </li>
            ))}
          </ol>
          <a href='https://www.linkedin.com/events/create' target='_blank' rel='noopener noreferrer'
            className='mt-3 block text-center text-xs font-semibold px-3 py-2 rounded-lg border'
            style={{borderColor:'#BFDBFE',background:'#EFF6FF',color:'#1E40AF'}}>
            Create LinkedIn Event →
          </a>
        </div>
      </div>
    </div>
  )
}

// ── INVITES TAB ───────────────────────────────────────────────────────────────
function useHubspotMatches(leads:any[]) {
  const [hsContacts,setHsContacts]=useState<any[]>([])
  const [hsState,setHsState]=useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [hsCount,setHsCount]=useState(0)

  const load=()=>{
    setHsState('loading')
    fetch('/api/hubspot').then(r=>r.json()).then(d=>{
      setHsContacts(d.contacts||[])
      setHsCount(d.total||0)
      setHsState(d.error&&!d.contacts?.length?'error':'ok')
    }).catch(()=>setHsState('error'))
  }

  const matchMap=new Map<string,any>()
  for(const lead of leads) {
    const lemail=(lead.email||'').toLowerCase()
    const lname=(lead.admin_name||'').toLowerCase().trim()
    const lco=(lead.name||'').toLowerCase().trim()
    for(const c of hsContacts) {
      const cemail=(c.email||'').toLowerCase()
      const cname=(c.name||'').toLowerCase().trim()
      const cco=(c.company||'').toLowerCase().trim()
      const emailMatch=lemail&&cemail&&lemail===cemail
      const nameMatch=lname&&cname&&lname.split(' ').some((p:string)=>cname.includes(p)&&p.length>2)
      const coMatch=lco&&cco&&cco.length>3&&(lco.includes(cco)||cco.includes(lco.split(' ')[0]))
      if(emailMatch||nameMatch||coMatch) {
        matchMap.set(lead.pwsid,{email:emailMatch,name:nameMatch,company:coMatch,contact:c})
        break
      }
    }
  }
  return {hsState,hsCount,matchMap,load}
}

function InvitesTab({cfg,invSt,setInvSt,tierF,setTierF,srch,setSrch,filtLeads,copied,cp,SM}:any) {
  const invitedCount=Object.values(invSt).filter((s:any)=>s!=='not_invited').length
  const allLeads=LEADS
  const {hsState,hsCount,matchMap,load}=useHubspotMatches(allLeads)
  const hsMatched=[...matchMap.keys()].length
  return (
    <div>
      <div className='mb-3 flex items-center gap-3 flex-wrap'>
        <div className='flex items-center gap-2 px-3 py-2 rounded-lg border' style={{background:'#F9FAFB',borderColor:'var(--border)'}}>
          <div className='w-2 h-2 rounded-full' style={{background:hsState==='ok'?'#22C55E':hsState==='error'?'#EF4444':'#9CA3AF'}} />
          <span className='text-xs font-semibold' style={{color:'var(--navy)'}}>HubSpot CRM</span>
          {hsState==='idle'&&<button onClick={load} className='text-xs underline' style={{color:'#3B82F6'}}>Load contacts →</button>}
          {hsState==='loading'&&<span className='text-xs' style={{color:'var(--text-muted)'}}>Loading...</span>}
          {hsState==='ok'&&<span className='text-xs' style={{color:'var(--text-muted)'}}>{hsCount} contacts · {hsMatched} matched</span>}
          {hsState==='error'&&<span className='text-xs' style={{color:'#EF4444'}}>Connection error</span>}
          {(hsState==='ok'||hsState==='error')&&<button onClick={load} className='text-xs underline ml-1' style={{color:'#9CA3AF'}}>↺</button>}
        </div>
        {hsState==='ok'&&hsMatched>0&&(
          <span className='text-xs font-semibold px-2.5 py-1 rounded-full border' style={{background:'#ECFDF5',color:'#065F46',borderColor:'#A7F3D0'}}>
            {hsMatched} leads already in CRM — warm outreach opportunity
          </span>
        )}
      </div>
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        {[
          {l:'Total leads',v:LEADS.length,bg:'#F9FAFB',c:'var(--navy)'},
          {l:'Not invited',v:LEADS.filter((l:any)=>!invSt[l.pwsid]||invSt[l.pwsid]==='not_invited').length,bg:'#F9FAFB',c:'#6B7280'},
          {l:'Invited',v:Object.values(invSt).filter((s:any)=>s==='linkedin_invited'||s==='email_invited').length,bg:'#EFF6FF',c:'#1E40AF'},
          {l:'Registered',v:Object.values(invSt).filter((s:any)=>s==='registered').length,bg:'#ECFDF5',c:'#065F46'},
          {l:'Attended',v:Object.values(invSt).filter((s:any)=>s==='attended').length,bg:'#F0FDF4',c:'#14532D'},
        ].map(s=>(
          <div key={s.l} className='rounded-xl p-3 border' style={{background:s.bg,borderColor:'var(--border)'}}>
            <div className='text-2xl font-bold' style={{color:s.c}}>{s.v}</div>
            <div className='text-xs' style={{color:'var(--text-muted)'}}>{s.l}</div>
          </div>
        ))}
      </div>
      {!cfg.linkedin_event_url && (
        <div className='mb-4 p-4 rounded-xl border' style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>
          <div className='font-semibold text-sm' style={{color:'#92400E'}}>⚠ LinkedIn Event URL not set</div>
          <p className='text-xs mt-0.5' style={{color:'#92400E'}}>Set it in Panel Builder — invite messages will include the RSVP link automatically.</p>
        </div>
      )}
      <div className='flex gap-3 mb-4 flex-wrap items-center'>
        <div className='flex gap-1 flex-wrap'>
          {['all','Tier 1','Tier 2','Tier 3','Watch'].map(t=>{
            const tc=t!=='all'?TC[t]:null
            return (
              <button key={t} onClick={()=>setTierF(t)}
                className='text-xs px-3 py-1.5 rounded-full font-semibold border transition-all'
                style={{background:tierF===t?(tc?.bg||'var(--navy)'):'white',color:tierF===t?(tc?.text||'white'):'var(--text-muted)',borderColor:tierF===t?(tc?.border||'var(--navy)'):'var(--border)'}}>
                {t==='all'?'All':t}{t!=='all'&&<span className='ml-1'>{LEADS.filter((l:any)=>l.tier===t).length}</span>}
              </button>
            )
          })}
        </div>
        <input type='text' value={srch} onChange={(e:any)=>setSrch(e.target.value)} placeholder='Search utility or contact...'
          className='text-sm px-3 py-1.5 rounded-lg border outline-none ml-auto'
          style={{borderColor:'var(--border)',background:'white',color:'var(--text-dark)'}} />
      </div>
      <div className='rounded-xl border overflow-hidden' style={{borderColor:'var(--border)'}}>
        <table className='w-full'>
          <thead>
            <tr className='text-left border-b' style={{borderColor:'var(--border)',background:'#F9FAFB'}}>
              <th className='px-4 py-2.5 text-xs font-semibold' style={{color:'var(--text-muted)'}}>Utility</th>
              <th className='px-4 py-2.5 text-xs font-semibold hidden md:table-cell' style={{color:'var(--text-muted)'}}>Contact</th>
              <th className='px-4 py-2.5 text-xs font-semibold hidden xl:table-cell' style={{color:'var(--text-muted)'}}>CRM</th>
              <th className='px-4 py-2.5 text-xs font-semibold hidden lg:table-cell' style={{color:'var(--text-muted)'}}>Tier</th>
              <th className='px-4 py-2.5 text-xs font-semibold hidden lg:table-cell' style={{color:'var(--text-muted)'}}>Billing</th>
              <th className='px-4 py-2.5 text-xs font-semibold' style={{color:'var(--text-muted)'}}>Status</th>
              <th className='px-4 py-2.5 text-xs font-semibold' style={{color:'var(--text-muted)'}}>Invite</th>
            </tr>
          </thead>
          <tbody>
            {filtLeads.map((lead:any,i:number)=>{
              const st=(invSt[lead.pwsid]||'not_invited') as keyof typeof SM
              const sm=SM[st]
              const tc=TC[lead.tier]||TC['Tier 3']
              const msg=lMsg(lead,cfg.topic,cfg.linkedin_event_url)
              const hsMatch=matchMap.get(lead.pwsid)
              return (
                <tr key={lead.pwsid} className='border-b' style={{borderColor:'var(--border)',background:i%2===0?'white':'#FAFAFA'}}>
                  <td className='px-4 py-3'>
                    <div className='font-semibold text-sm' style={{color:'var(--navy)'}}>{lead.name}</div>
                    <div className='text-xs' style={{color:'var(--text-muted)'}}>{lead.city}, {lead.state} · {lead.population.toLocaleString()} pop</div>
                  </td>
                  <td className='px-4 py-3 hidden md:table-cell'>
                    <div className='text-sm' style={{color:'var(--text-dark)'}}>{lead.admin_name||'—'}</div>
                    {lead.email && <div className='text-xs' style={{color:'#3B82F6'}}>{lead.email}</div>}
                  </td>
                  <td className='px-4 py-3 hidden xl:table-cell'>
                    {hsMatch ? (
                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full border' style={{background:'#ECFDF5',color:'#065F46',borderColor:'#A7F3D0'}} title={'Match: '+(hsMatch.email?'email ':'')+( hsMatch.name?'name ':'')+( hsMatch.company?'company':'')}>
                        ✓ In CRM
                      </span>
                    ) : hsState==='ok' ? (
                      <span className='text-xs' style={{color:'#D1D5DB'}}>—</span>
                    ) : null}
                  </td>
                  <td className='px-4 py-3 hidden lg:table-cell'>
                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full border' style={{background:tc.bg,color:tc.text,borderColor:tc.border}}>{lead.tier}</span>
                  </td>
                  <td className='px-4 py-3 hidden lg:table-cell'>
                    <span className='text-xs' style={{color:'var(--text-muted)'}}>{lead.billing||'—'}</span>
                  </td>
                  <td className='px-4 py-3'>
                    <select value={st} onChange={(e:any)=>setInvSt((p:any)=>({...p,[lead.pwsid]:e.target.value}))}
                      className='text-xs font-semibold px-2 py-1 rounded-full border outline-none'
                      style={{background:sm.bg,color:sm.c}}>
                      <option value='not_invited'>Not invited</option>
                      <option value='linkedin_invited'>LinkedIn invited</option>
                      <option value='email_invited'>Email invited</option>
                      <option value='registered'>Registered</option>
                      <option value='attended'>Attended</option>
                      <option value='no_show'>No-show</option>
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <button onClick={()=>cp(msg,'l-'+lead.pwsid)}
                      className='text-xs px-2.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap'
                      style={{background:copied==='l-'+lead.pwsid?'#ECFDF5':'white',borderColor:copied==='l-'+lead.pwsid?'#A7F3D0':'var(--border)',color:copied==='l-'+lead.pwsid?'#065F46':'var(--navy)'}}>
                      {copied==='l-'+lead.pwsid?'✓ Copied':'↗ Copy invite'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className='text-xs mt-2 text-center' style={{color:'var(--text-muted)'}}>Invite messages auto-populate with panel topic + LinkedIn Event URL from Panel Builder.</p>
    </div>
  )
}

// ── CAMPAIGN ASSETS ───────────────────────────────────────────────────────────
function CampaignAssetsView({topic}:{topic:string}) {
  const [done,setDone]=useState<Record<string,boolean>>({})
  const toggle=(k:string)=>setDone(p=>({...p,[k]:!p[k]}))
  const PHASES=[
    {name:'Content & Positioning',weeks:'8-6 weeks out',icon:'📐',items:[
      {k:'topic_locked',l:'Panel topic finalized and locked',r:'Raybern team'},
      {k:'panelists_ok',l:'All panelists confirmed (outreach + replies)',r:'Raybern team'},
      {k:'angle_doc',l:'Positioning doc: who it is for, what they get, no-pitch promise',r:'Raybern team'},
      {k:'li_event',l:'LinkedIn Event published with description + panelist names',r:'Raybern team'},
      {k:'landing',l:'Registration landing copy written',r:'Raybern team'},
    ]},
    {name:'Invitations & LinkedIn',weeks:'6-4 weeks out',icon:'✉️',items:[
      {k:'tier1',l:'All 21 Tier 1 leads invited via LinkedIn Event',r:'Manual (Invite Strategy tab)'},
      {k:'tier2',l:'Select Tier 2 leads invited (warm outreach)',r:'Manual (Invite Strategy tab)'},
      {k:'hs_invites',l:'Existing HubSpot contacts invited via email',r:'Raybern team'},
      {k:'li_post_1',l:'LinkedIn post 1: Announcing the panel + why it matters',r:'Raybern team'},
      {k:'p_shares',l:'Panelists share the LinkedIn Event to their networks',r:'Each panelist'},
    ]},
    {name:'Final Prep & Promotion',weeks:'3-1 weeks out',icon:'🚀',items:[
      {k:'li_post_2',l:'LinkedIn post 2: Spotlight one panelist (quote or insight)',r:'Raybern team'},
      {k:'li_post_3',l:'LinkedIn post 3: Countdown / seats reminder (48hrs out)',r:'Raybern team'},
      {k:'reminder',l:'Reminder email to all registered attendees (24hrs out)',r:'Raybern team'},
      {k:'tech_test',l:'Tech run-through with all panelists',r:'Raybern + panelists'},
      {k:'deck',l:'Opening/agenda slide ready (2 slides max)',r:'Raybern team'},
    ]},
    {name:'Event Day',weeks:'Day of',icon:'🎙',items:[
      {k:'green_room',l:'15-min green room: brief panelists on format and goal',r:'Host'},
      {k:'rec_on',l:'Recording started before attendees join',r:'Host'},
      {k:'intro',l:'Host intro: context, panelists, format, no-pitch promise',r:'Host'},
      {k:'cta',l:'Soft close: alignment session mention (non-pushy)',r:'Host'},
      {k:'rec_saved',l:'Recording saved and confirmed',r:'Host'},
    ]},
    {name:'Follow-Up & Convert',weeks:'0-7 days after',icon:'🔄',items:[
      {k:'fu_1',l:'Follow-up Day 1: thank you + recording link',r:'Raybern team'},
      {k:'fu_2',l:'Follow-up Day 3: insights recap + alignment CTA',r:'Raybern team'},
      {k:'fu_3',l:'Follow-up Day 7: newsletter subscriber invite',r:'Raybern team'},
      {k:'li_post_4',l:'LinkedIn post 4: Top insight from panel (with clip)',r:'Raybern team'},
      {k:'noshows',l:'No-show outreach: recording + alignment offer',r:'Raybern team'},
      {k:'hs_tag',l:'Tag all attendees in HubSpot as webinar_attendee',r:'Raybern team'},
      {k:'beehiiv_seed',l:'Seed willing attendees into Beehiiv newsletter list',r:'Raybern team'},
      {k:'clips',l:'3-4 LinkedIn clips extracted from recording',r:'Raybern team'},
      {k:'newsletter',l:'Newsletter recap issue drafted with panel highlights',r:'Raybern team'},
    ]},
  ]
  const total=PHASES.flatMap(p=>p.items).length
  const doneN=Object.values(done).filter(Boolean).length
  return (
    <div>
      <div className='mb-5 detail-card'>
        <div className='flex items-center justify-between mb-2'>
          <div className='font-semibold text-sm' style={{color:'var(--navy)'}}>Campaign Progress</div>
          <div className='text-sm font-bold' style={{color:'var(--navy)'}}>{doneN}/{total}</div>
        </div>
        <div className='h-2 rounded-full overflow-hidden' style={{background:'var(--border)'}}>
          <div className='h-full rounded-full transition-all' style={{background:'linear-gradient(90deg, #22C55E, #16A34A)',width:(doneN/total*100)+'%'}} />
        </div>
        {topic && <p className='text-xs mt-2' style={{color:'var(--text-muted)'}}>Panel: {topic}</p>}
      </div>
      <div className='space-y-4'>
        {PHASES.map((phase,pi)=>{
          const pDone=phase.items.filter(i=>done[i.k]).length
          return (
            <div key={pi} className='detail-card'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <span>{phase.icon}</span>
                  <div>
                    <div className='font-bold text-sm' style={{color:'var(--navy)'}}>{phase.name}</div>
                    <div className='text-xs' style={{color:'var(--text-muted)'}}>{phase.weeks}</div>
                  </div>
                </div>
                <span className='text-xs font-semibold px-2.5 py-1 rounded-full border'
                  style={pDone===phase.items.length?{background:'#ECFDF5',color:'#065F46',borderColor:'#A7F3D0'}:{background:'#F9FAFB',color:'#6B7280',borderColor:'#E5E7EB'}}>
                  {pDone}/{phase.items.length}
                </span>
              </div>
              <div className='space-y-2'>
                {phase.items.map(item=>(
                  <div key={item.k} className='flex items-start gap-3 cursor-pointer' onClick={()=>toggle(item.k)}>
                    <div className='w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5'
                      style={{borderColor:done[item.k]?'#22C55E':'#D1D5DB',background:done[item.k]?'#22C55E':'white'}}>
                      {done[item.k] && <span className='text-white' style={{fontSize:9}}>✓</span>}
                    </div>
                    <div className='flex-1'>
                      <span className='text-sm' style={{color:done[item.k]?'var(--text-muted)':'var(--text-dark)',textDecoration:done[item.k]?'line-through':'none'}}>{item.l}</span>
                      <span className='ml-2 text-xs' style={{color:'var(--text-light)'}}>({item.r})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TOOLS & SETUP ─────────────────────────────────────────────────────────────
function ToolsSetupView() {
  const [exp,setExp]=useState<string|null>('riverside')
  const TOOLS=[
    {id:'riverside',icon:'🎙',name:'Riverside.fm',rec:true,status:'Setup required',sBg:'#FFF7ED',sC:'#92400E',sBr:'#FED7AA',cost:'~$19/mo Starter',url:'https://riverside.fm',
      headline:'Panel hosting — broadcast-quality recording + AI clips',
      why:'Riverside records each speaker locally on their device — quality never degrades on bad internet. Each speaker is a separate track so you can edit independently. AI generates full transcript and short clips within minutes of the session ending.',
      setup:['Sign up at riverside.fm ($19/mo Starter)','Create a Studio for the panel','Add panelists as Guests — browser link, no download needed','LinkedIn Event link → Riverside room URL','Record → transcript and AI clips auto-generate','Download clips → 4 LinkedIn posts from one panel'],
      manual:['Download recording + transcript from Riverside dashboard','Manually clip highlights in CapCut or similar','Export session data manually'],
      note:'Use Zoom if: audience is 200+ OR invitees refuse non-Zoom. Otherwise Riverside wins on quality.'},
    {id:'zoom',icon:'🎥',name:'Zoom Webinar',rec:false,status:'Alternative',sBg:'#EFF6FF',sC:'#1E40AF',sBr:'#BFDBFE',cost:'$149/yr (Webinar add-on)',url:'https://zoom.us',
      headline:'Large-audience hosting — familiar, 500-attendee capacity',
      why:'Everyone has Zoom. Webinar add-on: 500 attendees, registration pages, Q&A, polling, attendance reports. Recording quality depends on each speaker internet connection.',
      setup:['Upgrade to Zoom Pro + Webinar add-on','Schedule webinar → get registration link','Add panelists as Panelists (not Attendees)','Enable cloud recording','Post-event: export attendee report from Zoom Reports'],
      manual:['Download recording from Zoom cloud','Export attendee list (name, email, join/leave times)','Manually import to HubSpot and Beehiiv'],
      note:'For a 4-6 person panel focused on quality and content repurposing, Riverside is the better choice.'},
    {id:'linkedin',icon:'💼',name:'LinkedIn Event',rec:true,status:'Setup required',sBg:'#FFF7ED',sC:'#92400E',sBr:'#FED7AA',cost:'Free',url:'https://www.linkedin.com/events/create',
      headline:'Primary discovery and invite surface for utility leaders',
      why:'Water utility directors are on LinkedIn. A LinkedIn Event creates a persistent public RSVP page — people can find it, share it, and invite others. It is also how you manually invite 1st-degree connections from the 69-lead list. Not optional.',
      setup:['Go to linkedin.com/events/create','Host: Raybern Consulting company page','Name: exact panel topic verbatim','Date + Riverside/Zoom session URL','Description: panelists, topic angle, goal — honest, no-pitch','Publish → copy URL → paste into Panel Builder','Invite Strategy tab → manually invite Tier 1 leads'],
      manual:['Manually invite 1st-degree connections (up to 1,000/event)','Export RSVP list from LinkedIn Event dashboard','Cross-reference RSVPs against Intelligence leads'],
      note:'LinkedIn Event is not optional — it is the primary distribution channel for this audience.'},
    {id:'hubspot',icon:'🔌',name:'HubSpot CRM',rec:true,status:'Ready to connect',sBg:'#ECFDF5',sC:'#065F46',sBr:'#A7F3D0',cost:'Existing plan (read access)',url:'https://hubspot.com',
      headline:'Contact deduplication + attendee matching',
      why:'Cross-reference event registrants against existing HubSpot contacts. Know instantly: who RSVPed that Raybern already knows, who is net-new, which deals were influenced by attendance. Prevents duplicate outreach.',
      setup:['Connect HubSpot API (Newsletter → Connections tab)','After event: export attendee list from LinkedIn/Riverside','Match against HubSpot contacts by email','Tag matched contacts: webinar_attendee','Prioritize tagged contacts for follow-up alignment calls'],
      manual:['Export attendee email list','CSV import to HubSpot','Add tag webinar_q2_2026 manually','Note attendance in contact activity log'],
      note:'Without connection: manual matching. With connection: matching and tagging can be automated.'},
    {id:'beehiiv',icon:'🔌',name:'Beehiiv',rec:true,status:'Ready to connect',sBg:'#ECFDF5',sC:'#065F46',sBr:'#A7F3D0',cost:'Existing plan',url:'https://beehiiv.com',
      headline:'Post-event nurture — attendees into newsletter',
      why:'Attendees who engaged with the panel are the warmest leads. Seed them into the newsletter so Raybern stays visible monthly. A panel attendee who reads the compliance digest for 3 months is a different kind of prospect.',
      setup:['Connect Beehiiv (Newsletter → Connections tab)','After event: export consenting attendee emails','Import to Beehiiv with tag webinar_q2_2026','Send dedicated follow-up newsletter within 5 days','Segment panel attendees for future targeted issues'],
      manual:['Export attendee email list manually','Bulk import to Beehiiv','Add tag manually in Beehiiv','Send follow-up newsletter to tagged segment'],
      note:'Seeding attendees into newsletter is the highest-ROI post-event action regardless of connection status.'},
  ]
  return (
    <div>
      <div className='mb-5 p-4 rounded-xl border' style={{background:'#EFF6FF',borderColor:'#BFDBFE'}}>
        <div className='font-semibold text-sm mb-1' style={{color:'var(--navy)'}}>What needs to be set up</div>
        <p className='text-xs' style={{color:'#1E3A5F'}}>Some tools need to be created/purchased; others just need to be connected. The panel works manually without connections — connections add tracking, deduplication, and automation.</p>
        <div className='flex gap-3 mt-3 flex-wrap text-xs'>
          {[{l:'Setup required',bg:'#FFF7ED',c:'#92400E',br:'#FED7AA'},{l:'Ready to connect',bg:'#ECFDF5',c:'#065F46',br:'#A7F3D0'},{l:'Alternative',bg:'#EFF6FF',c:'#1E40AF',br:'#BFDBFE'}].map(s=>(
            <span key={s.l} className='font-semibold px-2.5 py-1 rounded-full border' style={{background:s.bg,color:s.c,borderColor:s.br}}>{s.l}</span>
          ))}
        </div>
      </div>
      <div className='space-y-3'>
        {TOOLS.map(tool=>(
          <div key={tool.id} className='rounded-xl border overflow-hidden' style={{borderColor:exp===tool.id?tool.sBr:'var(--border)',background:'white'}}>
            <button className='w-full text-left px-5 py-4 flex items-start gap-4' onClick={()=>setExp(exp===tool.id?null:tool.id)}>
              <div className='text-2xl shrink-0'>{tool.icon}</div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 flex-wrap mb-1'>
                  <span className='font-bold text-sm' style={{color:'var(--navy)'}}>{tool.name}</span>
                  {tool.rec && <span className='text-xs font-semibold px-1.5 py-0.5 rounded-full' style={{background:'#ECFDF5',color:'#065F46'}}>Recommended</span>}
                  <span className='text-xs font-semibold px-2 py-0.5 rounded-full border ml-auto' style={{background:tool.sBg,color:tool.sC,borderColor:tool.sBr}}>{tool.status}</span>
                </div>
                <div className='text-xs' style={{color:'var(--text-muted)'}}>{tool.headline} · {tool.cost}</div>
              </div>
              <span className='text-xs shrink-0 mt-1' style={{color:'var(--text-muted)'}}>{exp===tool.id?'▲':'▼'}</span>
            </button>
            {exp===tool.id && (
              <div className='px-5 pb-5 border-t' style={{borderColor:'var(--border)',background:'var(--bg)'}}>
                <div className='grid md:grid-cols-3 gap-4 mt-4'>
                  <div className='rounded-lg p-4 border bg-white' style={{borderColor:'var(--border)'}}>
                    <div className='text-xs font-bold uppercase tracking-wide mb-2' style={{color:'var(--text-muted)'}}>Why This Tool</div>
                    <p className='text-sm' style={{color:'var(--text-dark)'}}>{tool.why}</p>
                  </div>
                  <div className='rounded-lg p-4 border bg-white' style={{borderColor:'var(--border)'}}>
                    <div className='text-xs font-bold uppercase tracking-wide mb-2' style={{color:'var(--text-muted)'}}>Setup Steps</div>
                    <ol className='space-y-1.5'>
                      {tool.setup.map((s,i)=>(
                        <li key={i} className='flex gap-2 text-xs' style={{color:'var(--text-muted)'}}>
                          <span className='shrink-0 w-4 h-4 rounded-full text-white font-bold flex items-center justify-center' style={{background:'var(--navy)',fontSize:9}}>{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                    <a href={tool.url} target='_blank' rel='noopener noreferrer' className='mt-3 block text-center text-xs font-semibold px-3 py-2 rounded-lg border' style={{borderColor:tool.sBr,background:tool.sBg,color:tool.sC}}>Open {tool.name} →</a>
                  </div>
                  <div className='rounded-lg p-4 border bg-white' style={{borderColor:'var(--border)'}}>
                    <div className='text-xs font-bold uppercase tracking-wide mb-2' style={{color:'var(--text-muted)'}}>Without Connection (Manual)</div>
                    <ul className='space-y-1.5'>
                      {tool.manual.map((s,i)=>(
                        <li key={i} className='text-xs flex gap-1.5' style={{color:'var(--text-muted)'}}><span style={{color:'#9CA3AF'}}>•</span>{s}</li>
                      ))}
                    </ul>
                    {tool.note && <div className='mt-3 text-xs p-2 rounded-lg' style={{background:'#F9FAFB',color:'var(--text-muted)'}}>{tool.note}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
