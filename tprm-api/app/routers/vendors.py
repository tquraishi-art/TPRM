from fastapi import APIRouter, Query
from typing import Optional
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_vendors(
    criticality: Optional[str] = None,
    risk_rating: Optional[str] = None,
    portfolio:   Optional[str] = None,
    search:      Optional[str] = None,
    limit: int   = Query(100, le=500),
    offset: int  = 0,
):
    sb = get_client()
    q = sb.table("vendors").select("*")
    if criticality: q = q.eq("criticality", criticality)
    if risk_rating: q = q.eq("risk_rating", risk_rating)
    if portfolio:   q = q.eq("portfolio", portfolio)
    if search:      q = q.ilike("name", f"%{search}%")
    q = q.range(offset, offset + limit - 1)
    return q.execute().data

@router.get("/{vendor_id}")
def get_vendor(vendor_id: str):
    sb = get_client()
    vendor = sb.table("vendors").select("*").eq("id", vendor_id).single().execute().data
    risks   = sb.table("risks").select("*").eq("vendor_id", vendor_id).execute().data
    sbr     = sb.table("sbr_scores").select("*").eq("vendor_id", vendor_id).order("fiscal_year", desc=True).execute().data
    return {"vendor": vendor, "risks": risks, "sbr_history": sbr}
