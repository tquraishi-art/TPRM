from fastapi import APIRouter
from app.core.supabase import get_client

router = APIRouter()

@router.get("/")
def list_irq():
    return get_client().table("irq_scores").select("*, vendors(name)").order("assessment_date", desc=True).execute().data

@router.get("/{irq_id}")
def get_irq(irq_id: str):
    return get_client().table("irq_scores").select("*, vendors(*)").eq("id", irq_id).single().execute().data
