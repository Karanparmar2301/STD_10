"""
Gamification Engine
===================
Central XP / Level / Badge / Streak processor.

All reward logic flows through `process_event()`.  The engine is stateless —
it receives a snapshot of the current student record and returns the updated
fields that the caller should persist to the database.

XP Rules
--------
homework_correct   → +5  XP
game_win           → +10 XP
attendance_present → +3  XP
streak_milestone   → +20 XP  (every 7-day streak)

Level Formula
-------------
    level = floor(total_xp / 100) + 1   (min 1, max 50)

Badge Thresholds
----------------
    100  XP  → Bronze
    300  XP  → Silver
    500  XP  → Gold
    1000 XP  → Diamond
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta
from typing import Any

# ─── Constants ────────────────────────────────────────────────────────────────

XP_RULES: dict[str, int] = {
    "homework_correct": 5,
    "game_win": 10,
    "game_complete": 3,          # finished but not necessarily won
    "attendance_present": 3,
    "streak_milestone": 20,      # every 7-day streak boundary
}

STREAK_MILESTONE = 7          # days
XP_PER_LEVEL = 100
MAX_LEVEL = 50

BADGE_THRESHOLDS: list[dict[str, Any]] = [
    {"id": "bronze",  "label": "Bronze",  "icon": "🥉", "required_xp": 100},
    {"id": "silver",  "label": "Silver",  "icon": "🥈", "required_xp": 300},
    {"id": "gold",    "label": "Gold",    "icon": "🥇", "required_xp": 500},
    {"id": "diamond", "label": "Diamond", "icon": "💎", "required_xp": 1000},
]


# ─── Pure Calculations ────────────────────────────────────────────────────────

def calculate_level(total_xp: int) -> int:
    """Return level for the given total XP (1-indexed, max 50)."""
    return min(math.floor(total_xp / XP_PER_LEVEL) + 1, MAX_LEVEL)


def current_level_xp(total_xp: int) -> int:
    """XP earned within the current level band."""
    return total_xp % XP_PER_LEVEL


def xp_to_next_level(total_xp: int) -> int:
    """Remaining XP needed to reach the next level."""
    lvl = calculate_level(total_xp)
    if lvl >= MAX_LEVEL:
        return 0
    return XP_PER_LEVEL - current_level_xp(total_xp)


def check_badge_unlocks(
    prev_xp: int,
    new_xp: int,
    existing_badge_ids: list[str],
) -> list[dict[str, Any]]:
    """
    Return list of newly earned badges (badges the student just crossed
    the threshold for and didn't already have).
    """
    newly_unlocked: list[dict] = []
    for badge in BADGE_THRESHOLDS:
        already_has = badge["id"] in existing_badge_ids
        just_crossed = prev_xp < badge["required_xp"] <= new_xp
        if just_crossed and not already_has:
            newly_unlocked.append(badge)
    return newly_unlocked


def update_streak(
    current_streak: int,
    last_active_date_str: str | None,
    today: date | None = None,
) -> tuple[int, bool]:
    """
    Compute the new streak and whether a streak milestone was hit.

    Returns
    -------
    (new_streak, hit_milestone)
        hit_milestone is True when new_streak is a multiple of STREAK_MILESTONE
        and greater than zero.
    """
    if today is None:
        today = date.today()

    if last_active_date_str:
        try:
            last_active = date.fromisoformat(last_active_date_str[:10])
        except ValueError:
            last_active = None
    else:
        last_active = None

    if last_active is None:
        new_streak = 1
    elif last_active == today:
        # Already active today — no change
        new_streak = current_streak
    elif last_active == today - timedelta(days=1):
        # Consecutive day
        new_streak = current_streak + 1
    else:
        # Gap ≥ 2 days → reset
        new_streak = 1

    hit_milestone = (new_streak > 0) and (new_streak % STREAK_MILESTONE == 0)
    return new_streak, hit_milestone


# ─── Main Engine ─────────────────────────────────────────────────────────────

def process_event(
    event_type: str,
    student_record: dict[str, Any],
    event_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Process a gamification event and return the *delta* (only changed fields).

    Parameters
    ----------
    event_type:
        One of: "homework_correct", "game_win", "game_complete",
                "attendance_present", "daily_login"
    student_record:
        Current student row from the `parents` table.
    event_payload:
        Optional extra context (e.g. {"score": 9, "total": 10}).

    Returns
    -------
    A dict of fields to PATCH onto the parents table, plus:
        "_meta.xp_earned"        — XP gained in this event
        "_meta.level_up"         — bool, True if level increased
        "_meta.new_badges"       — list of newly unlocked badge dicts
        "_meta.streak_milestone" — bool, True if streak hit a multiple of 7
        "_meta.new_level"        — the new level (after event)
    """
    payload = event_payload or {}

    # ── Current state ─────────────────────────────────────────────────────────
    prev_xp: int = int(student_record.get("reward_points", 0))
    prev_level: int = calculate_level(prev_xp)

    existing_badges: list[dict] = student_record.get("badges") or []
    if isinstance(existing_badges, str):
        import json
        try:
            existing_badges = json.loads(existing_badges)
        except Exception:
            existing_badges = []

    existing_badge_ids: list[str] = [
        b["id"] if isinstance(b, dict) else str(b) for b in existing_badges
    ]

    current_streak: int = int(student_record.get("streak", 0))
    last_active: str | None = student_record.get("last_active_date")

    # ── XP Calculation ────────────────────────────────────────────────────────
    base_xp = XP_RULES.get(event_type, 0)
    bonus_xp = 0

    # Streak update (for attendance_present and daily_login)
    hit_milestone = False
    new_streak = current_streak

    if event_type in ("attendance_present", "daily_login"):
        new_streak, hit_milestone = update_streak(current_streak, last_active)
        if hit_milestone:
            bonus_xp += XP_RULES["streak_milestone"]

    new_xp = prev_xp + base_xp + bonus_xp
    new_level = calculate_level(new_xp)
    leveled_up = new_level > prev_level

    # ── Badge Unlocks ─────────────────────────────────────────────────────────
    new_badges = check_badge_unlocks(prev_xp, new_xp, existing_badge_ids)
    all_badges = existing_badges + new_badges

    # ── Achievements count (stars) ────────────────────────────────────────────
    new_stars = int(student_record.get("achievement_stars", 0))
    if new_badges:
        new_stars += len(new_badges) * 3   # 3 stars per badge unlock

    # ── Build update dict ─────────────────────────────────────────────────────
    update: dict[str, Any] = {
        "reward_points": new_xp,
        "current_level": new_level,
        "achievement_stars": new_stars,
        "badges": all_badges,
        # Streak fields
        "streak": new_streak,
        "last_active_date": date.today().isoformat(),
        # Internal metadata for the caller / frontend
        "_meta": {
            "xp_earned": base_xp + bonus_xp,
            "level_up": leveled_up,
            "new_level": new_level,
            "new_badges": new_badges,
            "streak_milestone": hit_milestone,
            "total_xp": new_xp,
        },
    }

    return update


# ─── Analytics helpers ────────────────────────────────────────────────────────

def build_xp_timeline(xp_history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Convert raw XP event log rows into a timeline suitable for a Recharts
    LineChart.

    Each xp_history row must have: { date: "YYYY-MM-DD", xp_earned: int }
    Returns cumulative XP per date.
    """
    from collections import defaultdict

    daily: dict[str, int] = defaultdict(int)
    for row in xp_history:
        d = row.get("date", "")[:10]
        daily[d] += int(row.get("xp_earned", 0))

    cumulative = 0
    result: list[dict] = []
    for d in sorted(daily):
        cumulative += daily[d]
        result.append({"date": d, "xp": cumulative, "daily_xp": daily[d]})

    return result


def build_source_breakdown(xp_history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Sum XP by source type for a Bar / Pie chart.

    Each row must have: { source: "homework"|"games"|"attendance", xp_earned: int }
    """
    from collections import defaultdict

    totals: dict[str, int] = defaultdict(int)
    for row in xp_history:
        source = row.get("source", "other")
        totals[source] += int(row.get("xp_earned", 0))

    return [{"source": k, "xp": v} for k, v in totals.items()]


def build_weekly_progress(xp_history: list[dict[str, Any]], weeks: int = 8) -> list[dict]:
    """
    Aggregate XP into weekly buckets for an AreaChart.
    """
    from collections import defaultdict

    weekly: dict[str, int] = defaultdict(int)
    for row in xp_history:
        try:
            d = date.fromisoformat(row.get("date", "")[:10])
            # ISO week label: "2026-W05"
            week_label = f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}"
            weekly[week_label] += int(row.get("xp_earned", 0))
        except ValueError:
            pass

    sorted_weeks = sorted(weekly)[-weeks:]
    return [{"week": w, "xp": weekly[w]} for w in sorted_weeks]
