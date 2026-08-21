from fastapi import APIRouter, Query
from typing import Optional
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_sbr(
    fy:       Optional[int]  = None,
    quarter:  Optional[str]  = None,
    portfolio:Optional[str]  = None,
    diverse:  Optional[str]  = None,
    risk:     Optional[str]  = None,
    search:   Optional[str]  = None,
    limit:    int = Query(200, le=500),
    offset:   int = 0,
):
    sb = get_client()
    q = sb.table("sbr_scores").select("*")
    if fy:        q = q.eq("fiscal_year", fy)
    if quarter:   q = q.eq("quarter", quarter)
    if portfolio: q = q.eq("portfolio", portfolio)
    if diverse:   q = q.eq("diverse", diverse)
    if risk:      q = q.eq("risk_rating", risk)
    if search:    q = q.ilike("name", f"%{search}%")
    q = q.order("fiscal_year", desc=True).order("quarter", desc=True)
    q = q.range(offset, offset + limit - 1)
    return q.execute().data

@router.get("/summary")
def sbr_summary():
    sb = get_client()
    rows = sb.table("sbr_scores").select("perf_score, diverse, risk_rating").execute().data
    scored = [r for r in rows if r["perf_score"] is not None]
    avg = round(sum(r["perf_score"] for r in scored) / len(scored), 2) if scored else None
    return {
        "total":         len(rows),
        "with_score":    len(scored),
        "avg_perf":      avg,
        "excellent":     sum(1 for r in scored if r["perf_score"] >= 4.0),
        "needs_attention": sum(1 for r in scored if r["perf_score"] < 3.0),
        "diverse":       sum(1 for r in rows if (r.get("diverse") or "").lower() == "diverse"),
    }

@router.get("/{record_id}")
def get_sbr(record_id: str):
    sb = get_client()
    return sb.table("sbr_scores").select("*").eq("id", record_id).single().execute().data
