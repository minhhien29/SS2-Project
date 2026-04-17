import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from supabase import Client, create_client

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
