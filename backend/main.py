import io
import requests
import uvicorn
import base64
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from PIL import Image
import uuid
import os
from dotenv import load_dotenv
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. KẾT NỐI SUPABASE (DÙNG SECRET KEY ĐỂ LƯU HISTORY) ---
load_dotenv()

# 2. Lấy giá trị ra bằng os.getenv
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HF_TOKEN = os.getenv("HF_TOKEN")
API_URL = os.getenv("API_URL")

# 3. Khởi tạo Client (Giữ nguyên logic cũ)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

# Cấu hình headers cho AI
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

# --- 3. AUTH ROUTES ---
@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    print(f"🔑 System Authorization: Checking: {email}")
    try:
        query = supabase.table("users_table").select("*").eq("email", email).eq("password", password).execute()
        if not query.data:
            raise HTTPException(status_code=401, detail="Invalid email or password!")
        user = query.data[0]
        return {
            "status": "success",
            "fullname": user.get('fullname', 'Developer'),
            "email": user.get('email')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register")
async def register(fullname: str = Form(...), email: str = Form(...), password: str = Form(...)):
    # --- KIỂM TRA ĐIỀU KIỆN Ở BACKEND ---
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Email không hợp lệ!")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu quá ngắn (tối thiểu 6 ký tự)!")

    try:
        # Kiểm tra xem email đã tồn tại chưa
        check_user = supabase.table("users_table").select("*").eq("email", email).execute()
        if check_user.data:
            raise HTTPException(status_code=400, detail="Email này đã được đăng ký rồi bà ơi!")

        supabase.table("users_table").insert({
            "fullname": fullname, 
            "email": email, 
            "password": password
        }).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. LẤY LỊCH SỬ (HISTORY) ---
@app.get("/get-history")
async def get_history(email: str):
    try:
        # Lấy dữ liệu từ bảng history_table bà đã tạo bằng SQL
        response = supabase_admin.table("history_table").select("*").eq("user_email", email).order("created_at", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- 5. ENGINE VẼ ẢNH & TỰ ĐỘNG LƯU LỊCH SỬ ---
# --- 5. ENGINE VẼ ẢNH & TỰ ĐỘNG LƯU LỊCH SỬ ---
@app.post("/edit-image")
async def edit_image(text: str = Form(...), email: str = Form(...), image: UploadFile = File(...)):
    try:
        # 1. ĐỌC DỮ LIỆU ẢNH GỐC BÀ VỪA UP
        ref_content = await image.read()
        
        # Tạo tên file duy nhất để không bị đè nhau
        ref_filename = f"original_{uuid.uuid4()}.png"

        # 2. ĐẨY ẢNH GỐC LÊN KHO (STORAGE)
        # (Giả sử bà đã tạo bucket tên là 'history_images')
        supabase_admin.storage.from_("history_images").upload(ref_filename, ref_content)
        
        # Lấy link công khai của ảnh gốc
        ref_url = supabase_admin.storage.from_("history_images").get_public_url(ref_filename)

        # 3. GỌI AI ĐỂ GEN ẢNH (Giữ nguyên logic Hugging Face của bà)
        # Giả sử kết quả là 'result_url'

        # 4. GHI VÀO DATABASE (CHỖ NÀY QUYẾT ĐỊNH NULL HAY KHÔNG)
        supabase_admin.table("history_table").insert({
            "email": email,
            "prompt": text,
            "image_url": result_url,            # Ảnh kết quả
            "reference_image_url": ref_url      # Link ảnh gốc (KHÔNG CÒN NULL NỮA!)
        }).execute()

        return {"status": "success", "image_url": result_url}
    except Exception as e:
        return {"status": "error", "message": str(e)}
if __name__ == "__main__":
    # Chạy cổng 8001 cho ổn định bà nhé
    uvicorn.run(app, host="0.0.0.0", port=8001)