import uuid

from fastapi import APIRouter, Form, HTTPException

from core.config import FRONTEND_URL, supabase, supabase_admin
from services.auth_service import find_auth_user_by_email

router = APIRouter()


@router.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    try:
        try:
            auth_response = supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            if auth_response.user:
                profile_query = (
                    supabase.table("users_table")
                    .select("*")
                    .eq("email", email)
                    .execute()
                )
                profile = profile_query.data[0] if profile_query.data else {}
                if profile_query.data:
                    (
                        supabase_admin.table("users_table")
                        .update({"password": password})
                        .eq("email", email)
                        .execute()
                    )
                else:
                    supabase_admin.table("users_table").insert(
                        {
                            "fullname": auth_response.user.user_metadata.get("full_name", "Developer"),
                            "email": email,
                            "password": password,
                        }
                    ).execute()

                return {
                    "status": "success",
                    "fullname": profile.get("fullname")
                    or auth_response.user.user_metadata.get("full_name")
                    or "Developer",
                    "email": email,
                }
        except Exception:
            pass

        query = (
            supabase.table("users_table")
            .select("*")
            .eq("email", email)
            .eq("password", password)
            .execute()
        )
        if not query.data:
            raise HTTPException(status_code=401, detail="Invalid email or password!")

        user = query.data[0]

        auth_user = find_auth_user_by_email(email)
        if not auth_user:
            supabase_admin.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"full_name": user.get("fullname", "Developer")},
                }
            )

        return {
            "status": "success",
            "fullname": user.get("fullname", "Developer"),
            "email": user.get("email"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/register")
async def register(
    fullname: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
):
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Email khong hop le!")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Mat khau toi thieu 6 ky tu!")

    try:
        check_user = supabase.table("users_table").select("*").eq("email", email).execute()
        if check_user.data:
            raise HTTPException(status_code=400, detail="Email nay da duoc dang ky roi!")

        if find_auth_user_by_email(email):
            raise HTTPException(status_code=400, detail="This email is already registered!")

        supabase_admin.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": fullname},
            }
        )

        supabase.table("users_table").insert(
            {"fullname": fullname, "email": email, "password": password}
        ).execute()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/forgot-password")
async def forgot_password(email: str = Form(...), redirect_to: str = Form(...)):
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email format!")

    try:
        check_user = supabase_admin.table("users_table").select("*").eq("email", email).execute()
        if not check_user.data:
            raise HTTPException(status_code=404, detail="No account was found for this email address.")

        auth_user = find_auth_user_by_email(email)
        if not auth_user:
            supabase_admin.auth.admin.create_user(
                {
                    "email": email,
                    "password": str(uuid.uuid4()),
                    "email_confirm": True,
                    "user_metadata": {"full_name": check_user.data[0].get("fullname", "Developer")},
                }
            )

        final_redirect_url = FRONTEND_URL or redirect_to
        supabase.auth.reset_password_for_email(email, {"redirect_to": final_redirect_url})
        return {"status": "success", "message": "A password reset link has been sent to your email."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
