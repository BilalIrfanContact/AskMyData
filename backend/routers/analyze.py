from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException

from backend.models.schemas import AnalyzeRequest, AnalyzeResponse
from backend.services.code_executor import execute_generated_code
from backend.services.code_generator import CodeGenerator, REFUSAL_MESSAGE
from backend.services.session_store import active_sessions

router = APIRouter()
_code_generator: CodeGenerator | None = None


def get_code_generator() -> CodeGenerator:
    global _code_generator
    if _code_generator is None:
        _code_generator = CodeGenerator()
    return _code_generator


def is_code_like_output(answer: str) -> bool:
    lowered = answer.lower()
    if "```" in answer:
        return True
    code_markers = [
        "df[",
        "df.",
        "pd.",
        "plt.",
        "sns.",
        "import ",
        "from ",
        "def ",
        "lambda ",
        "for ",
        "while ",
        "elif ",
        "else:",
        "return ",
    ]
    return any(marker in lowered for marker in code_markers)


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def is_dataset_description_request(question: str) -> bool:
    normalized = _normalize_text(question)
    description_terms = {
        "dataset description",
        "data description",
        "describe dataset",
        "describe data",
        "dataset summary",
        "data summary",
        "summarize dataset",
        "summarize data",
        "what is in this dataset",
        "what is in the dataset",
        "tell me about this dataset",
        "tell me about the dataset",
        "dataset overview",
        "data overview",
    }
    if normalized in description_terms:
        return True

    keywords = ("dataset", "data", "csv", "table")
    intent_words = ("describe", "description", "summary", "summarize", "overview")
    return any(k in normalized for k in keywords) and any(i in normalized for i in intent_words)


def build_dataset_description(columns: list[str], dtypes: dict[str, str], row_count: int, column_count: int) -> str:
    preview_columns = ", ".join(columns[:12])
    if column_count > 12:
        preview_columns += ", ..."
    type_preview = ", ".join([f"{col} ({dtypes.get(col, 'unknown')})" for col in columns[:8]])
    if column_count > 8:
        type_preview += ", ..."

    return (
        f"The dataset has {row_count:,} rows and {column_count} columns. "
        f"Columns include: {preview_columns}. "
        f"Detected data types include: {type_preview}."
    )


def is_likely_in_scope(question: str, columns: list[str]) -> bool:
    normalized = _normalize_text(question)
    if is_dataset_description_request(question):
        return True

    scope_keywords = {
        "dataset",
        "data",
        "csv",
        "column",
        "columns",
        "row",
        "rows",
        "mean",
        "average",
        "median",
        "sum",
        "count",
        "minimum",
        "maximum",
        "top",
        "most",
        "least",
        "highest",
        "lowest",
        "distribution",
        "group",
        "filter",
        "correlation",
        "trend",
    }
    if any(word in normalized for word in scope_keywords):
        return True

    question_tokens = set(re.findall(r"[a-z0-9_]+", normalized))
    for col in columns:
        col_tokens = set(re.findall(r"[a-z0-9_]+", col.lower()))
        if col_tokens and question_tokens.intersection(col_tokens):
            return True
    return False


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    session = active_sessions.get(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found. Upload a CSV first.")

    df = session.df
    columns = [str(col) for col in df.columns.tolist()]
    dtypes = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    preview = df.head(5).values.tolist()
    row_count = int(df.shape[0])
    column_count = int(df.shape[1])

    if is_dataset_description_request(request.question):
        answer = build_dataset_description(columns, dtypes, row_count, column_count)
        session.history.append({"role": "user", "content": request.question})
        session.history.append({"role": "assistant", "content": answer})
        session.history = session.history[-8:]
        return AnalyzeResponse(answer=answer, chart=None)

    code_generator = get_code_generator()
    code = code_generator.generate_code(
        question=request.question,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
        row_count=row_count,
        column_count=column_count,
        history=session.history,
    )

    result = execute_generated_code(code, df)

    if result.get("had_error"):
        retry_code = code_generator.generate_code(
            question=request.question,
            columns=columns,
            dtypes=dtypes,
            preview=preview,
            row_count=row_count,
            column_count=column_count,
            history=session.history,
            error=result.get("answer", "Execution error"),
            previous_code=code,
        )
        result = execute_generated_code(retry_code, df)
    else:
        answer_text = result.get("answer") or ""
        if answer_text and is_code_like_output(answer_text):
            retry_code = code_generator.generate_code(
                question=request.question,
                columns=columns,
                dtypes=dtypes,
                preview=preview,
                row_count=row_count,
                column_count=column_count,
                history=session.history,
                error="Your output contained python code or markdown. Return only human-readable answer text or a chart.",
                previous_code=code,
            )
            result = execute_generated_code(retry_code, df)

    answer = result.get("answer")
    chart = result.get("chart")

    if (
        answer
        and answer.strip() == REFUSAL_MESSAGE
        and is_likely_in_scope(request.question, columns)
    ):
        retry_question = (
            request.question
            + "\n\nThis question is about the uploaded dataset. "
            + "Use the DataFrame `df` and answer it directly. Do not refuse."
        )
        retry_code = code_generator.generate_code(
            question=retry_question,
            columns=columns,
            dtypes=dtypes,
            preview=preview,
            row_count=row_count,
            column_count=column_count,
            history=session.history,
        )
        result = execute_generated_code(retry_code, df)
        answer = result.get("answer")
        chart = result.get("chart")

    if not answer and not chart:
        answer = "No answer could be produced for that question."

    session.history.append({"role": "user", "content": request.question})
    if answer:
        session.history.append({"role": "assistant", "content": answer})
    elif chart:
        session.history.append({"role": "assistant", "content": "Generated a chart."})

    session.history = session.history[-8:]

    return AnalyzeResponse(answer=answer, chart=chart)
