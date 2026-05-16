from __future__ import annotations

import os
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


def persist_document(
    *,
    user_id: str,
    session_id: str,
    filename: str,
    columns: list[str],
    dtypes: dict[str, str],
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
