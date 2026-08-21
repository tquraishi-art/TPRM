from fastapi import APIRouter
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_sca():
    return get_client().table("sca_assessments").select("*, sca_findings(*)").execute().data

@router.get("/summary")
def sca_summary():
    rows = get_client().table("sca_assessments").select("overall_risk, compliant_tcs, total_tcs").execute().data
    return {
        "total": len(rows),
        "by_risk": {l: sum(1 for r in rows if r["overall_risk"] == l)
                    for l in ["Very High","High","Moderate","Low"]},
        "compliance_rate": round(
            sum(r["compliant_tcs"] for r in rows if r["compliant_tcs"]) /
            max(sum(r["total_tcs"] for r in rows if r["total_tcs"]), 1) * 100, 1
        ),
    }
