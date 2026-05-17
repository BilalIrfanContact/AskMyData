from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.models.schemas import ChatMessageRecord, DocumentSummary, UploadResponse
from backend.services.auth import AuthUser, get_current_user
from backend.services.csv_loader import load_csv
from backend.services.supabase_store import (
    list_documents_for_user,
    list_messages_for_session,
    persist_document,
)
from backend.services.session_store import SessionData, active_sessions

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(get_current_user),
) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        df, columns, dtypes, preview = load_csv(file)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {exc}") from exc

    session_id = str(uuid.uuid4())
    active_sessions[session_id] = SessionData(
        df=df,
        user_id=current_user.user_id,
        file_name=file.filename,
    )
    persist_document(
        user_id=current_user.user_id,
        session_id=session_id,
        filename=file.filename,
        columns=columns,
        dtypes=dtypes,
    )

    return UploadResponse(
        session_id=session_id,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
    )


@router.get("/documents", response_model=list[DocumentSummary])
async def get_documents(current_user: AuthUser = Depends(get_current_user)) -> list[DocumentSummary]:
    rows = list_documents_for_user(user_id=current_user.user_id)
    return [
        DocumentSummary(
            session_id=str(row.get("id", "")),
            filename=str(row.get("filename", "Untitled CSV")),
            columns=[str(col) for col in (row.get("columns") or [])],
            dtypes={str(k): str(v) for k, v in (row.get("dtypes") or {}).items()},
            created_at=str(row.get("created_at", "")),
        )
        for row in rows
        if row.get("id")
    ]


@router.get("/documents/{session_id}/messages", response_model=list[ChatMessageRecord])
async def get_document_messages(
    session_id: str,
    current_user: AuthUser = Depends(get_current_user),
) -> list[ChatMessageRecord]:
    rows = list_messages_for_session(user_id=current_user.user_id, session_id=session_id)
    return [
        ChatMessageRecord(
            role=str(row.get("role", "assistant")),
            content=str(row.get("content", "")),
            chart=(str(row["chart"]) if row.get("chart") else None),
            is_error=bool(row.get("is_error", False)),
            created_at=str(row.get("created_at", "")),
        )
        for row in rows
    ]
