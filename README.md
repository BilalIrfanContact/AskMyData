# Autonomous Data Analyst

Upload a CSV, ask questions in plain English, and get back answers plus charts. The backend generates Python with GPT, runs it in a restricted sandbox, and returns the result to a clean Next.js UI.

## Features
- CSV upload + preview
- Plain-English analysis with GPT-generated Python
- Sandboxed execution (no `os`, `subprocess`, or filesystem access)
- Optional charts returned as base64 PNG

## Tech Stack
- **Backend:** FastAPI, pandas, matplotlib, seaborn, OpenAI API
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS

## Local Development

### Backend
1. Create `backend/.env` using `backend/.env.example` and add your API key
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Run the server: `PYTHONPATH=. uvicorn backend.main:app --reload`

### Frontend
1. `cd frontend`
2. Create `.env.local` using `.env.local.example`
3. Install dependencies: `npm install`
4. Run the app: `npm run dev`

Open `http://localhost:3000`.

## API Overview
- `POST /upload` — upload CSV, returns preview + schema
- `POST /analyze` — ask a question, returns answer + optional chart
- `GET /health` — health check

## Security Note
Generated Python is executed with restricted globals. Only `pandas`, `matplotlib`, `seaborn`, and the user DataFrame are exposed. All builtins and filesystem/network access are removed to prevent unsafe operations.

## Example Questions
- What are the top 5 products by revenue?
- Show me a monthly revenue trend as a line chart
- What is the average order value?
- Are there any missing values in this dataset?
- Show me a bar chart of revenue by category
