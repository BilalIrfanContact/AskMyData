from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd


@dataclass
class SessionData:
    df: pd.DataFrame
    history: list[dict[str, str]] = field(default_factory=list)


active_sessions: dict[str, SessionData] = {}
