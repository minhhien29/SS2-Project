import os
import time
import base64
import requests
import io
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

from database import init_db, insert_edit_history, fetch_all_history

app = Flask(__name__)
CORS(app)

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY")

if not REPLICATE_API_TOKEN or not GEMINI_API_KEY:
    raise RuntimeError(
        "Missing API keys. Please set REPLICATE_API_TOKEN and GEMINI_API_KEY in your environment."
    )

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

init_db()

FLUX_KONTEXT_MODEL = "black-forest-labs/flux-kontext-pro"


def generate_filename(prefix, original_filename):
    timestamp = int(time.time())
    safe_name  = original_filename.replace(" ", "_")
    return f"{prefix}_{timestamp}_{safe_name}"


def translate_prompt_for_flux(prompt: str) -> str:
    instruction = (
        "You are an expert at writing prompts for FLUX Kontext, an AI image editing model. "
        "The user describes what they want to change in an image (possibly in Vietnamese). "
        "Your job: translate to English and write a precise editing instruction. "
        "Rules:\n"
        "- Start with what to CHANGE (e.g. 'Change the black suit to a red dress')\n"
        "- Then specify what to KEEP (e.g. 'Keep the person face, hair, and pose identical')\n"
        "- Be specific about colors, materials, styles\n"
        "- Keep it under 100 words\n"
        "Return ONLY the English prompt, nothing else."
    )
    response = gemini_model.generate_content(f"{instruction}\n\nUser request: {prompt}")
    return response.text.strip()


def image_to_base64(image_path: str) -> str:
    img = Image.open(image_path).convert("RGB")
    max_size = 1024
    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode()
    return f"data:image/jpeg;base64,{b64}"


def run_flux_kontext(image_path: str, prompt: str) -> bytes:
    image_b64 = image_to_base64(image_path)

    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type":  "application/json",
        "Prefer":        "wait"
    }

    payload = {
        "input": {
            "prompt":            prompt,
            "input_image":       image_b64,
            "output_format":     "png",
            "output_quality":    100,
            "safety_tolerance":  6,
            "prompt_upsampling": True
        }
    }

    resp = requests.post(
        f"https://api.replicate.com/v1/models/{FLUX_KONTEXT_MODEL}/predictions",
        headers=headers,
        json=payload,
        timeout=180
    )
    resp.raise_for_status()
    result = resp.json()

    if result.get("status") not in ("succeeded",) or "output" not in result:
        result = _poll_replicate(result["id"], headers)

    output = result.get("output")
    if not output:
        raise ValueError(f"FLUX Kontext không trả về ảnh. Status: {result.get('status')} | Error: {result.get('error')}")

    img_url  = output if isinstance(output, str) else output[0]
    img_resp = requests.get(img_url, timeout=60)
    img_resp.raise_for_status()
    return img_resp.content


def _poll_replicate(prediction_id: str, headers: dict, max_wait: int = 300) -> dict:
    url      = f"https://api.replicate.com/v1/predictions/{prediction_id}"
    deadline = time.time() + max_wait
    while time.time() < deadline:
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        data   = r.json()
        status = data.get("status")
        print(f"[Replicate] Polling... status={status}")
        if status == "succeeded":
            return data
        if status in ("failed", "canceled"):
            raise ValueError(f"FLUX Kontext {status}: {data.get('error')}")
        time.sleep(3)
    raise TimeoutError(f"Timeout sau {max_wait}s")


def edit_image_pipeline(input_path: str, prompt: str, output_path: str) -> str:
    print(f"[Pipeline] Prompt gốc: {prompt}")

    try:
        en_prompt = translate_prompt_for_flux(prompt)
        print(f"[Gemini] FLUX prompt: {en_prompt}")
    except Exception as e:
        print(f"[Gemini] Lỗi dịch: {e}")
        en_prompt = prompt

    print("[Pipeline] Đang gọi FLUX Kontext...")
    edited_bytes = run_flux_kontext(input_path, en_prompt)

    out_path_png = output_path.rsplit(".", 1)[0] + ".png"
    edited_img   = Image.open(io.BytesIO(edited_bytes))
    edited_img.save(out_path_png, format="PNG")
    print(f"[Pipeline] Đã lưu: {out_path_png}")
    return out_path_png


@app.route("/")
def home():
    return "Flask AI Image Editing Server (FLUX Kontext) is running"


@app.route("/edit", methods=["POST"])
def edit_image():
    image  = request.files.get("image")
    prompt = request.form.get("prompt", "").strip()

    if not image:
        return jsonify({"error": "Image is required."}), 400
    if not prompt:
        return jsonify({"error": "Prompt is required."}), 400

    original_filename = generate_filename("original", image.filename)
    original_path     = os.path.join(UPLOAD_FOLDER, original_filename)
    image.save(original_path)

    edited_filename = generate_filename("edited", image.filename)
    edited_path     = os.path.join(OUTPUT_FOLDER, edited_filename)

    try:
        actual_output_path     = edit_image_pipeline(original_path, prompt, edited_path)
        actual_edited_filename = os.path.basename(actual_output_path)
    except Exception as e:
        print(f"[Error] {e}")
        return jsonify({"error": f"Không thể chỉnh sửa ảnh: {str(e)}"}), 500

    insert_edit_history(original_filename, prompt, actual_edited_filename)

    return jsonify({
        "message":          "Image edited successfully.",
        "edited_image_url": f"http://127.0.0.1:5000/outputs/{actual_edited_filename}"
    })


@app.route("/outputs/<filename>")
def serve_output_image(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)


@app.route("/uploads/<filename>")
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/history", methods=["GET"])
def get_history():
    rows    = fetch_all_history()
    history = []
    for row in rows:
        history.append({
            "id":                 row[0],
            "original_image":     row[1],
            "prompt":             row[2],
            "edited_image":       row[3],
            "created_at":         row[4],
            "original_image_url": f"http://127.0.0.1:5000/uploads/{row[1]}",
            "edited_image_url":   f"http://127.0.0.1:5000/outputs/{row[3]}"
        })
    return jsonify(history)


if __name__ == "__main__":
    print("Starting Flask server with FLUX Kontext...")
    print("Upload folder:", UPLOAD_FOLDER)
app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)
