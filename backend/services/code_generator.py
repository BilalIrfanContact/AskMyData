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
If the question is about the data but requires clarification, ask for it.
Never answer anything outside the scope of the dataset.

You will be given a pandas DataFrame called `df` along with its column names, data types, and a few sample rows.
Your job is to write Python code that answers the user's question using this DataFrame.

Rules:
- Use only `df` (pandas DataFrame), `pd` (pandas), `plt` (matplotlib.pyplot), and `sns` (seaborn)
- Do NOT import any libraries — they are already available
- Do NOT use os, subprocess, open, or any file system operations
- If the answer is a single value or table, print it using print()
- If the answer is best shown as a chart, create it using plt and do NOT call plt.show()
- Write only clean executable Python code with no explanation, no markdown, no backticks
- If the user's question is not about the dataset, print: "I can only answer questions about the uploaded dataset."
- If clarification is needed, print a single, concise clarification question.
- Never print raw boolean values. Always print a complete human-readable sentence as the answer.
- Example: instead of print(a > b), print f"Drake has more songs with {drake_count} compared to Ed Sheeran with {sheeran_count}"
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
        error: Optional[str] = None,
        previous_code: Optional[str] = None,
    ) -> str:
        context = {
            "columns": columns,
            "dtypes": dtypes,
            "preview": preview,
        }
        user_content = (
            "Context (JSON):\n"
            + json.dumps(context, indent=2)
            + "\n\nQuestion:\n"
            + question
        )
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
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        )

        code = response.choices[0].message.content or ""
        return normalize_generated_code(code)


def strip_code_fences(code: str) -> str:
    stripped = code.strip()
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
