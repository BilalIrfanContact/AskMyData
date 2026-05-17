from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_client() -> Client | None:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def _get_bucket() -> str:
    return os.getenv("SUPABASE_STORAGE_BUCKET", "askmydata-csv")


def _safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._")
    return cleaned or "dataset.csv"


def _ensure_bucket(client: Client, bucket: str) -> None:
    try:
        existing = client.storage.get_bucket(bucket)
        if existing:
            return
    except Exception:  # noqa: BLE001
        pass

    client.storage.create_bucket(bucket, options={"public": False})


def persist_document(
    *,
    user_id: str,
    session_id: str,
    filename: str,
    columns: list[str],
    dtypes: dict[str, str],
    preview: list[list[Any]] | None = None,
    suggested_questions: list[str] | None = None,
    storage_path: str | None = None,
) -> str | None:
    client = _get_client()
    if client is None:
        return None

    payload: dict[str, Any] = {
        "id": session_id,
        "user_id": user_id,
        "filename": filename,
        "columns": columns,
        "dtypes": dtypes,
        "preview": preview or [],
        "suggested_questions": suggested_questions or [],
        "storage_path": storage_path,
        "created_at": _utc_now_iso(),
    }

    client.table("documents").upsert(payload).execute()
    return session_id


def persist_chat_message(
    *,
    user_id: str,
    session_id: str,
    role: str,
    content: str,
    chart: str | None = None,
    is_error: bool = False,
) -> None:
    client = _get_client()
    if client is None:
        return

    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "chart": chart,
        "is_error": is_error,
        "created_at": _utc_now_iso(),
    }
    client.table("messages").insert(payload).execute()


def list_documents_for_user(*, user_id: str) -> list[dict[str, Any]]:
    client = _get_client()
    if client is None:
        return []

    response = (
        client.table("documents")
        .select("id, filename, columns, dtypes, preview, suggested_questions, storage_path, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return list(response.data or [])


def list_messages_for_session(*, user_id: str, session_id: str) -> list[dict[str, Any]]:
    client = _get_client()
    if client is None:
        return []

    response = (
        client.table("messages")
        .select("role, content, chart, is_error, created_at")
        .eq("user_id", user_id)
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return list(response.data or [])


def get_document_for_user(*, user_id: str, session_id: str) -> dict[str, Any] | None:
    client = _get_client()
    if client is None:
        return None

    response = (
        client.table("documents")
        .select("id, filename, columns, dtypes, preview, suggested_questions, storage_path, created_at")
        .eq("user_id", user_id)
        .eq("id", session_id)
        .limit(1)
        .execute()
    )
    rows = list(response.data or [])
    return rows[0] if rows else None


def store_dataset_file(*, user_id: str, session_id: str, filename: str, raw_bytes: bytes) -> str | None:
    client = _get_client()
    if client is None:
        return None

    bucket = _get_bucket()
    _ensure_bucket(client, bucket)
    safe_name = _safe_filename(filename)
    path = f"{user_id}/{session_id}/{safe_name}"
    client.storage.from_(bucket).upload(
        path,
        raw_bytes,
        file_options={"content-type": "text/csv", "upsert": "true"},
    )
    return path


def load_dataset_file(*, storage_path: str) -> bytes | None:
    client = _get_client()
    if client is None:
        return None

    bucket = _get_bucket()
    return client.storage.from_(bucket).download(storage_path)


def delete_document_for_user(*, user_id: str, session_id: str) -> bool:
    client = _get_client()
    if client is None:
        return False

    document = get_document_for_user(user_id=user_id, session_id=session_id)
    if document is None:
        return False

    storage_path = str(document.get("storage_path") or "").strip()
    if storage_path:
        bucket = _get_bucket()
        try:
            client.storage.from_(bucket).remove([storage_path])
        except Exception:  # noqa: BLE001
            pass

    (
        client.table("documents")
        .delete()
        .eq("user_id", user_id)
        .eq("id", session_id)
        .execute()
    )
    return True
