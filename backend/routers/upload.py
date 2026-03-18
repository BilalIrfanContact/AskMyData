from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.models.schemas import UploadResponse
from backend.services.csv_loader import load_csv
from backend.services.session_store import SessionData, active_sessions

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        df, columns, dtypes, preview = load_csv(file)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {exc}") from exc

    session_id = str(uuid.uuid4())
    active_sessions[session_id] = SessionData(df=df)

    return UploadResponse(
        session_id=session_id,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
    )
