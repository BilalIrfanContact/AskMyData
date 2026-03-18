from __future__ import annotations

import json
import os
from typing import Any, Optional

from openai import OpenAI

REFUSAL_MESSAGE = "I can only answer questions about the uploaded dataset."

SYSTEM_PROMPT = """
You are a data analyst assistant. You only answer questions about the uploaded dataset.
If the user asks something unrelated to the dataset (e.g. greetings, general knowledge, weather),
respond with exactly: "I can only answer questions about the uploaded dataset."
If the question uses vague references like "it" or "this" and a dataset is loaded, assume it refers to the dataset.
If the question is about the data but requires clarification, ask for it.
Never answer anything outside the scope of the dataset.

You may also be given recent conversation context; use it to resolve follow-up questions and clarifications.
You will be given a pandas DataFrame called `df` along with its column names, data types, and a few sample rows.
Your job is to write Python code that answers the user's question using this DataFrame.

If the question is about the dataset but ambiguous (e.g., "biggest", "top", "best"),
use a reasonable default (e.g., count of rows) or ask a brief clarification that references the available column names.
Only refuse if the question is clearly unrelated to the dataset.
If the question mentions entities like artist/singer/song and those columns exist in the dataset, it is in-scope.
For "biggest/top/most" questions, prefer these defaults in order:
1) if a column includes "streams" (e.g., total_streams, total_streams_billions), use the highest total streams per artist;
2) else if a column includes "rank", use the best (lowest) rank per artist;
3) else use the highest count of rows per artist.

Rules:
- Use only `df` (pandas DataFrame), `pd` (pandas), `plt` (matplotlib.pyplot), and `sns` (seaborn)
- Do NOT import any libraries — they are already available
- Do NOT use os, subprocess, open, or any file system operations
- If the answer is a single value or table, print it using print()
- If the answer is best shown as a chart, create it using plt and do NOT call plt.show()
- Write only clean executable Python code with no explanation, no markdown, no backticks.
- Your response will be executed directly. If you include anything other than Python code, it will be discarded.
- If the user's question is not about the dataset, print: "I can only answer questions about the uploaded dataset."
- If clarification is needed, print a single, concise clarification question.
- Always transform computed results into a friendly human-readable sentence; do not print raw DataFrame outputs or raw scalar values.
- Never print raw boolean values. Always print a complete human-readable sentence as the answer.
- Example: instead of print(a > b), print f"Drake has more songs with {drake_count} compared to Ed Sheeran with {sheeran_count}"
- If the user asks a subjective or opinion-based question (e.g. "whose songs are better", "who is more talented"),
  do not refuse with the standard message. Instead print a response explaining it is subjective and
  suggest a data-driven comparison you can make instead based on the available columns.
""".strip()


class CodeGenerator:
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini") -> None:
        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self.client = OpenAI(api_key=key)
        self.model = model

    def generate_code(
        self,
        question: str,
        columns: list[str],
        dtypes: dict[str, str],
        preview: list[list[Any]],
        row_count: int | None = None,
        column_count: int | None = None,
        history: Optional[list[dict[str, str]]] = None,
        error: Optional[str] = None,
        previous_code: Optional[str] = None,
    ) -> str:
        context = {
            "columns": columns,
            "dtypes": dtypes,
            "preview": preview,
        }
        if row_count is not None:
            context["row_count"] = row_count
        if column_count is not None:
            context["column_count"] = column_count
        user_content = (
            "Context (JSON):\n"
            + json.dumps(context, indent=2)
            + "\n\nQuestion:\n"
            + question
        )
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for entry in history[-6:]:
                role = entry.get("role", "user")
                content = entry.get("content", "")
                if role in {"user", "assistant"} and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": user_content})
        if error and previous_code:
            user_content += (
                "\n\nThe previous code failed with this error:\n"
                + error
                + "\n\nPrevious code:\n"
                + previous_code
                + "\n\nPlease return corrected executable Python code only."
            )

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            messages=messages,
        )

        code = response.choices[0].message.content or ""
        return normalize_generated_code(code)


def strip_code_fences(code: str) -> str:
    stripped = code.strip()
    if "```" in stripped:
        parts = stripped.split("```")
        if len(parts) >= 3:
            fenced = parts[1].strip()
            fenced_lines = fenced.splitlines()
            if fenced_lines and fenced_lines[0].strip().lower().startswith(("python", "py")):
                fenced_lines = fenced_lines[1:]
            return "\n".join(fenced_lines).strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
            return "\n".join(lines[1:-1]).strip()
    return stripped


def normalize_generated_code(generated_code: str) -> str:
    cleaned_code = strip_code_fences(generated_code).strip()

    if not cleaned_code:
        return f'print("{REFUSAL_MESSAGE}")'

    try:
        compile(cleaned_code, "<generated>", "exec")
        return cleaned_code
    except SyntaxError:
        safe_text = json.dumps(cleaned_code)
        return f"print({safe_text})"
