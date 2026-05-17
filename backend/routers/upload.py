from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.models.schemas import ChatMessageRecord, DocumentSummary, UploadResponse
from backend.services.auth import AuthUser, get_current_user
from backend.services.code_generator import CodeGenerator
from backend.services.csv_loader import load_csv_bytes
from backend.services.supabase_store import (
    delete_document_for_user,
    list_documents_for_user,
    list_messages_for_session,
    persist_document,
    store_dataset_file,
)
from backend.services.session_store import SessionData, active_sessions

router = APIRouter()
_code_generator: CodeGenerator | None = None


def get_code_generator() -> CodeGenerator:
    global _code_generator
    if _code_generator is None:
        _code_generator = CodeGenerator()
    return _code_generator


def build_fallback_suggestions(columns: list[str], dtypes: dict[str, str]) -> list[str]:
    numeric_cols = [c for c, t in dtypes.items() if any(x in t.lower() for x in ("int", "float", "double", "decimal"))]
    primary_numeric = numeric_cols[0] if numeric_cols else None

    suggestions = [
        "Summarize this dataset in simple terms.",
        "Which columns have missing values, and how many are missing in each?",
    ]
    if primary_numeric:
        suggestions.append(f"Show a chart of the distribution of {primary_numeric}.")
        suggestions.append(f"Which rows are outliers in {primary_numeric}?")
    else:
        col = columns[0] if columns else "the first column"
        suggestions.append(f"What are the top categories in {col}?")
        suggestions.append("Show a chart of the most common values in this dataset.")
    return suggestions[:4]


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(get_current_user),
) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        raw_bytes = await file.read()
        df, columns, dtypes, preview = load_csv_bytes(raw_bytes)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {exc}") from exc

    session_id = str(uuid.uuid4())
    storage_path = store_dataset_file(
        user_id=current_user.user_id,
        session_id=session_id,
        filename=file.filename,
        raw_bytes=raw_bytes,
    )
    if not storage_path:
        raise HTTPException(
            status_code=500,
            detail="Failed to persist uploaded CSV to storage.",
        )
    active_sessions[session_id] = SessionData(
        df=df,
        user_id=current_user.user_id,
        file_name=file.filename,
    )
    try:
        generator = get_code_generator()
        suggested_questions = generator.generate_suggested_questions(
            columns=columns,
            dtypes=dtypes,
            preview=preview,
            row_count=int(df.shape[0]),
            column_count=int(df.shape[1]),
        )
    except Exception:  # noqa: BLE001
        suggested_questions = build_fallback_suggestions(columns, dtypes)

    persist_document(
        user_id=current_user.user_id,
        session_id=session_id,
        filename=file.filename,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
        suggested_questions=suggested_questions,
        storage_path=storage_path,
    )

    return UploadResponse(
        session_id=session_id,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
        suggested_questions=suggested_questions,
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
            preview=[list(item) for item in (row.get("preview") or []) if isinstance(item, (list, tuple))],
            suggested_questions=[str(q) for q in (row.get("suggested_questions") or [])][:4],
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


@router.delete("/documents/{session_id}")
async def delete_document(
    session_id: str,
    current_user: AuthUser = Depends(get_current_user),
) -> dict[str, bool]:
    deleted = delete_document_for_user(user_id=current_user.user_id, session_id=session_id)
    if session_id in active_sessions:
        del active_sessions[session_id]

    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"deleted": True}
