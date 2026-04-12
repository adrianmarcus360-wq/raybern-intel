"""
Research billing software, AMI/AMR systems, decision makers, and recent news
for each utility lead. Uses COMPOSIO_SEARCH_WEB + LLM extraction.
"""

import json, sys, time, concurrent.futures
from pathlib import Path

BASE = Path(__file__).parent.parent
LEADS_PATH = BASE / "src/data/leads_enriched.json"
OUT_PATH   = BASE / "src/data/leads_tech.json"


def search_utility_tech(lead: dict) -> dict:
    """Search web for full tech intelligence for one utility."""
    name = lead["name"].split("(")[0].strip()
    city = lead["city"]
    state = lead["state"]
    pwsid = lead["pwsid"]

    results = {
        "pwsid": pwsid,
        "billing_software": None,
        "billing_software_confidence": "none",
        "billing_software_evidence": "",
        "ami_system": None,
        "ami_system_confidence": "none",
        "ami_system_evidence": "",
        "additional_contacts": [],
        "recent_news": [],
        "recent_rfps": [],
        "contract_signals": "",
        "tech_notes": "",
    }

    queries = [
        f'"{name}" {city} {state} water utility billing software OR CIS OR MUNIS OR "customer information" OR meter',
        f'"{name}" water {city} AMI AMR "smart meter" OR Sensus OR Itron OR Neptune OR Badger annual report',
        f'"{name}" water utility {city} {state} director manager contact technology upgrade 2023 2024',
        f'"{name}" {state} water utility news rate increase capital improvement bond 2024 2025',
    ]

    all_text = []
    for query in queries:
        try:
            data, err = run_composio_tool("COMPOSIO_SEARCH_WEB", {"query": query})
            if err or not data:
                continue
            # Parse nested structure
            res = data.get("results") or data.get("data", {}).get("results", {})
            if isinstance(res, dict):
                answer = res.get("answer", "")
                citations = res.get("citations", []) or res.get("organic_results", [])
                snippets = [c.get("snippet", "") + " " + c.get("title", "") for c in citations[:4]]
                all_text.append(answer + " " + " ".join(snippets))
            elif isinstance(res, list):
                snippets = [r.get("content", "") + " " + r.get("title", "") for r in res[:4]]
                all_text.append(" ".join(snippets))
        except Exception:
            pass

    if not all_text:
        return results

    full_text = " ".join(all_text)[:8000]

    prompt = f"""You are a B2B technology research analyst extracting information about a water utility's software stack and recent activity.

Utility: {name} (PWSID: {pwsid}) — {city}, {state}

Web search results:
{full_text}

Extract ONLY what is explicitly mentioned or strongly implied. Do NOT fabricate. Return null for unknown fields.

Return this exact JSON (no other text):
{{
  "billing_software": "product name or null — e.g. Tyler MUNIS, New World Systems, Springbrook, Incode, CentralSquare, OpenGov, Cayenta, Harris Utilities, BS&A, CASELLE, FATHOM, Daffron, SunGard, Oracle, SAP, or null",
  "billing_software_confidence": "high|medium|low|none",
  "billing_software_evidence": "short direct quote or empty string",
  "ami_system": "product name or null — e.g. Sensus FlexNet, Itron OpenWay, Neptune R900/e-CODER, Badger ORION, Master Meter TRACE, Aclara STAR, Elster, Landis+Gyr, Mueller Mi.Net, or null",
  "ami_system_confidence": "high|medium|low|none",
  "ami_system_evidence": "short direct quote or empty string",
  "additional_contacts": [
    {{"name": "full name", "title": "job title", "email": "if found or null", "phone": "if found or null"}}
  ],
  "recent_news": [
    "one-sentence description of relevant news item (rate changes, infrastructure projects, software upgrades, EPA actions, leadership changes)"
  ],
  "recent_rfps": [
    "one-sentence description of any RFP/bid/procurement for software, billing, metering, or technology"
  ],
  "contract_signals": "any evidence of contract renewal cycles, budget allocations, or upcoming tech purchases — 1 sentence or empty",
  "tech_notes": "any other useful technology or operational context — 1-2 sentences or empty"
}}"""

    result_text, err = invoke_llm(prompt)
    if err or not result_text:
        return results

    try:
        clean = result_text.strip()
        if "```" in clean:
            lines = clean.split("\n")
            clean = "\n".join(l for l in lines if not l.strip().startswith("```"))
        parsed = json.loads(clean.strip())
        for k in results:
            if k in parsed and parsed[k] is not None:
                results[k] = parsed[k]
    except Exception as e:
        results["tech_notes"] = f"Parse error: {str(e)[:100]}"

    return results


def main():
    leads = json.loads(LEADS_PATH.read_text())
    print(f"Researching tech intelligence for {len(leads)} utilities...")

    # Resume support
    existing = {}
    if OUT_PATH.exists():
        try:
            existing = {r["pwsid"]: r for r in json.loads(OUT_PATH.read_text())}
            print(f"  Resuming: {len(existing)} already done")
        except:
            pass

    remaining = [l for l in leads if l["pwsid"] not in existing]
    print(f"  Remaining: {len(remaining)}\n")

    results = dict(existing)

    for i in range(0, len(remaining), 4):
        batch = remaining[i:i+4]
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
            futures = {ex.submit(search_utility_tech, lead): lead for lead in batch}
            for fut in concurrent.futures.as_completed(futures):
                lead = futures[fut]
                try:
                    res = fut.result()
                    results[res["pwsid"]] = res
                    billing = res.get("billing_software") or "—"
                    ami = res.get("ami_system") or "—"
                    contacts = len(res.get("additional_contacts", []))
                    news = len(res.get("recent_news", []))
                    print(f"  [{len(results):2}/{len(leads)}] {lead['pwsid']:12} billing={billing:<20} AMI={ami:<20} +{contacts}contacts +{news}news")
                except Exception as e:
                    print(f"  [{lead['pwsid']}] ERROR: {e}")
                    results[lead["pwsid"]] = {"pwsid": lead["pwsid"], "error": str(e)}

        OUT_PATH.write_text(json.dumps(list(results.values()), indent=2))
        time.sleep(0.5)  # brief throttle between batches

    print(f"\n✓ Done. {len(results)} utilities researched.")
    has_billing  = sum(1 for r in results.values() if r.get("billing_software"))
    has_ami      = sum(1 for r in results.values() if r.get("ami_system"))
    has_contacts = sum(1 for r in results.values() if r.get("additional_contacts"))
    has_news     = sum(1 for r in results.values() if r.get("recent_news"))
    has_rfps     = sum(1 for r in results.values() if r.get("recent_rfps"))
    print(f"  Billing system:     {has_billing} found")
    print(f"  AMI/AMR system:     {has_ami} found")
    print(f"  Extra contacts:     {has_contacts} utilities")
    print(f"  Recent news:        {has_news} utilities")
    print(f"  Recent RFPs:        {has_rfps} utilities")


if __name__ == "__main__":
    main()
