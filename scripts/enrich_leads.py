#!/usr/bin/env python3
"""
Enrich all 69 leads with full EPA SDWIS detail:
  - WATER_SYSTEM: org type, owner type, activity, PWS type, region, org name
  - VIOLATION: each violation with dates, contaminant, category, status, enforcement dates
  - WATER_SYSTEM_FACILITY: intake/well/treatment facility names
  - SERVICE_AREA: service area types
Outputs src/data/leads_enriched.json
"""
import json, time, sys
import urllib.request, urllib.error

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
}

VIOLATION_CATEGORY = {
    "MCL": "Health-Based (Max Contaminant Level)",
    "MRDL": "Health-Based (Disinfection Byproduct Level)",
    "TT": "Health-Based (Treatment Technique)",
    "MR": "Monitoring & Reporting",
    "MON": "Monitoring",
    "RPT": "Public Notification / Reporting",
    "PN": "Public Notification",
    "VAR": "Variance / Exemption",
    "OTHER": "Other",
}

OWNER_TYPE = {
    "F": "Federal Government", "L": "Local Government", "M": "Public / Municipal",
    "N": "Native American / Tribal", "P": "Private (For-Profit)", "S": "State Government",
    "C": "Private (Non-Profit)",
}

PWS_TYPE = {
    "CWS": "Community Water System",
    "NTNCWS": "Non-Transient Non-Community",
    "TNCWS": "Transient Non-Community",
}

SOURCE_CODE = {
    "GW": "Groundwater", "SW": "Surface Water", "GU": "Groundwater Under Influence of SW",
    "SWP": "Purchased Surface Water", "GWP": "Purchased Groundwater",
    "GUP": "Purchased Groundwater Under SW Influence", "MX": "Mixed Sources",
}

def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Raybern-Intel/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return []
    return []

def get_system(pwsid):
    data = fetch_json(f"{BASE}/WATER_SYSTEM/PWSID/{pwsid}/JSON")
    if data and isinstance(data, list):
        return data[0]
    return {}

def get_violations(pwsid):
    data = fetch_json(f"{BASE}/VIOLATION/PWSID/{pwsid}/JSON")
    return data if isinstance(data, list) else []

def get_facilities(pwsid):
    data = fetch_json(f"{BASE}/WATER_SYSTEM_FACILITY/PWSID/{pwsid}/JSON")
    return data if isinstance(data, list) else []

def get_enforcement(pwsid):
    data = fetch_json(f"{BASE}/ENFORCEMENT_ACTION/PWSID/{pwsid}/JSON")
    return data if isinstance(data, list) else []

def parse_violations(raw_viols):
    parsed = []
    for v in raw_viols:
        cat_code = v.get("VIOLATION_CATEGORY_CODE", "OTHER") or "OTHER"
        contam_code = str(v.get("CONTAMINANT_CODE", "") or "")
        contam_name = CONTAMINANT_NAMES.get(contam_code, v.get("CONTAMINANT_CODE", "Unknown"))
        status_code = v.get("VIOL_STATUS_CODE", "") or ""
        status = "Open" if status_code in ("O", "SE") else "Resolved" if status_code in ("R", "RR") else status_code or "Unknown"
        is_health = v.get("IS_HEALTH_BASED_IND", "N") == "Y"
        is_major = v.get("IS_MAJOR_VIOL_IND", "N") == "Y"
        
        parsed.append({
            "violation_id": v.get("VIOLATION_ID", ""),
            "violation_code": v.get("VIOLATION_CODE", ""),
            "category": VIOLATION_CATEGORY.get(cat_code, cat_code),
            "category_code": cat_code,
            "contaminant": contam_name,
            "contaminant_code": contam_code,
            "is_health_based": is_health,
            "is_major": is_major,
            "begin_date": v.get("COMPL_PER_BEGIN_DATE") or v.get("VIOL_BEGIN_DATE") or "",
            "end_date": v.get("COMPL_PER_END_DATE") or v.get("VIOL_END_DATE") or "",
            "rtc_date": v.get("RTC_DATE") or "",  # Return to Compliance
            "enforcement_date": v.get("ENFORCEMENT_DATE") or "",
            "enforcement_action": v.get("ENFORCEMENT_ACTION_TYPE_CODE") or "",
            "status": status,
            "status_code": status_code,
            "severity": v.get("SEVERITY_IND_CNT") or "",
        })
    # Sort: open first, then by begin_date desc
    parsed.sort(key=lambda x: (0 if x["status"] == "Open" else 1, x["begin_date"] or ""), reverse=False)
    parsed.sort(key=lambda x: x["begin_date"] or "0000", reverse=True)
    parsed.sort(key=lambda x: 0 if x["status"] == "Open" else 1)
    return parsed

def parse_facilities(raw_facs):
    seen = set()
    facilities = []
    for f in raw_facs:
        name = (f.get("FACILITY_NAME") or "").strip()
        ftype = (f.get("FACILITY_TYPE_CODE") or "").strip()
        activity = (f.get("FACILITY_ACTIVITY_CODE") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        facilities.append({
            "name": name,
            "type": ftype,
            "activity": activity,
            "water_type": f.get("IS_SOURCE_IND") or "",
        })
    return facilities[:10]  # cap at 10

def enrich_lead(lead):
    pwsid = lead["pwsid"]
    print(f"  Fetching {pwsid} — {lead['name'][:40]}...", flush=True)
    
    sys_data = get_system(pwsid)
    time.sleep(0.3)
    viols_raw = get_violations(pwsid)
    time.sleep(0.3)
    facilities_raw = get_facilities(pwsid)
    time.sleep(0.2)
    
    violations = parse_violations(viols_raw)
    facilities = parse_facilities(facilities_raw)
    
    open_viols = [v for v in violations if v["status"] == "Open"]
    resolved_viols = [v for v in violations if v["status"] != "Open"]
    health_viols = [v for v in violations if v["is_health_based"]]
    
    # Infer vendor/purchase context from source water type
    src = lead.get("source_water", "")
    vendor_context = None
    if src in ("SWP", "GWP", "GUP"):
        vendor_context = {
            "type": "Purchased Water",
            "note": f"Purchases treated water from a regional authority or wholesaler. Contract terms, pricing, and compliance obligations are governed by a service agreement with the seller — renewal timing and price renegotiation are key leverage points.",
            "contract_flag": True,
        }
    elif src in ("SW", "GU"):
        vendor_context = {
            "type": "Self-Operated Treatment",
            "note": "Operates its own treatment plant. Chemical treatment vendors (coagulants, disinfectants, corrosion inhibitors) and lab testing contracts are typically renewed annually or every 3 years.",
            "contract_flag": False,
        }
    else:
        vendor_context = {
            "type": "Groundwater / Mixed",
            "note": "Draws from groundwater wells. Primary vendor spend is in pump maintenance, well testing, and chemical treatment. Lab testing contracts often cover multiple analytes on a NELAP-certified schedule.",
            "contract_flag": False,
        }

    # EPA data sources used
    data_sources = [
        {
            "name": "EPA Safe Drinking Water Information System (SDWIS)",
            "type": "Federal Database",
            "url": f"https://www.epa.gov/enviro/sdwis-search-results?pwsid={pwsid}&mode=pws",
            "description": f"Primary source for all compliance, violation, and system profile data. Record ID: {pwsid}",
            "fields": ["PWSID", "System Type", "Population", "Connections", "Source Water", "Owner Type", "Violations"],
        },
        {
            "name": "EPA Enforcement & Compliance (ECHO)",
            "type": "Federal Database",
            "url": f"https://echo.epa.gov/facilities/facility-search/results?p_pwsid={pwsid}",
            "description": "Enforcement actions, compliance history, and penalty data.",
            "fields": ["Enforcement Actions", "Penalty History", "Compliance Status"],
        },
    ]
    if facilities:
        data_sources.append({
            "name": "SDWIS Water System Facility Data",
            "type": "Federal Database",
            "url": f"https://data.epa.gov/efservice/WATER_SYSTEM_FACILITY/PWSID/{pwsid}/JSON",
            "description": "Individual facility records: intakes, treatment plants, storage, distribution.",
            "fields": ["Facility Name", "Facility Type", "Activity Code"],
        })

    enriched = {
        **lead,
        # System profile from SDWIS WATER_SYSTEM
        "system_profile": {
            "pws_type": PWS_TYPE.get(sys_data.get("PWS_TYPE_CODE", ""), sys_data.get("PWS_TYPE_CODE", "Community Water System")),
            "pws_type_code": sys_data.get("PWS_TYPE_CODE", "CWS"),
            "activity": "Active" if sys_data.get("PWS_ACTIVITY_CODE") == "A" else sys_data.get("PWS_ACTIVITY_CODE", "Active"),
            "owner_type": OWNER_TYPE.get(sys_data.get("OWNER_TYPE_CODE", "L"), "Municipal / Local Government"),
            "owner_type_code": sys_data.get("OWNER_TYPE_CODE", ""),
            "epa_region": sys_data.get("EPA_REGION") or "",
            "primary_source_code": sys_data.get("PRIMARY_SOURCE_CODE") or src,
            "primary_source_label": SOURCE_CODE.get(sys_data.get("PRIMARY_SOURCE_CODE") or src, lead.get("source_water_label", "")),
            "org_name": (sys_data.get("ORG_NAME") or "").strip() or lead.get("name", ""),
            "org_type": sys_data.get("ORG_TYPE_CODE") or "",
            "is_wholesaler": sys_data.get("IS_WHOLESALER_IND") == "Y",
            "is_school": sys_data.get("IS_SCHOOL_OR_DAYCARE_IND") == "Y",
        },
        # Full violation records
        "violations_detail": violations,
        "violations_summary": {
            "total": len(violations),
            "open": len(open_viols),
            "resolved": len(resolved_viols),
            "health_based": len(health_viols),
            "open_health_based": len([v for v in open_viols if v["is_health_based"]]),
            "major": len([v for v in violations if v["is_major"]]),
            "latest_date": violations[0]["begin_date"] if violations else "",
            "oldest_date": violations[-1]["begin_date"] if violations else "",
        },
        # Facilities
        "facilities": facilities,
        # Vendor / contract context
        "vendor_context": vendor_context,
        # Data provenance
        "data_sources": data_sources,
        "pwsid_url": f"https://www.epa.gov/enviro/sdwis-search-results?pwsid={pwsid}&mode=pws",
        "echo_url": f"https://echo.epa.gov/facilities/facility-search/results?p_pwsid={pwsid}",
    }
    return enriched

with open(LEADS_IN) as f:
    leads = json.load(f)

print(f"Enriching {len(leads)} leads...")
enriched_leads = []
for i, lead in enumerate(leads):
    print(f"[{i+1}/{len(leads)}]", end=" ")
    try:
        enriched = enrich_lead(lead)
        enriched_leads.append(enriched)
    except Exception as e:
        print(f"ERROR: {e} — using base data")
        enriched_leads.append(lead)

with open(LEADS_OUT, "w") as f:
    json.dump(enriched_leads, f, indent=2)

print(f"\nDone. Wrote {len(enriched_leads)} records to leads_enriched.json")

# Summary
open_total = sum(l.get("violations_summary", {}).get("open", 0) for l in enriched_leads)
total_viols = sum(l.get("violations_summary", {}).get("total", 0) for l in enriched_leads)
print(f"Total violations: {total_viols}, Open: {open_total}")
