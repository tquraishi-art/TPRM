from fastapi import APIRouter
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_kri():
    return get_client().table("kri_metrics").select("*").order("category").execute().data

@router.get("/status")
def kri_status():
    rows = get_client().table("kri_metrics").select("status").execute().data
    return {
        "red":   sum(1 for r in rows if r["status"] == "Red"),
        "amber": sum(1 for r in rows if r["status"] == "Amber"),
        "green": sum(1 for r in rows if r["status"] == "Green"),
    }
