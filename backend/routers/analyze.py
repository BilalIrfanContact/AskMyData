from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import AnalyzeRequest, AnalyzeResponse
from backend.services.code_executor import execute_generated_code
from backend.services.code_generator import CodeGenerator
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

    if not answer and not chart:
        answer = "No answer could be produced for that question."

    session.history.append({"role": "user", "content": request.question})
    if answer:
        session.history.append({"role": "assistant", "content": answer})
    elif chart:
        session.history.append({"role": "assistant", "content": "Generated a chart."})

    session.history = session.history[-8:]

    return AnalyzeResponse(answer=answer, chart=chart)
