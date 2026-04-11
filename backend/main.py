import base64
import os
import uuid

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client, create_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")
API_URL = os.getenv("API_URL")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

headers = {"Authorization": f"Bearer {HF_TOKEN}"}


@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    try:
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
        return {
            "status": "success",
            "fullname": user.get("fullname", "Developer"),
            "email": user.get("email"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/register")
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

        supabase.table("users_table").insert(
            {"fullname": fullname, "email": email, "password": password}
        ).execute()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/get-history")
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


@app.post("/edit-image")
async def edit_image(
    text: str = Form(...),
    email: str = Form(...),
    image: UploadFile = File(...),
):
    try:
        ref_content = await image.read()
        if not ref_content:
            raise HTTPException(status_code=400, detail="Reference image is empty.")

        ref_filename = f"original_{uuid.uuid4()}.png"
        supabase_admin.storage.from_("history_images").upload(ref_filename, ref_content)
        ref_url = supabase_admin.storage.from_("history_images").get_public_url(ref_filename)

        ai_response = requests.post(
            API_URL,
            headers={**headers, "Content-Type": "application/json", "Accept": "image/png"},
            json={"inputs": text},
            timeout=120,
        )

        if ai_response.status_code != 200:
            raise HTTPException(status_code=ai_response.status_code, detail=ai_response.text)

        content_type = ai_response.headers.get("content-type", "")
        if "application/json" in content_type:
            raise HTTPException(status_code=502, detail=ai_response.text)

        result_content = ai_response.content
        if not result_content:
            raise HTTPException(status_code=502, detail="AI service returned an empty image.")

        result_url = f"data:image/png;base64,{base64.b64encode(result_content).decode('utf-8')}"

        supabase_admin.table("history_table").insert(
            {
                "user_email": email,
                "prompt": text,
                "image_url": result_url,
                "reference_image_url": ref_url,
            }
        ).execute()

        return {"status": "success", "image_url": result_url}
    except HTTPException as exc:
        return {"status": "error", "message": exc.detail}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
