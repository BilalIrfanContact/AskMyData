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


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    df = active_sessions.get(request.session_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Session not found. Upload a CSV first.")

    columns = [str(col) for col in df.columns.tolist()]
    dtypes = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    preview = df.head(5).values.tolist()

    code_generator = get_code_generator()
    code = code_generator.generate_code(
        question=request.question,
        columns=columns,
        dtypes=dtypes,
        preview=preview,
    )

    result = execute_generated_code(code, df)

    if result.get("had_error"):
        retry_code = code_generator.generate_code(
            question=request.question,
            columns=columns,
            dtypes=dtypes,
            preview=preview,
            error=result.get("answer", "Execution error"),
            previous_code=code,
        )
        result = execute_generated_code(retry_code, df)

    answer = result.get("answer")
    chart = result.get("chart")

    if not answer and not chart:
        answer = "No answer could be produced for that question."

    return AnalyzeResponse(answer=answer, chart=chart)
