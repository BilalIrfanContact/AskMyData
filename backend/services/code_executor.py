from __future__ import annotations

import base64
import io
from contextlib import redirect_stdout
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):  # noqa: ANN001,D401
    root = name.split(".")[0]
    if root in {"pandas", "matplotlib", "seaborn"}:
        return __import__(name, globals, locals, fromlist, level)
    raise ImportError("Imports are restricted in the analysis sandbox.")


def execute_generated_code(generated_code: str, dataframe: pd.DataFrame) -> dict[str, Any]:
    safe_builtins = {
        "range": range,
        "len": len,
        "min": min,
        "max": max,
        "sum": sum,
        "abs": abs,
        "__import__": _safe_import,
    }

    restricted_globals = {
        "__builtins__": safe_builtins,
        "pd": pd,
        "plt": plt,
        "sns": sns,
        "df": dataframe,
        "print": print,
    }

    stdout = io.StringIO()
    plt.clf()

    try:
        with redirect_stdout(stdout):
            exec(generated_code, restricted_globals)
    except Exception as execution_error:  # noqa: BLE001
        return {
            "answer": f"Execution error: {str(execution_error)}",
            "chart": None,
            "had_error": True,
        }

    chart_base64 = None
    figure = plt.gcf()
    if figure.get_axes():
        buffer = io.BytesIO()
        figure.savefig(buffer, format="png", bbox_inches="tight")
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.read()).decode("utf-8")
        plt.clf()

    answer_text = stdout.getvalue().strip() or None

    return {
        "answer": answer_text,
        "chart": chart_base64,
        "had_error": False,
    }
