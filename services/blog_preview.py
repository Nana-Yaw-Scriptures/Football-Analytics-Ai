"""
Blog preview writer — turns a match prediction into a short, readable preview
using Claude Sonnet 5. Grounded strictly in the numbers passed in.

Wire it up in main.py with two lines:

    from services.blog_preview import router as blog_router
    app.include_router(blog_router)

Uses the ANTHROPIC_API_KEY already in your Railway environment.
"""

from typing import List, Optional

import anthropic
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
_client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

MODEL = "claude-sonnet-5"

SYSTEM = (
    "You are a football writer for Scorina AI, a match-prediction app. "
    "Write a preview of the match below using ONLY the data provided. "
    "Do not invent injuries, transfers, line-ups, quotes, league positions, "
    "history, or any fact that is not given to you. "
    "Voice: balanced — analytical but easy to read, confident without hype. "
    "Length: about 150 words in two short paragraphs. "
    "Cover why the match matters, what the model's numbers say (win "
    "probabilities, expected goals and recent form), and finish with a short, "
    "reasoned verdict that agrees with the prediction. "
    "Use British English. Write plainly and clearly: no idioms, no complex "
    "words, no betting advice. Output only the preview text — no headings, no "
    "bullet points, no labels."
)


class PreviewReq(BaseModel):
    home: str
    away: str
    league: str = "football"
    home_win: float = 0.0
    draw: float = 0.0
    away_win: float = 0.0
    home_expected_goals: Optional[float] = None
    away_expected_goals: Optional[float] = None
    most_likely_score: Optional[str] = None
    confidence_level: Optional[str] = None
    home_form_sequence: List[str] = []
    away_form_sequence: List[str] = []
    key_factors: List[str] = []


def _pct(x: float) -> int:
    try:
        return round(float(x) * 100)
    except Exception:
        return 0


def _build_prompt(r: PreviewReq) -> str:
    hform = " ".join(r.home_form_sequence[-5:]) or "n/a"
    aform = " ".join(r.away_form_sequence[-5:]) or "n/a"
    factors = "; ".join(r.key_factors[:4]) or "n/a"
    xg = "n/a"
    if r.home_expected_goals is not None and r.away_expected_goals is not None:
        xg = f"{r.home} {r.home_expected_goals} - {r.away_expected_goals} {r.away}"
    return (
        f"Match: {r.home} vs {r.away} ({r.league})\n"
        f"Model prediction: {r.home} win {_pct(r.home_win)}%, "
        f"draw {_pct(r.draw)}%, {r.away} win {_pct(r.away_win)}%\n"
        f"Expected goals: {xg}\n"
        f"Most likely score: {r.most_likely_score or 'n/a'}\n"
        f"Confidence: {r.confidence_level or 'n/a'}\n"
        f"{r.home} recent form (oldest to newest): {hform}\n"
        f"{r.away} recent form (oldest to newest): {aform}\n"
        f"Key factors from the model: {factors}\n"
    )


@router.post("/blog/preview")
def blog_preview(req: PreviewReq):
    """Return a short, model-grounded match preview as plain text."""
    try:
        msg = _client.messages.create(
            model=MODEL,
            max_tokens=320,
            system=SYSTEM,
            messages=[{"role": "user", "content": _build_prompt(req)}],
        )
        text = "".join(
            getattr(b, "text", "") for b in msg.content if getattr(b, "type", "") == "text"
        ).strip()
        return {"preview": text}
    except Exception as e:
        # Never break the generator if the write-up fails — return empty.
        return {"preview": "", "error": str(e)}