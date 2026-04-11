import base64
import io
import json
import os
import time
import uuid

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from PIL import Image
from requests.exceptions import ChunkedEncodingError, RequestException
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
FRONTEND_URL = os.getenv("FRONTEND_URL")
PROMPT_SUGGEST_PROVIDER = os.getenv("PROMPT_SUGGEST_PROVIDER", "novita")
PROMPT_SUGGEST_MODEL = os.getenv("PROMPT_SUGGEST_MODEL", "google/gemma-4-26B-A4B-it")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

headers = {"Authorization": f"Bearer {HF_TOKEN}"}
prompt_suggest_client = InferenceClient(provider=PROMPT_SUGGEST_PROVIDER, api_key=HF_TOKEN)


def find_auth_user_by_email(email: str):
    page = 1
    while True:
      users = supabase_admin.auth.admin.list_users(page=page, per_page=200)
      if not users:
          return None

      for user in users:
          if getattr(user, "email", None) == email:
              return user

      if len(users) < 200:
          return None

      page += 1


def call_hf_inference(url: str, *, data=None, json_body=None, content_type=None, accept=None, retries: int = 4):
    request_headers = dict(headers)
    if content_type:
        request_headers["Content-Type"] = content_type
    if accept:
        request_headers["Accept"] = accept

    last_error = None
    for attempt in range(retries):
        try:
            response = requests.post(
                url,
                headers=request_headers,
                data=data,
                json=json_body,
                timeout=120,
            )

            if response.status_code == 503 and attempt < retries - 1:
                time.sleep(4)
                continue

            return response
        except (ChunkedEncodingError, RequestException) as exc:
            last_error = exc
            if attempt == retries - 1:
                break
            time.sleep(2)

    raise HTTPException(
        status_code=502,
        detail=f"AI service connection failed. Please try again. ({last_error})",
    )


def build_fallback_prompt(image_content: bytes):
    with Image.open(io.BytesIO(image_content)) as img:
        width, height = img.size

    if width >= height * 1.2:
        caption = "a wide scene with the same main subject and environment"
        composition = "preserve the wide landscape composition"
    elif height >= width * 1.2:
        caption = "a vertical portrait-style scene with the same main subject"
        composition = "preserve the tall portrait framing"
    else:
        caption = "a centered subject with balanced composition"
        composition = "preserve the balanced framing and subject placement"

    prompt_suggestion = (
        f"Keep the same main subject and visual identity from the reference image, featuring {caption}; "
        f"{composition}, improve the lighting and contrast, sharpen the important details, refine the colors, "
        "and generate a clean high-quality final image."
    )

    return caption, prompt_suggestion


def suggest_prompt_from_vision(image_content: bytes, content_type: str | None):
    image_data_url = (
        f"data:{content_type or 'image/png'};base64,"
        f"{base64.b64encode(image_content).decode('utf-8')}"
    )
    response = prompt_suggest_client.chat.completions.create(
        model=PROMPT_SUGGEST_MODEL,
        max_tokens=140,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Look at this reference image and describe its main subject, composition, "
                            "visual style, and notable details in one concise sentence for an image editing prompt."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data_url},
                    },
                ],
            }
        ],
    )

    caption = (response.choices[0].message.content or "").strip()
    if not caption:
        raise HTTPException(status_code=502, detail="Prompt suggestion service returned an empty caption.")

    caption = caption.replace("\n", " ").strip().strip('"').rstrip(".")
    prompt_suggestion = (
        f"Keep the same core subject and composition from the reference image: {caption}. "
        "Enhance the lighting, sharpen key details, improve color balance, and produce a polished high-quality final image."
    )

    return caption, prompt_suggestion


@app.post("/login")
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


@app.post("/forgot-password")
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


@app.post("/suggest-prompt")
async def suggest_prompt(image: UploadFile = File(...)):
    image_content = b""
    try:
        image_content = await image.read()
        if not image_content:
            raise HTTPException(status_code=400, detail="Reference image is empty.")
        cleaned_caption, prompt_suggestion = suggest_prompt_from_vision(
            image_content,
            image.content_type,
        )

        return {
            "status": "success",
            "caption": cleaned_caption,
            "suggested_prompt": prompt_suggestion,
        }
    except HTTPException as exc:
        if image_content and exc.status_code >= 500:
            fallback_caption, fallback_prompt = build_fallback_prompt(image_content)
            print(f"Prompt suggestion fallback activated: {exc.detail}")
            return {
                "status": "success",
                "caption": fallback_caption,
                "suggested_prompt": fallback_prompt,
                "fallback": True,
            }
        return {"status": "error", "message": exc.detail}
    except Exception as exc:
        if image_content:
            fallback_caption, fallback_prompt = build_fallback_prompt(image_content)
            print(f"Prompt suggestion fallback activated: {exc}")
            return {
                "status": "success",
                "caption": fallback_caption,
                "suggested_prompt": fallback_prompt,
                "fallback": True,
            }
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

        ai_response = call_hf_inference(
            API_URL,
            json_body={"inputs": text},
            content_type="application/json",
            accept="image/png",
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
