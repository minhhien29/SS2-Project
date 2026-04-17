import base64
import io
import time

import requests
from fastapi import HTTPException
from PIL import Image
from requests.exceptions import ChunkedEncodingError, RequestException

from core.config import PROMPT_SUGGEST_MODEL, headers, prompt_suggest_client


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
