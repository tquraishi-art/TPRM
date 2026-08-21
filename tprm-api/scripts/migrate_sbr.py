"""
Migrate SBR data from index.html JS arrays → Supabase sbr_scores table.
Usage:
  pip install supabase python-dotenv
  SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=service_role_key python migrate_sbr.py
"""
import os, re, json, ast
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
sb  = create_client(url, key)

# ── Parse SBR_DATA out of index.html ────────────────────────────────────────
html_path = os.path.join(os.path.dirname(__file__), "../../index.html")
with open(html_path, encoding="utf-8") as f:
    html = f.read()

m = re.search(r"const SBR_DATA\s*=\s*(\[.*?\]);\s*\n", html, re.DOTALL)
if not m:
    raise ValueError("Could not find SBR_DATA in index.html")

# JS → Python: replace JS null with None, true/false with Python equivalents
raw = m.group(1)
raw = re.sub(r'\bnull\b', 'None', raw)
raw = re.sub(r'\btrue\b', 'True', raw)
raw = re.sub(r'\bfalse\b', 'False', raw)

records = ast.literal_eval(raw)
print(f"Parsed {len(records)} SBR records")

def safe_num(v):
    try: return float(v) if v not in (None, 'counted', '') else None
    except: return None

def safe_date(v):
    if not v or v in ('', '??', 'N/A'): return None
    try:
        from datetime import datetime
        for fmt in ('%m/%d/%Y', '%m/%d/%y', '%-m/%-d/%Y'):
            try: return datetime.strptime(str(v), fmt).date().isoformat()
            except: pass
    except: pass
    return None

rows = []
for r in records:
    rows.append({
        "supplier_id":    r.get("id"),
        "name":           r.get("name"),
        "name_clean":     r.get("nameClean"),
        "fiscal_year":    r.get("fy"),
        "quarter":        r.get("qt", "").strip(),
        "sbr_date":       safe_date(r.get("date")),
        "sourcing_lead":  r.get("lead"),
        "portfolio":      r.get("pf"),
        "family":         r.get("fam"),
        "commodity":      r.get("commodity"),
        "spend_prev_year": int(r["spendPrev"]) if isinstance(r.get("spendPrev"), int) else None,
        "perf_score":     safe_num(r.get("perf")),
        "sustainability": safe_num(r.get("sust")),
        "vos_nps":        safe_num(r.get("vos")),
        "cost_value":     safe_num(r.get("cost")),
        "timeliness":     safe_num(r.get("time")),
        "quality":        safe_num(r.get("qual")),
        "partnership":    safe_num(r.get("partner")),
        "innovation":     safe_num(r.get("innov")),
        "risk_compliance":safe_num(r.get("riskScore")),
        "sust_diversity": safe_num(r.get("sustScore")),
        "diverse":        r.get("diverse"),
        "risk_rating":    r.get("risk"),
    })

# Insert in batches of 50
BATCH = 50
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    res = sb.table("sbr_scores").upsert(batch, on_conflict="supplier_id,fiscal_year,quarter").execute()
    print(f"  Inserted rows {i+1}–{min(i+BATCH, len(rows))}")

print("✅ SBR migration complete")
