# AI Vision Web App
1. Project name
AI Vision Web App

2. Short description
AI Vision is a web application for AI-assisted image editing. The system includes a React + Vite frontend, a FastAPI backend, Supabase for authentication and data storage, and Hugging Face Inference API for AI-based prompt suggestion and image generation.
This source code is prepared so that a grader can unzip the project, read this file, configure the required services, and run the full system from a clean machine.

3.  Member list
- Nguyen Minh Hien - 2301140032 - 3C23C
- Tran Thi Quynh Anh - 2301140008 - 2C23C
- Tran Thi Bich Phuong - 2301140080 - 3C23C

4.  Tech stack
- Frontend: React 19, Vite, Tailwind CSS, Lucide React
- Backend: FastAPI, Uvicorn
- Database/Auth/Storage: Supabase
- AI provider: Hugging Face Inference API
- Deployment: Vercel

5.  Main features
- Register and sign in with email and password
- Sign in with Google through Supabase Auth
- Forgot password and password reset flow
- Upload a reference image
- Generate a suggested prompt from the reference image
- Generate an AI image from a prompt
- Save generation history
- View previous prompts and generated images

6.  Overall project structure
```text
web1/
|-- ai-gen/                     #Frontend React + Vite app
|   |-- src/
|   |-- public/
|   |-- .env.example
|   |-- package.json
|   `-- vite.config.js
|-- backend/                    #FastAPI backend
|   |-- core/
|   |-- routes/
|   |-- services/
|   |-- .env.example
|   |-- main.py
|   `-- requirements.txt
|-- api/
|   `-- index.py                #Vercel Python entry point
|-- requirements.txt            #Root Python requirements
|-- vercel.json                 #Vercel build and routing config
`-- README.md
```

7.  Installation steps and required tools
Required tools:
- Node.js 18 or newer
- npm 9 or newer
- Python 3.10 or newer
- A Supabase project
- A Hugging Face token

Recommended versions:
- Node.js 20 LTS
- Python 3.11

## Environment variable setup using `.env.example`
This project uses two separate environment files:

- frontend: `ai-gen/.env`
- backend: `backend/.env`
Two example files are already included:

- [ai-gen/.env.example](</c:/Users/Minh%20Hien/IdeaProjects/web1/ai-gen/.env.example:1>)
- [backend/.env.example](</c:/Users/Minh%20Hien/IdeaProjects/web1/backend/.env.example:1>)
Copy them before running the project.

Windows CMD:

```cmd
copy ai-gen\.env.example ai-gen\.env
copy backend\.env.example backend\.env
```

Windows PowerShell:

```powershell
Copy-Item ai-gen\.env.example ai-gen\.env
Copy-Item backend\.env.example backend\.env
```

macOS or Linux:

```bash
cp ai-gen/.env.example ai-gen/.env
cp backend/.env.example backend/.env
```

### Frontend `.env`

Expected variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=/api
VITE_APP_BASE_URL=http://localhost:5173
```

### Backend `.env`

Expected variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HF_TOKEN=your_huggingface_token
API_URL=your_image_generation_endpoint
FRONTEND_URL=http://localhost:5173
PROMPT_SUGGEST_PROVIDER=novita
PROMPT_SUGGEST_MODEL=google/gemma-4-26B-A4B-it
```
8.  How to run backend

From the project root:

```bash
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows CMD:

```cmd
.venv\Scripts\activate.bat
```

macOS or Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001
```

Backend URL:

- `http://127.0.0.1:8001`

9.  How to run frontend

Open another terminal:

```bash
cd ai-gen
npm install
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
```

Run the frontend:

```bash
npm run dev
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

Frontend URL:

- `http://localhost:5173`

## How to set up or migrate/seed the database

Before running the app, prepare Supabase manually.

### 1. Create a Supabase project

Collect these values:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Create the storage bucket

Create this bucket:

- `history_images`

Recommended:

- set it to public so the app can read image public URLs

### 3. Create the database tables

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.users_table (
  id bigint generated always as identity primary key,
  fullname text not null,
  email text not null unique,
  password text,
  created_at timestamp with time zone default now()
);

create table if not exists public.history_table (
  id bigint generated always as identity primary key,
  user_email text not null,
  prompt text not null,
  image_url text not null,
  reference_image_url text,
  created_at timestamp with time zone default now()
);
```

### 4. Configure authentication

Set the Supabase Auth site URL and redirect URLs to include:

- `http://localhost:5173`
- `http://localhost:5173/reset-password`
- `https://your-project.vercel.app`
- `https://your-project.vercel.app/reset-password`

If Google sign-in is used:

- enable Google provider in Supabase Auth
- add the Google OAuth client ID and client secret

### 5. Seed data

There is no automatic seed script in this repository.

To create demo data:

- register a new account through the app
- or create a user manually in Supabase Auth and `users_table`
- use the app to create generation history records in `history_table`

10.  How to run the full system from a clean machine
Use this order on a fresh machine:

1. Install Node.js and Python.
2. Unzip the source code folder.
3. Open the project root folder.
4. Copy `ai-gen/.env.example` to `ai-gen/.env`.
5. Copy `backend/.env.example` to `backend/.env`.
6. Fill in all required environment variable values.
7. Prepare Supabase project, tables, bucket, and Auth redirect URLs.
8. Create and activate a Python virtual environment.
9. Run `pip install -r requirements.txt`.
10. Start backend with `uvicorn backend.main:app --reload --host 127.0.0.1 --port 8001`. <python main.py>
11. Open a second terminal.
12. Go to `ai-gen`.
13. Run `npm install`.
14. Run `npm run dev`.
15. Open `http://localhost:5173`.

Recommended quick test after startup:
- register a new account
- sign in
- try forgot password
- upload a reference image
- generate a prompt suggestion
- generate an image
- check history

## Demo account, if login is required

Login is required for the main features.

Current demo approach:

- the grader can create a new account directly from the Register screen

If a fixed demo account is required by the instructor, replace this section with a real test account before submission, for example:

- Email: `nem@gmail.com`
- Password: `hien1234`

Use only a separate testing account, not a personal account.

## Known issues

- Supabase free-tier projects may go to sleep, so the first request can be slow or fail
- Password reset must be opened in the same browser where the reset flow was started
- The project depends on external services, so missing Supabase or Hugging Face credentials will break backend features
- PowerShell may block `npm`; in that case use `npm.cmd`
- If Vercel environment variables are missing, the deployed frontend may load while backend features fail

## Additional notes for submission

- The zip file must contain the full source code, not only a GitHub link
- Do not include `node_modules/`
- Do not include `.venv/`
- Do not include `.env`
- Do not include log, cache, or large unnecessary build files
- Keep `.env.example` in the submitted source code folder

