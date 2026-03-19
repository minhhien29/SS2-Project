import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageOps, ImageDraw

from database import init_db, insert_edit_history, fetch_all_history

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")

if os.path.exists(UPLOAD_FOLDER) and not os.path.isdir(UPLOAD_FOLDER):
    os.remove(UPLOAD_FOLDER)

if os.path.exists(OUTPUT_FOLDER) and not os.path.isdir(OUTPUT_FOLDER):
    os.remove(OUTPUT_FOLDER)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

init_db()


def generate_filename(prefix, original_filename):
    timestamp = int(time.time())
    safe_name = original_filename.replace(" ", "_")
    return f"{prefix}_{timestamp}_{safe_name}"


def mock_edit_image(input_path, prompt, output_path):
    image = Image.open(input_path).convert("RGB")
    prompt_lower = prompt.lower()

    if "grayscale" in prompt_lower or "black and white" in prompt_lower:
        image = ImageOps.grayscale(image).convert("RGB")
    elif "bright" in prompt_lower or "brightness" in prompt_lower:
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.4)
    elif "contrast" in prompt_lower:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
    elif "invert" in prompt_lower:
        image = ImageOps.invert(image)
    else:
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.2)

    draw = ImageDraw.Draw(image)
    text = f"Prompt: {prompt}"
    draw.rectangle((10, 10, image.width - 10, 45), fill=(0, 0, 0))
    draw.text((20, 18), text[:80], fill=(255, 255, 255))

    image.save(output_path)


@app.route("/")
def home():
    return "Flask server is running"


@app.route("/edit", methods=["POST"])
def edit_image():
    image = request.files.get("image")
    prompt = request.form.get("prompt", "").strip()

    if not image:
        return jsonify({"error": "Image is required."}), 400

    if not prompt:
        return jsonify({"error": "Prompt is required."}), 400

    original_filename = generate_filename("original", image.filename)
    original_path = os.path.join(UPLOAD_FOLDER, original_filename)
    image.save(original_path)

    edited_filename = generate_filename("edited", image.filename)
    edited_path = os.path.join(OUTPUT_FOLDER, edited_filename)

    mock_edit_image(original_path, prompt, edited_path)
    insert_edit_history(original_filename, prompt, edited_filename)

    return jsonify({
        "message": "Image edited successfully.",
        "edited_image_url": f"http://127.0.0.1:5000/outputs/{edited_filename}"
    })


@app.route("/outputs/<filename>")
def serve_output_image(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)


@app.route("/uploads/<filename>")
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/history", methods=["GET"])
def get_history():
    rows = fetch_all_history()
    history = []

    for row in rows:
        history.append({
            "id": row[0],
            "original_image": row[1],
            "prompt": row[2],
            "edited_image": row[3],
            "created_at": row[4],
            "original_image_url": f"http://127.0.0.1:5000/uploads/{row[1]}",
            "edited_image_url": f"http://127.0.0.1:5000/outputs/{row[3]}"
        })

    return jsonify(history)


if __name__ == "__main__":
    print("Starting Flask server...")
    print("Upload folder:", UPLOAD_FOLDER)
    print("Output folder:", OUTPUT_FOLDER)
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)