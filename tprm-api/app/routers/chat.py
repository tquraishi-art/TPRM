from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import anthropic
from app.core.config import settings
from app.core.supabase import get_client

router = APIRouter()

SYSTEM_PROMPT = """You are a Third-Party Risk Management (TPRM) analyst assistant.
You have access to live data from the TPRM platform including:
- Vendor risk register (risks, residual scores, treatment status)
- Supplier Business Reviews (SBR scores, sub-dimension ratings, diversity)
- Supplier Compliance Assessments (SCA / PwC audit findings)
- KRI metrics and IRQ scores
- Gartner 2026 TPRM intelligence (continuous monitoring, AI supply chain risk, regulatory changes)

When answering questions:
1. Use the provided data context to give specific, accurate answers
2. Cite supplier names, scores, and dates when relevant
3. Flag risks that need immediate attention (Very High residual, escalations)
4. Be concise but thorough — this is an executive and analyst audience
5. If you don't have enough data to answer confidently, say so clearly

Today's date: 2026-08-21"""

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context_query: Optional[str] = None

def fetch_context(query: str) -> str:
    """Fetch relevant data from Supabase to ground the response."""
    sb = get_client()
    parts = []

    # Always include risk summary
    risks = sb.table("risks").select("title,residual,status,escalation,category").execute().data
    if risks:
        escalations = [r for r in risks if r.get("escalation")]
        vh = [r for r in risks if r.get("residual") == "Very High"]
        parts.append(f"RISK SUMMARY: {len(risks)} total risks. "
                     f"{len(vh)} Very High residual. "
                     f"{len(escalations)} escalations requiring action.")
        if vh:
            parts.append("VERY HIGH RISKS: " + "; ".join(r["title"] for r in vh[:5]))

    # SBR summary
    sbr = sb.table("sbr_scores").select("name,perf_score,fiscal_year,quarter,risk_rating").order("fiscal_year", desc=True).limit(20).execute().data
    if sbr:
        scored = [r for r in sbr if r["perf_score"] is not None]
        if scored:
            avg = sum(r["perf_score"] for r in scored) / len(scored)
            low = [r for r in scored if r["perf_score"] < 3.0]
            parts.append(f"SBR SCORES (latest 20): avg perf {avg:.2f}/5.0. "
                         f"Needs attention (<3.0): {', '.join(r['name'] for r in low) or 'none'}")

    # Query-specific context
    q = query.lower() if query else ""
    if any(w in q for w in ["vendor","supplier","cbre","jll","cushman","cisco","dell"]):
        vendors = sb.table("vendors").select("name,criticality,residual_risk,risk_rating").limit(20).execute().data
        if vendors:
            parts.append("VENDORS: " + "; ".join(
                f"{v['name']} (criticality:{v.get('criticality','?')}, risk:{v.get('residual_risk','?')})"
                for v in vendors[:10]
            ))

    if any(w in q for w in ["kri","monitor","metric","threshold"]):
        kri = sb.table("kri_metrics").select("name,status,value,threshold_red").execute().data
        if kri:
            red = [k for k in kri if k.get("status") == "Red"]
            parts.append(f"KRI STATUS: {len(red)} metrics in Red. " +
                         ("; ".join(k["name"] for k in red) if red else ""))

    return "\n\n".join(parts) if parts else "No specific data context available."

@router.post("/")
async def chat(req: ChatRequest):
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    context = fetch_context(req.context_query or (req.messages[-1].content if req.messages else ""))

    system = SYSTEM_PROMPT + f"\n\n--- LIVE DATA CONTEXT ---\n{context}\n--- END CONTEXT ---"

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
    )

    return {
        "response": response.content[0].text,
        "usage": {"input": response.usage.input_tokens, "output": response.usage.output_tokens},
    }
