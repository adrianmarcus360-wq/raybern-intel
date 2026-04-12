"""
Merge tech intelligence into enriched leads + boost lead scores for tech signals.
"""
import json
from pathlib import Path

BASE = Path(__file__).parent.parent
ENRICHED = BASE / "src/data/leads_enriched.json"
TECH     = BASE / "src/data/leads_tech.json"
OUT      = BASE / "src/data/leads_final.json"

leads = json.loads(ENRICHED.read_text())
tech_list = json.loads(TECH.read_text())
tech_by_pwsid = {t["pwsid"]: t for t in tech_list}

# Scoring boosts for tech signals
def calc_tech_score_boost(t: dict) -> int:
    boost = 0
    billing = (t.get("billing_software") or "").lower()
    ami = (t.get("ami_system") or "").lower()

    # MUNIS is documented Raybern territory
    if "munis" in billing:
        boost += 20
    # Oracle/PeopleSoft — enterprise, harder to displace but big deal
    elif "oracle" in billing or "peoplesoft" in billing:
        boost += 8
    # Any billing system found = qualified signal
    elif billing:
        boost += 10

    # Sensus FlexNet with violations = Panama City pattern
    if "sensus" in ami and "flexnet" in ami:
        boost += 15
    elif "itron" in ami:
        boost += 12
    elif "neptune" in ami:
        boost += 12
    elif ami:
        boost += 8

    # Recent RFPs = actively buying
    if t.get("recent_rfps"):
        boost += 10

    return min(boost, 35)  # cap boost at 35 pts

RAYBERN_POSITIONING = {
    "munis": {
        "headline": "Tyler MUNIS — Raybern's #1 Target System",
        "detail": "Raybern has documented MUNIS module interdependency failures from the KKW engagement. This utility is running the same system. They likely have the same unresolved workflow gaps.",
        "call_to_action": "Lead with: 'We recently completed a MUNIS operational audit at another New England utility and uncovered significant module integration issues. We'd like to benchmark your setup.'"
    },
    "sensus": {
        "headline": "Sensus FlexNet AMI — Panama City Pattern",
        "detail": "Sensus FlexNet + billing system integration breaks are the #1 cause of AMI underperformance. The VFLEX data file pipeline is a known failure point that Raybern has diagnosed and fixed.",
        "call_to_action": "Lead with: 'We've resolved Sensus FlexNet integration failures at multiple utilities where the system appeared to work but wasn't flowing accurate reads to billing.'"
    },
    "itron": {
        "headline": "Itron AMI System",
        "detail": "Itron systems have similar headend-to-billing integration challenges. Raybern's AMI assessment methodology applies directly.",
        "call_to_action": "Lead with: 'We conduct AMI performance audits that identify data gaps between the Itron headend and your billing system — issues that often go undetected for years.'"
    },
    "neptune": {
        "headline": "Neptune R900/e-CODER AMI",
        "detail": "Neptune AMI systems, particularly the R900 network, have documented integration complexity with utility billing platforms.",
        "call_to_action": "Lead with: 'We've found that Neptune R900 networks often have undetected read rate degradation that doesn't surface in billing until it's causing revenue loss.'"
    },
    "oracle": {
        "headline": "Oracle Utilities / CC&B",
        "detail": "Oracle enterprise systems are feature-rich but heavily under-utilized at smaller utilities. Configuration debt accumulates over years of staff turnover.",
        "call_to_action": "Lead with: 'We perform Oracle utilization audits that identify which modules are configured vs. actually being used — most utilities we audit are using less than 40% of what they're paying for.'"
    },
    "aclara": {
        "headline": "Aclara STAR Network AMI",
        "detail": "Aclara STAR systems have specific integration requirements with billing platforms. Data pipeline integrity between the headend and CIS is a common gap.",
        "call_to_action": "Lead with: 'We assess Aclara STAR data pipeline integrity — ensuring reads are completing the full journey from meter to billing statement.'"
    }
}

def get_raybern_positioning(t: dict) -> dict:
    billing = (t.get("billing_software") or "").lower()
    ami = (t.get("ami_system") or "").lower()
    
    if "munis" in billing:
        return RAYBERN_POSITIONING["munis"]
    if "sensus" in ami and "flexnet" in ami:
        return RAYBERN_POSITIONING["sensus"]
    if "itron" in ami:
        return RAYBERN_POSITIONING["itron"]
    if "neptune" in ami:
        return RAYBERN_POSITIONING["neptune"]
    if "oracle" in billing or "peoplesoft" in billing:
        return RAYBERN_POSITIONING["oracle"]
    if "aclara" in ami:
        return RAYBERN_POSITIONING["aclara"]
    if "sensus" in ami:
        return RAYBERN_POSITIONING["sensus"]
    return None

def make_email_sequence(lead: dict, t: dict, positioning: dict) -> list:
    """Generate 3-touch email sequence."""
    name = lead["name"].split("(")[0].strip()
    admin = lead["admin_name"]
    first_name = admin.split()[0].title() if admin else "there"
    billing = t.get("billing_software") or "your current billing system"
    ami = t.get("ami_system") or "your AMI infrastructure"
    
    open_violations = lead["violations_summary"].get("open", 0) + sum(
        1 for v in (lead.get("violations_detail") or []) if v.get("status") == "Active"
    )
    
    violation_line = (
        f"I also noticed {name} has {open_violations} open EPA violation{'s' if open_violations > 1 else ''} on record. "
        "That's often a symptom of data pipeline friction, not operational negligence — and it's exactly the kind of thing we untangle."
    ) if open_violations > 0 else ""

    emails = [
        {
            "touch": 1,
            "day": 0,
            "subject": f"Water utility ops audit — {name}",
            "body": f"""Hi {first_name},

I'm reaching out because Raybern specializes in operational audits for water utilities running {billing} — and we've found a consistent pattern of underutilization and integration gaps at utilities with a similar profile to {name}.

{violation_line}

We recently completed an engagement at a {lead['state']} utility where we identified over $200K in unbilled consumption tied directly to a {ami} integration failure. The system "worked" — but the data wasn't making it through to billing.

Would a 20-minute call make sense to see if there's a fit?

Best,
[Your Name]
Raybern""",
        },
        {
            "touch": 2,
            "day": 5,
            "subject": f"Re: {name} — one specific question",
            "body": f"""Hi {first_name},

Following up quickly — I'll make this specific:

Is your team confident that every meter read from your {ami} system is being captured correctly in {billing}?

We ask because most utilities we audit aren't. The integration looks healthy on the surface, but there's almost always a gap — and utilities don't know until they do a full reconciliation.

Happy to share what we found at a comparable utility if that's useful.

[Your Name]
Raybern""",
        },
        {
            "touch": 3,
            "day": 12,
            "subject": f"Last note — {name}",
            "body": f"""Hi {first_name},

One last note, then I'll leave you alone.

We put together a short summary of the three most common issues we find at utilities running {billing} + {ami}. If any of them ring a bell, it's worth a quick call.

Happy to send it over — just reply "send it" and I'll get it to you.

[Your Name]
Raybern""",
        },
    ]
    return emails

merged = []
for lead in leads:
    t = tech_by_pwsid.get(lead["pwsid"], {})
    boost = calc_tech_score_boost(t)
    positioning = get_raybern_positioning(t)
    email_sequence = make_email_sequence(lead, t, positioning)
    
    # Merge tech data in
    lead["tech_intel"] = {
        "billing_software": t.get("billing_software"),
        "billing_software_confidence": t.get("billing_software_confidence", "none"),
        "billing_software_evidence": t.get("billing_software_evidence", ""),
        "ami_system": t.get("ami_system"),
        "ami_system_confidence": t.get("ami_system_confidence", "none"),
        "ami_system_evidence": t.get("ami_system_evidence", ""),
        "additional_contacts": t.get("additional_contacts", []),
        "recent_news": t.get("recent_news", []),
        "recent_rfps": t.get("recent_rfps", []),
        "contract_signals": t.get("contract_signals", ""),
        "tech_notes": t.get("tech_notes", ""),
        "raybern_positioning": positioning,
        "score_boost": boost,
    }
    lead["email_sequence"] = email_sequence
    
    # Recalculate lead score with boost
    old_score = lead.get("lead_score", 0)
    new_score = min(100, old_score + boost)
    lead["lead_score_raw"] = old_score
    lead["lead_score"] = new_score
    lead["score_boost"] = boost

    # Re-tier if score crossed threshold
    if new_score >= 65 and lead["tier"]["key"] != "Tier 1":
        lead["tier"] = {"key": "Tier 1", "label": "Tier 1 – Hot", "color": "red", "description": "Active violations + tech stack match"}
    elif new_score >= 45 and lead["tier"]["key"] in ("Tier 3", "Tier 4"):
        lead["tier"] = {"key": "Tier 2", "label": "Tier 2 – Warm", "color": "orange", "description": "Strong tech match or recent violations"}

    merged.append(lead)

# Sort by score descending
merged.sort(key=lambda l: l["lead_score"], reverse=True)

OUT.write_text(json.dumps(merged, indent=2))
print(f"✓ Merged {len(merged)} leads → leads_final.json")

# Stats
tier_counts = {}
for l in merged:
    t = l["tier"]["key"]
    tier_counts[t] = tier_counts.get(t, 0) + 1
print("Tier distribution:", tier_counts)

munis_count = sum(1 for l in merged if "munis" in (l["tech_intel"].get("billing_software") or "").lower())
sensus_count = sum(1 for l in merged if "sensus" in (l["tech_intel"].get("ami_system") or "").lower())
print(f"MUNIS users: {munis_count} | Sensus FlexNet: {sensus_count}")
boosted = sum(1 for l in merged if l.get("score_boost", 0) > 0)
print(f"Score boost applied: {boosted} leads")
