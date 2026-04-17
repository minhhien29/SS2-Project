from fastapi import APIRouter

from core.config import supabase_admin

router = APIRouter()


@router.get("/get-history")
async def get_history(email: str):
    try:
        response = (
            supabase_admin.table("history_table")
            .select("*")
            .eq("user_email", email)
            .order("created_at", desc=True)
            .execute()
        )
        return {"status": "success", "data": response.data}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
