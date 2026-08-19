"""Single source of truth for the current football season.

API-Football keys a season by its START year (e.g. 2026 = the 2026-27 season).
European seasons begin in August, so from August onward we treat it as the new
season; before August we are still in the one that started the previous year.
Computed at import time from the server clock, so it rolls over on its own each
year with no code change.
"""
from datetime import datetime, timezone


def current_season() -> int:
    now = datetime.now(timezone.utc)
    # Flip in August, once the provider has loaded the new season's fixtures.
    return now.year if now.month >= 8 else now.year - 1


SEASON = current_season()