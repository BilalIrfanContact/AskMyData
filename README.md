# AskMyData

<p align="center">
  <strong>Talk to your data in plain English.</strong>
</p>

<p align="center">
  Upload CSV files, ask questions conversationally, generate charts instantly, and continue your analysis sessions anytime using AI-powered dataset understanding.
</p>

---

## Overview

AskMyData is a full-stack AI data analysis application where users upload spreadsheet datasets and chat with them using natural language.

The system uses an LLM to generate Python analysis code dynamically, executes it inside a restricted sandbox environment, and returns answers as text, visualizations, or both.

Unlike traditional chatbots, AskMyData performs real runtime data analysis using pandas, matplotlib, and seaborn while maintaining secure per-user dataset persistence using Supabase authentication, storage, and database services.

---

## Screenshots

![AskMyData UI](./img/screenshot1.png)
![AskMyData UI](./img/screenshot2.png)

---

# Features

## AI Data Analysis

- Upload CSV datasets and instantly preview them
- Ask questions in plain English
- AI generates Python analysis code dynamically
- Supports:
  - aggregations
  - filtering
  - grouping
  - trend analysis
  - comparisons
  - statistical insights
  - visual analytics

---

## Chart Generation

- Generates charts directly from user prompts
- Supports:
  - line charts
  - bar charts
  - scatter plots
  - histograms
  - heatmaps
  - pie charts
- Chart-only responses render cleanly without noisy placeholder text

---

## Secure Sandboxed Code Execution

Generated Python code runs in a restricted execution environment:

- No filesystem access
- No subprocess access
- No network access
- Restricted globals only

Allowed runtime objects:

```python
df
pd
plt
sns
print
````

The backend also validates generated code before execution and supports automatic retry/self-correction when code fails.

---

## Authentication & Security

### Supabase Authentication

* Google OAuth login
* Session persistence
* Sign out support
* Bearer-token protected backend routes

### Per-User Access Control

Users can only access:

* their own uploaded datasets
* their own conversations
* their own persisted sessions

Session ownership is validated server-side.

### Row Level Security

Supabase RLS policies protect:

* documents table
* messages table
* per-user database reads/writes for persisted metadata and chat history

---

## Persistent Dataset Sessions

AskMyData supports fully resumable AI analysis sessions.

Uploaded CSV files are persisted to Supabase Storage. If the backend restarts or the user signs out, the system can automatically:

* restore document metadata
* reload the CSV from storage
* rebuild the pandas DataFrame
* restore previous chat history
* restore preview rows
* continue analysis seamlessly

This enables durable long-term dataset conversations instead of temporary memory-only sessions.

---

## AI Dataset-Aware Suggestions

After upload, AI automatically generates dataset-specific starter questions using:

* dataset schema
* column types
* preview rows

Examples:

```text
Which region has the highest sales?
```

```text
Show monthly revenue trend.
```

```text
Which products are least profitable?
```

Suggestions persist in the database and reload when reopening old datasets.

Fallback generation logic exists if AI suggestion generation fails.

---

## Returning User Experience

Users can:

* reopen previous datasets
* restore prior conversations
* continue analysis from older sessions
* access recent uploaded documents
* delete old datasets

Reopened sessions restore:

* chat history
* dataset preview
* suggested questions
* document metadata

---

## CSV Robustness

AskMyData supports multiple CSV encodings to reduce upload failures from Excel-exported files and legacy datasets.

Supported fallbacks:

```text
utf-8
utf-8-sig
cp1252
latin1
```

---

# How It Works

```text
1. User signs in with Google using Supabase Auth
        ↓
2. User uploads a CSV dataset
        ↓
3. Backend validates bearer token
        ↓
4. CSV is loaded into a pandas DataFrame
        ↓
5. Dataset metadata + preview are persisted
        ↓
6. CSV file is uploaded to Supabase Storage
        ↓
7. AI generates dataset-aware starter questions
        ↓
8. User asks a question in plain English
        ↓
9. Backend validates session ownership
        ↓
10. Dataset schema + preview + question sent to LLM
        ↓
11. LLM generates executable Python analysis code
        ↓
12. Code executes inside restricted sandbox
        ↓
13. Text answer and/or chart returned
        ↓
14. Conversation stored in Supabase
        ↓
15. User can later reopen dataset and continue analysis
        ↓
16. Backend automatically rehydrates DataFrame if needed
```

---

# Tech Stack

## Backend

* FastAPI
* Python
* pandas
* matplotlib
* seaborn
* OpenAI API
* Supabase
* Pydantic

---

## Frontend

* Vite
* React
* TypeScript
* Tailwind CSS
* Lucide React

---

## Database / Persistence

* Supabase Postgres
* Supabase Auth
* Supabase Storage
* Row Level Security Policies

---

# Project Structure

```text
backend/
├── main.py
├── models/
│   └── schemas.py
├── routers/
│   ├── analyze.py
│   └── upload.py
├── services/
│   ├── auth.py
│   ├── code_executor.py
│   ├── code_generator.py
│   ├── csv_loader.py
│   ├── session_store.py
│   └── supabase_store.py
├── requirements.txt
└── supabase_schema.sql

frontend/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

---

# API Endpoints

| Method | Endpoint                           | Description                       |
| ------ | ---------------------------------- | --------------------------------- |
| POST   | `/upload`                          | Upload a CSV dataset              |
| POST   | `/analyze`                         | Ask questions about uploaded data |
| GET    | `/documents`                       | Fetch user datasets               |
| GET    | `/documents/{session_id}/messages` | Fetch prior conversation history  |
| DELETE | `/documents/{session_id}`          | Delete a saved dataset + related conversation |
| GET    | `/health`                          | Health check                      |

Protected routes require bearer authentication.

---

# Environment Variables

## Backend `.env`

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_CHAT_MODEL=gpt-4o-mini

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_STORAGE_BUCKET=askmydata-csv

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

# Local Development

## Backend

```bash
python -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt

uvicorn backend.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Open:

```text
http://localhost:5173
```

---

# Supabase Setup

Run:

```text
backend/supabase_schema.sql
```

inside the Supabase SQL editor.

This creates:

* documents table
* messages table
* Row Level Security policies

You must also create a storage bucket for CSV persistence.

---

# Security

AskMyData enforces security using:

* Supabase authentication
* bearer token verification
* server-side ownership checks
* Row Level Security policies
* restricted Python execution
* no filesystem/network access in generated code

Generated code cannot access:

```python
os
subprocess
open
requests
socket
```

---

# Current Architecture Notes

* Active DataFrames remain cached in memory for fast interaction
* CSV persistence enables automatic session restoration
* Rehydration occurs automatically when active session memory is unavailable

---

# Roadmap

* Multi-sheet Excel support
* File upload drag-and-drop improvements
* Streaming AI responses
* Export reports/charts
* Advanced chart customization
* Better production-grade sandboxing
* Multi-dataset analysis
* Collaborative workspaces

---

# Why I Built This

AskMyData was built to explore agentic AI systems beyond traditional chatbots.

Instead of only generating text, the system allows AI to:

* generate executable analysis code
* run real computations
* recover from failures
* analyze user datasets dynamically
* produce charts and insights automatically

The project focuses heavily on practical runtime AI orchestration, secure execution, persistence, and user-centric AI workflows.
