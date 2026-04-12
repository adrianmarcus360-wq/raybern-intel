#!/usr/bin/env python3
"""
Fast parallel enrichment of all 69 leads with full EPA SDWIS data.
Uses ThreadPoolExecutor for ~10x speed improvement.
"""
import json, time, sys, os
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

BASE = "https://data.epa.gov/efservice"
LEADS_IN  = "/home/user/surething/cells/d1b7a914-6f2b-4631-a574-d017b61c229e/workspace/raybern-saas/src/data/leads.json"
LEADS_OUT = "/home/user/surething/cells/d1b7a914-6f2b-4631-a574-d017b61c229e/workspace/raybern-saas/src/data/leads_enriched.json"

CONTAMINANT_NAMES = {
    "1040": "Nitrate", "2456": "Radium (226+228)", "2950": "Arsenic",
    "0100": "Coliform (TCR)", "0500": "Lead & Copper Rule", "0600": "Surface Water Treatment",
    "4000": "Disinfection Byproducts (DBP)", "2050": "Fluoride", "3100": "Atrazine",
    "0039": "E. coli", "3014": "Vinyl Chloride", "3515": "Benzene", "2020": "Barium",
    "0036": "Turbidity", "0810": "Disinfection", "0955": "DBP Stage 1 MRDL",
    "0975": "DBP Stage 2 MRDL", "0700": "Total Organic Carbon", "2195": "Uranium",
    "2030": "Cadmium", "2040": "Chromium", "2060": "Mercury", "1025": "Nitrite",
    "2010": "Antimony", "3050": "Methoxychlor", "9999": "Other", "5500": "Total Trihalomethanes",
}

VIOLATION_CATEGORY = {
    "MCL": "Health-Based — Max Contaminant Level",
    "MRDL": "Health-Based — Disinfection Byproduct Level",
    "TT": "Health-Based — Treatment Technique",
    "MR": "Monitoring & Reporting",
    "MON": "Monitoring",
    "RPT": "Reporting",
    "PN": "Public Notification",
    "VAR": "Variance / Exemption",
    "OTHER": "Other",
}

OWNER_TYPE = {
    "F": "Federal Government", "L": "Local Government", "M": "Public / Municipal",
    "N": "Native American / Tribal", "P": "Private (For-Profit)", "S": "State Government",
    "C": "Private (Non-Profit)", "G": "Government",
}

PWS_TYPE_LABELS = {
    "CWS": "Community Water System",
    "NTNCWS": "Non-Transient Non-Community",
    "TNCWS": "Transient Non-Community",
}

SOURCE_CODE_LABELS = {
    "GW": "Groundwater", "SW": "Surface Water", "GU": "Groundwater Under SW Influence",
    "SWP": "Purchased Surface Water", "GWP": "Purchased Groundwater",
    "GUP": "Purchased Groundwater Under SW Influence", "MX": "Mixed Sources",
}

def fetch_json(url, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                return json.loads(resp.read().decode())
        except Exception:
            if attempt < retries - 1:
                time.sleep(1)
    return []

def parse_violations(raw):
    parsed = []
    for v in (raw if isinstance(raw, list) else []):
        cat = (v.get("VIOLATION_CATEGORY_CODE") or "OTHER").strip()
        contam_code = str(v.get("contaminant_code") or "").strip()
        contam = CONTAMINANT_NAMES.get(contam_code, contam_code or "Unknown")
        status_code = (v.get("compliance_status_code") or "").strip()
        if status_code == "O":
            status = "Open"
        elif status_code == "K":
            status = "Active"
        elif status_code == "R":
            status = "Resolved"
        else:
            status = status_code or "Unknown"
        
        begin = v.get("compl_per_begin_date") or ""
        end = v.get("compl_per_end_date") or ""
        
        # Format dates nicely
        def fmt_date(d):
            if not d: return ""
            try:
                dt = datetime.strptime(str(d)[:10], "%Y-%m-%d")
                return dt.strftime("%b %d, %Y")
            except:
                return str(d)[:10]
        
        parsed.append({
            "violation_id": str(v.get("VIOLATION_ID") or ""),
            "category": VIOLATION_CATEGORY.get(cat, cat),
            "category_code": cat,
            "contaminant": contam,
            "contaminant_code": contam_code,
            "is_health_based": v.get("is_health_based_ind") == "Y",
            "is_major": v.get("is_major_viol_ind") == "Y",
            "begin_date": fmt_date(begin),
            "begin_date_raw": str(begin)[:10] if begin else "",
            "end_date": fmt_date(end) if end else "",
            "rtc_date": fmt_date(v.get("RTC_DATE")),
            "enforcement_date": fmt_date(v.get("ENFORCEMENT_DATE")),
            "enforcement_action": str(v.get("enforcement_action_type_code") or ""),
            "status": status,
            "status_code": status_code,
        })
    
    # Sort: open first, then by most recent
    parsed.sort(key=lambda x: (0 if x["status"] == "Open" else 1, x["begin_date_raw"] or "0"), reverse=False)
    parsed.sort(key=lambda x: x["begin_date_raw"] or "0", reverse=True)
    parsed.sort(key=lambda x: 0 if x["status"] == "Open" else 1)
    return parsed

def parse_facilities(raw):
    seen, result = set(), []
    FTYPE = {"IN": "Intake", "WL": "Well", "TP": "Treatment Plant", "ST": "Storage",
             "DS": "Distribution", "CC": "Consecutive Connection", "RC": "Receiving"}
    for f in (raw if isinstance(raw, list) else []):
        name = (f.get("FACILITY_NAME") or "").strip()
        if not name or name in seen: continue
        seen.add(name)
        ftype_code = (f.get("facility_type_code") or "").strip()
        result.append({
            "name": name,
            "type": FTYPE.get(ftype_code, ftype_code or "Facility"),
            "type_code": ftype_code,
            "is_source": f.get("is_source_ind") == "Y",
            "activity": (f.get("facility_activity_code") or "").strip(),
        })
    return result[:12]

def enrich_one(lead):
    pwsid = lead["pwsid"]
    
    sys_raw = fetch_json(f"{BASE}/WATER_SYSTEM/PWSID/{pwsid}/JSON")
    viols_raw = fetch_json(f"{BASE}/VIOLATION/PWSID/{pwsid}/JSON")
    fac_raw = fetch_json(f"{BASE}/WATER_SYSTEM_FACILITY/PWSID/{pwsid}/JSON")
    
    sys_data = sys_raw[0] if sys_raw and isinstance(sys_raw, list) else {}
    violations = parse_violations(viols_raw)
    facilities = parse_facilities(fac_raw)
    
    open_v = [v for v in violations if v["status"] == "Open"]
    health_v = [v for v in violations if v["is_health_based"]]
    
    src_code = sys_data.get("primary_source_code") or lead.get("source_water", "")
    owner_code = sys_data.get("owner_type_code") or "L"
    pws_type_code = sys_data.get("pws_type_code") or "CWS"
    
    # Vendor intelligence based on what we know
    src = lead.get("source_water", "")
    if src in ("SWP", "GWP", "GUP"):
        purchase_type = "purchased"
        vendor_note = (
            "Purchases treated water from a regional authority or wholesaler. "
            "Their costs, compliance obligations, and billing complexity are tied to a supply contract. "
            "Contract renewals and price renegotiations are major leverage events — "
            "especially when the seller raises rates or changes compliance requirements."
        )
        vendor_flag = "Supply Contract"
    elif src in ("SW", "GU"):
        purchase_type = "surface"
        vendor_note = (
            "Operates its own surface water treatment plant. "
            "Primary vendor relationships include chemical suppliers (coagulants, disinfectants, corrosion inhibitors), "
            "lab testing services (NELAP-certified, usually annual or 3-year contracts), "
            "and AMI/AMR meter reading system providers (Itron, Sensus/Xylem, Neptune, etc.)."
        )
        vendor_flag = "Treatment Plant"
    else:
        purchase_type = "ground"
        vendor_note = (
            "Draws from groundwater wells. "
            "Primary vendor spend includes pump/well maintenance contractors, "
            "lab testing services for chemical and bacteriological analysis, "
            "and billing/meter reading system vendors."
        )
        vendor_flag = "Groundwater Wells"

    # Raybern service fit
    v_cnt = lead.get("violation_count", 0)
    pop = lead.get("population", 0)
    signals_for_raybern = []
    primary_service = ""
    
    if len(open_v) > 0:
        signals_for_raybern.append(f"{len(open_v)} open EPA violation(s) — compliance documentation support is an immediate need")
        primary_service = "Compliance & Documentation Support"
    if v_cnt >= 5:
        signals_for_raybern.append("High violation history suggests billing/monitoring data integrity issues worth auditing")
        if not primary_service: primary_service = "Billing & Data Audit"
    if pop >= 10000:
        signals_for_raybern.append(f"Population of {pop:,} puts them in the core Raybern client profile for billing system audits")
    if src in ("SW", "SWP", "GU"):
        signals_for_raybern.append("Surface water source — higher treatment/billing complexity makes a system audit more valuable")
    if lead.get("connections", 0) >= 3000:
        signals_for_raybern.append(f"{lead.get('connections', 0):,} service connections — right-sized for CIS/UB software evaluation")
        if not primary_service: primary_service = "CIS / UB Software Evaluation"
    if not signals_for_raybern:
        signals_for_raybern.append("Clean compliance record may indicate well-managed operations — position as proactive planning")
    if not primary_service: primary_service = "Proactive Operational Review"

    # Discovery questions for sales call
    discovery_questions = [
        f"What utility billing software are you currently using, and how long have you had it?",
        f"Are you planning any meter changeout or AMI/AMR upgrade programs in the next 1–3 years?",
        f"How do you currently handle missed meter reads — estimated bills or manual follow-up?",
        f"Is your billing system integrated with your meter reading system, or are you manually transferring data?",
        f"When did you last do a comprehensive audit of your billing data and meter configurations?",
    ]
    if len(open_v) > 0:
        discovery_questions.insert(0, f"I saw {len(open_v)} open EPA violation(s) in the SDWIS record — can you walk me through where those stand?")
    if src == "SWP":
        discovery_questions.insert(1, "How is your relationship with your water supplier? Any upcoming contract renewals or rate changes?")

    return {
        **lead,
        "system_profile": {
            "pws_type": PWS_TYPE_LABELS.get(pws_type_code, "Community Water System"),
            "pws_type_code": pws_type_code,
            "activity": "Active" if sys_data.get("pws_activity_code") == "A" else (sys_data.get("pws_activity_code") or "Active"),
            "owner_type": OWNER_TYPE.get(owner_code, "Municipal / Local Government"),
            "owner_type_code": owner_code,
            "epa_region": str(sys_data.get("epa_region") or ""),
            "primary_source_code": src_code,
            "primary_source_label": SOURCE_CODE_LABELS.get(src_code, lead.get("source_water_label", "")),
            "org_name": (sys_data.get("org_name") or "").strip() or lead.get("name", ""),
            "is_wholesaler": sys_data.get("is_wholesaler_ind") == "Y",
        },
        "violations_detail": violations,
        "violations_summary": {
            "total": len(violations),
            "open": len(open_v),
            "resolved": len(violations) - len(open_v),
            "health_based": len(health_v),
            "open_health_based": len([v for v in open_v if v["is_health_based"]]),
            "major": len([v for v in violations if v["is_major"]]),
            "latest_date": violations[0]["begin_date"] if violations else "",
            "oldest_date": violations[-1]["begin_date"] if violations else "",
        },
        "facilities": facilities,
        "vendor_intelligence": {
            "type": vendor_flag,
            "purchase_type": purchase_type,
            "note": vendor_note,
        },
        "raybern_fit": {
            "primary_service": primary_service,
            "signals": signals_for_raybern,
            "discovery_questions": discovery_questions,
        },
        "data_sources": [
            {
                "name": "EPA Safe Drinking Water Information System (SDWIS)",
                "org": "U.S. Environmental Protection Agency",
                "url": f"https://www.epa.gov/enviro/sdwis-search-results?pwsid={pwsid}&mode=pws",
                "description": f"Primary source — system profile, violations, compliance history. PWSID: {pwsid}",
            },
            {
                "name": "EPA Enforcement & Compliance History Online (ECHO)",
                "org": "U.S. Environmental Protection Agency",
                "url": f"https://echo.epa.gov/facilities/facility-search/results?p_pwsid={pwsid}",
                "description": "Enforcement actions, penalties, and detailed compliance records.",
            },
            {
                "name": "SDWIS Water System Facility Records",
                "org": "U.S. Environmental Protection Agency",
                "url": f"https://data.epa.gov/efservice/WATER_SYSTEM_FACILITY/PWSID/{pwsid}/JSON",
                "description": f"Facility data: intakes, wells, treatment plants, distribution connections. {len(facilities)} facilities found.",
            },
        ],
        "pwsid_url": f"https://www.epa.gov/enviro/sdwis-search-results?pwsid={pwsid}&mode=pws",
        "echo_url": f"https://echo.epa.gov/facilities/facility-search/results?p_pwsid={pwsid}",
    }

with open(LEADS_IN) as f:
    leads = json.load(f)

print(f"Enriching {len(leads)} leads with parallel EPA SDWIS requests...")
results = {}
failed = []

with ThreadPoolExecutor(max_workers=8) as pool:
    futures = {pool.submit(enrich_one, lead): lead["pwsid"] for lead in leads}
    done = 0
    for future in as_completed(futures):
        pwsid = futures[future]
        done += 1
        try:
            enriched = future.result()
            results[pwsid] = enriched
            vt = enriched.get("violations_summary", {}).get("total", 0)
            vo = enriched.get("violations_summary", {}).get("open", 0)
            print(f"  [{done:2d}/{len(leads)}] {pwsid} — {vt} violations ({vo} open)", flush=True)
        except Exception as e:
            failed.append(pwsid)
            results[pwsid] = next(l for l in leads if l["pwsid"] == pwsid)
            print(f"  [{done:2d}/{len(leads)}] {pwsid} — FAILED: {e}", flush=True)

# Restore original order
enriched_leads = [results[lead["pwsid"]] for lead in leads]

with open(LEADS_OUT, "w") as f:
    json.dump(enriched_leads, f, indent=2)

total_viols = sum(l.get("violations_summary", {}).get("total", 0) for l in enriched_leads)
total_open = sum(l.get("violations_summary", {}).get("open", 0) for l in enriched_leads)
print(f"\n✓ Done. {len(enriched_leads)} leads enriched.")
print(f"  Total violations found: {total_viols} ({total_open} open)")
if failed: print(f"  Failed (used base data): {failed}")
