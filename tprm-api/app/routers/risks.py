from fastapi import APIRouter, Query
from typing import Optional
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_risks(
    residual:   Optional[str] = None,
    status:     Optional[str] = None,
    category:   Optional[str] = None,
    escalation: Optional[bool] = None,
    search:     Optional[str] = None,
    limit: int  = Query(100, le=500),
    offset: int = 0,
):
    sb = get_client()
    q = sb.table("risks").select("*, vendors(name)").order("created_at", desc=True)
    if residual:   q = q.eq("residual", residual)
    if status:     q = q.eq("status", status)
    if category:   q = q.eq("category", category)
    if escalation is not None: q = q.eq("escalation", escalation)
    if search:     q = q.ilike("title", f"%{search}%")
    q = q.range(offset, offset + limit - 1)
    return q.execute().data

@router.get("/summary")
def risk_summary():
    sb = get_client()
    rows = sb.table("risks").select("residual, status, escalation").execute().data
    levels = ["Very High","High","Moderate","Low","Very Low"]
    return {
        "total": len(rows),
        "by_residual": {l: sum(1 for r in rows if r["residual"] == l) for l in levels},
        "escalations": sum(1 for r in rows if r.get("escalation")),
        "open": sum(1 for r in rows if r.get("status") == "Open"),
    }

@router.get("/{risk_id}")
def get_risk(risk_id: str):
    sb = get_client()
    return sb.table("risks").select("*, vendors(name)").eq("id", risk_id).single().execute().data

@router.post("/")
def create_risk(data: dict):
    sb = get_client()
    return sb.table("risks").insert(data).execute().data

@router.patch("/{risk_id}")
def update_risk(risk_id: str, data: dict):
    sb = get_client()
    return sb.table("risks").update(data).eq("id", risk_id).execute().data
