"""
Focused vendor research — top leads only (Tier 1 + Tier 2), 3 queries each.
"""
import json, time, concurrent.futures
from pathlib import Path

BASE = Path(__file__).parent.parent
FINAL_PATH = BASE / "src/data/leads_final.json"
OUT_PATH   = BASE / "src/data/leads_vendors.json"

def research_vendors(lead: dict) -> dict:
    name  = lead["name"].split("(")[0].strip()
    city  = lead["city"]
    state = lead["state"]
    pwsid = lead["pwsid"]

    result = {"pwsid": pwsid, "vendors": {}, "consulting_firms": [], "chemical_suppliers": [], "public_contracts": [], "timeline_events": []}

    queries = [
        f'"{name}" water {city} {state} GIS OR SCADA OR "asset management" OR Cityworks OR ArcGIS OR Maximo OR Ignition software system 2022 2023 2024',
        f'"{name}" water {city} {state} engineering consultant contract OR "awarded" OR RFP CDM Stantec Weston Veolia Jacobs 2022 2023 2024 2025',
        f'"{name}" water utility {city} {state} 2020 2021 2022 2023 2024 2025 rate OR bond OR capital OR upgrade OR project OR contract OR new system',
    ]

    all_citations = {}
    all_text = []
    for query in queries:
        try:
            data, err = run_composio_tool("COMPOSIO_SEARCH_WEB", {"query": query})
            if err or not data:
                continue
            res = data.get("results") or data.get("data", {}).get("results", {})
            answer = ""
            citations = []
            if isinstance(res, dict):
                answer = res.get("answer", "")
                citations = res.get("citations", []) or res.get("organic_results", [])
            elif isinstance(res, list):
                citations = res
            snippets = []
            for c in citations[:4]:
                url = c.get("url", "") or c.get("link", "")
                text = (c.get("snippet", "") or c.get("content", ""))[:300]
                title = c.get("title", "")
                if url:
                    all_citations[url] = title
                snippets.append(f"[{url}] {title}: {text}")
            all_text.append(answer + " " + " ".join(snippets))
        except:
            pass

    if not all_text:
        return result

    combined = " ".join(all_text)[:9000]

    prompt = f"""Extract vendor/technology/activity data for a water utility from web search results.

Utility: {name} — {city}, {state}

Search text:
{combined}

Return ONLY this JSON (no other text). Only include what is explicitly mentioned. Null/empty for unknowns.

{{
  "vendors": {{
    "gis": {{"product": null, "confidence": "none", "evidence": "", "source_url": null}},
    "scada": {{"product": null, "confidence": "none", "evidence": "", "source_url": null}},
    "asset_management": {{"product": null, "confidence": "none", "evidence": "", "source_url": null}},
    "customer_portal": {{"product": null, "confidence": "none", "evidence": "", "source_url": null}},
    "financial_erp": {{"product": null, "confidence": "none", "evidence": "", "source_url": null}}
  }},
  "consulting_firms": [
    {{"name": "Firm Name", "type": "engineering|IT|compliance|financial", "engagement": "brief description", "year": "2024", "source_url": "url"}}
  ],
  "chemical_suppliers": [
    {{"name": "Supplier", "type": "treatment chemical|lab|equipment", "source_url": "url"}}
  ],
  "public_contracts": [
    {{"description": "brief", "value": "$amount or null", "year": "2024", "vendor": "vendor name", "source_url": "url"}}
  ],
  "timeline_events": [
    {{"year": 2024, "month": "Jan", "event": "one sentence", "category": "capital_project|rate_change|contract|technology|compliance|leadership|other", "source_url": "url"}}
  ]
}}

GIS products: ArcGIS/Esri, QGIS, WaterGEMS, InfoWater, Cityworks GIS.
SCADA products: AVEVA/Wonderware, Ignition, iFIX/GE, WinCC, Telvent OASyS.
Asset mgmt: Cityworks, IBM Maximo, Infor EAM, Lucity, Hansen, Accela.
Customer portal: WaterSmart, MyH2O, SmartBill, UtilityCloud, eGov.
Consulting: CDM Smith, Stantec, Jacobs, Weston & Sampson, Tighe & Bond, Kleinfelder, Veolia, Brown & Caldwell.
Timeline: 2020-2025 only."""

    result_text, err = invoke_llm(prompt)
    if not err and result_text:
        try:
            clean = result_text.strip()
            if "```" in clean:
                clean = "\n".join(l for l in clean.split("\n") if not l.strip().startswith("```"))
            parsed = json.loads(clean.strip())
            for k in ["vendors","consulting_firms","chemical_suppliers","public_contracts","timeline_events"]:
                if k in parsed: result[k] = parsed[k]
        except: pass

    return result


def main():
    leads = json.loads(FINAL_PATH.read_text())

    # Research all — sorted by score so top leads get done first
    leads_sorted = sorted(leads, key=lambda l: l.get("lead_score", 0), reverse=True)

    existing = {}
    if OUT_PATH.exists():
        try:
            existing = {r["pwsid"]: r for r in json.loads(OUT_PATH.read_text())}
            print(f"  Resuming: {len(existing)} already done")
        except: pass

    remaining = [l for l in leads_sorted if l["pwsid"] not in existing]
    print(f"Extended vendor research — {len(remaining)} remaining of {len(leads)} total")
    results = dict(existing)

    for i in range(0, len(remaining), 5):
        batch = remaining[i:i+5]
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
            futures = {ex.submit(research_vendors, lead): lead for lead in batch}
            for fut in concurrent.futures.as_completed(futures):
                lead = futures[fut]
                try:
                    res = fut.result()
                    results[res["pwsid"]] = res
                    contracts = len(res.get("public_contracts", []))
                    timeline = len(res.get("timeline_events", []))
                    consultants = len(res.get("consulting_firms", []))
                    gis = res.get("vendors",{}).get("gis",{}).get("product") or "—"
                    print(f"  [{len(results):2}/{len(leads)}] {lead['pwsid']:12} gis={gis:<18} +{contracts}contracts +{timeline}timeline +{consultants}consultants")
                except Exception as e:
                    print(f"  [{lead['pwsid']}] ERROR: {e}")
                    results[lead["pwsid"]] = {"pwsid": lead["pwsid"]}
        OUT_PATH.write_text(json.dumps(list(results.values()), indent=2))
        time.sleep(0.3)

    print(f"\n✓ Done. {len(results)} utilities.")
    has_gis = sum(1 for r in results.values() if r.get("vendors",{}).get("gis",{}).get("product"))
    has_contracts = sum(1 for r in results.values() if r.get("public_contracts"))
    has_timeline = sum(1 for r in results.values() if r.get("timeline_events"))
    print(f"  GIS found: {has_gis} | Contracts: {has_contracts} | Timeline: {has_timeline}")

if __name__ == "__main__":
    main()
