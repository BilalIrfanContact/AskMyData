from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import UploadFile


def load_csv(file: UploadFile) -> tuple[pd.DataFrame, list[str], dict[str, str], list[list[Any]]]:
    df = pd.read_csv(file.file)
    columns = [str(col) for col in df.columns.tolist()]
    dtypes = {str(col): str(dtype) for col, dtype in df.dtypes.items()}
    preview = df.head(5).values.tolist()
    return df, columns, dtypes, preview
