import base64
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.config import API_URL, supabase_admin
from services.ai_service import build_fallback_prompt, call_hf_inference, suggest_prompt_from_vision

router = APIRouter()


@router.post("/suggest-prompt")
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


@router.post("/edit-image")
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
