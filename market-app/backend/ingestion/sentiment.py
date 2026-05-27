"""VADER sentiment scoring."""
from __future__ import annotations

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def score(text: str) -> tuple[float, str]:
    s = _analyzer.polarity_scores(text or "")
    c = s["compound"]
    if c >= 0.05:
        label = "positive"
    elif c <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return float(c), label
