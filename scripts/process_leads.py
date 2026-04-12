#!/usr/bin/env python3
"""Process raw EPA lead data into enriched format with email drafts."""
import json, re, sys

with open('/home/user/surething/cells/c352c19c-7ab6-470e-8eaa-d9ba6d575662/workspace/output/water_intel_raw.json') as f:
    leads = json.load(f)

def parse_signals(signals):
    d = {'open_violations': 0, 'health_based': 0, 'total_violations': 0,
         'recent_violations': 0, 'monitoring_gaps': 0}
    for s in signals:
        for key, pattern in [
            ('open_violations', r'(\d+) OPEN'),
            ('health_based', r'(\d+) health-based'),
            ('total_violations', r'(\d+) total violations'),
            ('recent_violations', r'(\d+) violation\(s\) in last 12'),
            ('monitoring_gaps', r'(\d+) monitoring/reporting'),
        ]:
            m = re.search(pattern, s)
            if m: d[key] = int(m.group(1))
    return d

SOURCE_WATER_LABELS = {
    'SW':   ('Surface Water',          'Drawn from rivers or lakes — requires complex treatment and detailed regulatory reporting'),
    'SWP':  ('Surface Water (Regional)','Purchased from a regional authority like MWRA — dependent on upstream compliance'),
    'GW':   ('Groundwater',             'Sourced from wells — generally simpler treatment, but contamination risk is costly'),
    'GWP':  ('Groundwater (Regional)', 'Purchased groundwater from a regional system'),
    'SWGU': ('Mixed Sources',           'Blends surface and groundwater — complex to manage and report'),
}

TIER_MAP = {
    'Tier 1': ('Hot Lead',   '#ef4444', 'Unresolved violations + health risk — active regulatory pressure right now'),
    'Tier 2': ('Warm Lead',  '#f97316', 'Multiple violations or recent issues — strong compliance consulting fit'),
    'Tier 3': ('Lukewarm',   '#eab308', 'Moderate history — worth nurturing, lower immediate pain'),
    'Watch':  ('Watch List', '#22c55e', 'Clean record but size/type fits Raybern profile — long-term pipeline'),
}

def tier_info(tier_str):
    for k, v in TIER_MAP.items():
        if k in tier_str:
            return {'key': k, 'label': v[0], 'color': v[1], 'description': v[2]}
    return {'key': 'Watch', 'label': 'Watch List', 'color': '#22c55e', 'description': ''}

def format_phone(p):
    p = re.sub(r'\D', '', p)
    return f"({p[:3]}) {p[3:6]}-{p[6:]}" if len(p) == 10 else p

def title_case(s):
    return re.sub(r"[A-Z]{2,}", lambda m: m.group(0).title(), s.title())

def generate_email(lead, parsed):
    name = title_case(lead['name'])
    city = title_case(lead['city'])
    admin = title_case(lead['admin_name'])
    first_name = admin.split()[0]
    pop = f"{lead['population']:,}"
    sw_label = SOURCE_WATER_LABELS.get(lead['source_water'], (lead['source_water'], ''))[0].lower()
    open_v = parsed['open_violations']
    hb = parsed['health_based']
    total = parsed['total_violations']
    recent = parsed['recent_violations']

    if open_v > 0:
        hook = f"I noticed {name} currently has {open_v} unresolved EPA violation{'s' if open_v > 1 else ''}"
        hook += f", including {hb} health-based violation{'s' if hb > 1 else ''} in the past 3 years" if hb > 0 else ""
        hook += "."
        subject = f"{open_v} open EPA violation{'s' if open_v > 1 else ''} at {name} — compliance support"
    elif recent > 0:
        hook = f"I came across {name} in EPA's SDWIS database — {recent} new violation{'s' if recent > 1 else ''} in the last 12 months, {total} total on record."
        subject = f"Recent EPA violations at {name} — how we can help"
    else:
        hook = f"I came across {name} in EPA's SDWIS database — {total} violations on record. I wanted to reach out directly."
        subject = f"EPA compliance profile for {name} — worth a conversation"

    body = f"""Hi {first_name},

{hook}

We work specifically with {sw_label} utilities serving populations like {city}'s {pop} residents — helping compliance teams close out open violations, handle regulator correspondence, and implement documentation fixes without adding headcount.

Most of our clients go from open violations to full resolution in 60–90 days. We own the process end-to-end: audit, corrective action plans, agency communication, and monitoring protocols.

Would a 20-minute call this week make sense? I can work around your schedule.

Best,
[Your Name]
Raybern
[phone] | raybern.com"""

    return {"subject": subject, "body": body}

def clean_signal(s):
    # Strip emoji and return human-readable signal
    text = re.sub(r'[^\x00-\x7F]+', '', s).strip(' —-')
    text = re.sub(r'^\s*', '', text)
    return text.strip()

enhanced = []
for lead in leads:
    parsed = parse_signals(lead['signals'])
    sw_code = lead['source_water']
    sw_info = SOURCE_WATER_LABELS.get(sw_code, (sw_code, 'Water system type'))
    tier = tier_info(lead['tier'])
    
    # Clean signals: parse into structured items
    clean_signals = []
    for s in lead['signals']:
        if 'OPEN' in s:
            n = re.search(r'(\d+)', s)
            clean_signals.append({'type': 'danger', 'text': f"{n.group(1) if n else '?'} unresolved EPA violation{'s' if (n and int(n.group(1)) > 1) else ''} — regulatory action risk"})
        elif 'health-based' in s:
            n = re.search(r'(\d+)', s)
            clean_signals.append({'type': 'danger', 'text': f"{n.group(1) if n else '?'} health-based violation{'s' if (n and int(n.group(1)) > 1) else ''} in the last 3 years (MCL/Treatment Technique)"})
        elif 'total violations' in s:
            n = re.search(r'(\d+)', s)
            clean_signals.append({'type': 'warning', 'text': f"{n.group(1) if n else '?'} total violations on EPA record"})
        elif 'last 12 months' in s:
            n = re.search(r'(\d+)', s)
            clean_signals.append({'type': 'warning', 'text': f"{n.group(1) if n else '?'} new violation{'s' if (n and int(n.group(1)) > 1) else ''} in the past 12 months"})
        elif 'monitoring/reporting' in s:
            n = re.search(r'(\d+)', s)
            clean_signals.append({'type': 'warning', 'text': f"{n.group(1) if n else '?'} monitoring & reporting gap{'s' if (n and int(n.group(1)) > 1) else ''} — documentation risk"})
        elif 'ideal Raybern' in s or 'Pop' in s:
            clean_signals.append({'type': 'positive', 'text': f"Population of {lead['population']:,} — ideal client size for Raybern"})
        elif 'Surface water' in s:
            clean_signals.append({'type': 'info', 'text': "Surface water source — higher treatment complexity and billing volume"})
        elif 'pop/connection' in s or 'ratio' in s.lower():
            clean_signals.append({'type': 'info', 'text': f"High people-per-meter ratio — dense service area, complex billing"})

    enhanced.append({
        **lead,
        'tier': tier,
        'phone_formatted': format_phone(lead['phone']),
        'source_water_label': sw_info[0],
        'source_water_description': sw_info[1],
        'parsed_signals': parsed,
        'clean_signals': clean_signals,
        'email_draft': generate_email(lead, parsed),
        'admin_name': title_case(lead['admin_name']),
        'name': title_case(lead['name']),
        'city': title_case(lead['city']),
    })

output_path = '/tmp/raybern-saas/src/data/leads.json'
with open(output_path, 'w') as f:
    json.dump(enhanced, f, indent=2)

print(f"✓ Wrote {len(enhanced)} enriched leads to {output_path}")

# Stats
tier_counts = {}
for l in enhanced:
    t = l['tier']['key']
    tier_counts[t] = tier_counts.get(t, 0) + 1
for k, v in sorted(tier_counts.items()):
    print(f"  {k}: {v}")
