from __future__ import annotations

import io
from typing import Any

import pandas as pd
from fastapi import UploadFile


def load_csv(file: UploadFile) -> tuple[pd.DataFrame, list[str], dict[str, str], list[list[Any]]]:
    raw = file.file.read()
    if not raw:
        raise ValueError("The uploaded CSV is empty.")

    # Try common encodings in order. cp1252/latin1 catch many Excel-exported files.
    encodings = ("utf-8", "utf-8-sig", "cp1252", "latin1")
    last_error: Exception | None = None
    df: pd.DataFrame | None = None

    for encoding in encodings:
        try:
            df = pd.read_csv(io.BytesIO(raw), encoding=encoding)
            break
        except UnicodeDecodeError as exc:
            last_error = exc

    if df is None:
        raise ValueError(
            "Could not decode CSV with supported encodings: "
            + ", ".join(encodings)
        ) from last_error

    columns = [str(col) for col in df.columns.tolist()]
    dtypes = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    preview = df.head(5).values.tolist()
    return df, columns, dtypes, preview
