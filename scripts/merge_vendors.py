"""Merge vendor research into leads_final.json → leads_v4.json"""
import json
from pathlib import Path

BASE = Path(__file__).parent.parent
FINAL = BASE / "src/data/leads_final.json"
VENDORS = BASE / "src/data/leads_vendors.json"
OUT = BASE / "src/data/leads_v4.json"

leads = json.loads(FINAL.read_text())

vendor_by_pwsid = {}
if VENDORS.exists():
    try:
        vendor_by_pwsid = {r["pwsid"]: r for r in json.loads(VENDORS.read_text())}
    except:
        pass

print(f"Vendor data available: {len(vendor_by_pwsid)} utilities")

for lead in leads:
    v = vendor_by_pwsid.get(lead["pwsid"], {})
    lead["vendor_intel"] = {
        "vendors": v.get("vendors", {}),
        "consulting_firms": v.get("consulting_firms", []),
        "chemical_suppliers": v.get("chemical_suppliers", []),
        "public_contracts": v.get("public_contracts", []),
        "timeline_events": v.get("timeline_events", []),
        "source_urls": v.get("source_urls", {}),
    }

OUT.write_text(json.dumps(leads, indent=2))
print(f"✓ Wrote {len(leads)} leads → leads_v4.json")

# stats
has_gis = sum(1 for l in leads if l["vendor_intel"]["vendors"].get("gis", {}).get("product"))
has_scada = sum(1 for l in leads if l["vendor_intel"]["vendors"].get("scada", {}).get("product"))
has_contracts = sum(1 for l in leads if l["vendor_intel"]["public_contracts"])
has_timeline = sum(1 for l in leads if l["vendor_intel"]["timeline_events"])
print(f"GIS: {has_gis} | SCADA: {has_scada} | Contracts: {has_contracts} | Timeline: {has_timeline}")
