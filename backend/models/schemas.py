from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class UploadResponse(BaseModel):
    session_id: str
    columns: list[str]
    dtypes: dict[str, str]
    preview: list[list[Any]]


class AnalyzeRequest(BaseModel):
    session_id: str
    question: str


class AnalyzeResponse(BaseModel):
    answer: Optional[str]
    chart: Optional[str]
