from datetime import date, timedelta
from worklogs.models import WorkLog
from .models import KpiScore, KpiRule


# ── Keyword banks reflecting real office language ─────────────────────────────
# Each keyword set targets genuine workplace behaviours, not generic tech verbs.

DEFAULT_KEYWORDS = {
    # Leadership: employee is directing, facilitating, or developing others
    'leadership': [
        'led', 'lead', 'managed', 'mentored', 'coached', 'guided', 'directed',
        'facilitated', 'chaired', 'delegated', 'assigned tasks', 'presented to',
        'onboarded', 'trained', 'conducted the', 'oversaw', 'supervised',
        'took ownership', 'drove', 'spearheaded', 'organised', 'organized',
        'ran the meeting', 'ran the session', 'ran the review', 'headed',
        'gave feedback', 'resolved conflict', 'set direction', 'briefed',
    ],

    # Collaboration: working alongside colleagues, not just solo output
    'collaboration': [
        'collaborated', 'partnered', 'worked with', 'paired with', 'pair programmed',
        'helped', 'assisted', 'supported', 'reviewed', 'discussed with',
        'synced with', 'aligned with', 'met with', 'joined the team',
        'cross-functional', 'across teams', 'alongside', 'together with',
        'with the team', 'with engineering', 'with product', 'with design',
        'with stakeholders', 'with management', 'shared knowledge',
        'gave a walkthrough', 'code review', 'pr review', 'pull request review',
    ],

    # Innovation: improving or replacing something, NOT just routine creation
    # Key distinction: refactoring existing > building new > doing assigned work
    'innovation': [
        'refactored', 'optimised', 'optimized', 'automated', 'streamlined',
        'redesigned', 'revamped', 'overhauled', 'simplified', 'improved',
        'enhanced', 'reduced', 'eliminated manual', 'from scratch',
        'new approach', 'better solution', 'replaced', 'migrated from',
        'increased efficiency', 'cut time', 'cut down', 'introduced new',
        'pioneered', 'rethought', 'rebuilt', 'modernised', 'modernized',
        'process improvement', 'workflow improvement', 'bottleneck',
    ],

    # Learning: deliberate knowledge acquisition, not just doing tasks
    'learning': [
        'learned', 'learnt', 'studied', 'researched', 'explored',
        'investigated', 'read documentation', 'read the docs', 'read about',
        'completed course', 'took training', 'attended workshop', 'seminar',
        'experimented', 'proof of concept', 'poc', 'spike',
        'benchmarked', 'evaluated options', 'compared approaches',
        'upskilled', 'certification', 'self-study', 'tutorial',
        'looked into', 'deep dive', 'deep-dive', 'prototype', 'trial',
    ],
}


def seed_kpi_rules():
    """Insert default KPI rules if the table is empty."""
    if KpiRule.objects.exists():
        return
    for metric, keywords in DEFAULT_KEYWORDS.items():
        for kw in keywords:
            KpiRule.objects.get_or_create(metric=metric, keyword=kw)


def get_week_start(d=None):
    d = d or date.today()
    return d - timedelta(days=d.weekday())


def calculate_kpi(user, week_start=None, single_date=None, date_from=None, date_to=None):
    if date_from and date_to:
        week_start = date_from
        week_end = date_to
    elif single_date:
        week_start = single_date
        week_end = single_date
    else:
        week_start = week_start or get_week_start()
        week_end = week_start + timedelta(days=6)

    logs = list(WorkLog.objects.filter(user=user, date__range=(week_start, week_end)))
    if not logs:
        return None

    # Build keyword map from DB rules; fall back to hardcoded defaults
    rules = list(KpiRule.objects.all())
    keyword_map = {}
    for rule in rules:
        keyword_map.setdefault(rule.metric, []).append(rule.keyword.lower())
    if not keyword_map:
        keyword_map = {k: list(v) for k, v in DEFAULT_KEYWORDS.items()}

    # ── Productivity ─────────────────────────────────────────────────────────
    # Core delivery metric: how many of the planned tasks were actually completed.
    total_planned   = sum(log.tasks_planned for log in logs)
    total_completed = sum(log.tasks_completed for log in logs)
    task_rate = (total_completed / total_planned) if total_planned > 0 else 0

    # Optional hours signal: reward average 6–8 h days; penalise very short days
    logs_with_hours = [l for l in logs if l.hours_worked is not None and float(l.hours_worked) > 0]
    if logs_with_hours:
        avg_hours = sum(float(l.hours_worked) for l in logs_with_hours) / len(logs_with_hours)
        hours_factor = min(1.0, avg_hours / 7.0)
        productivity = min(100, round((task_rate * 0.80 + hours_factor * 0.20) * 100, 2))
    else:
        productivity = min(100, round(task_rate * 100, 2))

    # ── Consistency ───────────────────────────────────────────────────────────
    # Attendance rate anchored to the employee's first log in the period so
    # new joiners are not penalised for days before they started.
    actual_start = min(log.date for log in logs)
    active_calendar_days = (week_end - actual_start).days + 1
    expected_work_days = max(1, round(active_calendar_days * 5 / 7))
    unique_log_days = len(set(log.date for log in logs))
    consistency = min(100, round(unique_log_days / expected_work_days * 100, 2))

    # ── Quality ───────────────────────────────────────────────────────────────
    # Combines task delivery quality with log descriptiveness (detail level).
    # A well-written log signals thoughtful work; a one-word log signals low
    # engagement even if tasks were technically completed.
    avg_words = sum(len(log.log_text.split()) for log in logs) / len(logs)
    log_richness = min(100, round(avg_words / 25 * 100, 2))  # 25 words = full richness
    quality = min(100, round(productivity * 0.45 + consistency * 0.35 + log_richness * 0.20, 2))

    # ── Diversity ─────────────────────────────────────────────────────────────
    # Measures breadth of work types using both SVM categories and K-Means clusters.
    # 5+ distinct SVM categories = full category score.
    # 3+ distinct K-Means clusters = full cluster score.
    categories = set(log.svm_category_id for log in logs if log.svm_category_id)
    clusters   = set(log.cluster_id      for log in logs if log.cluster_id)
    cat_score     = min(100, round(len(categories) / 5 * 100, 2))
    cluster_score = min(100, round(len(clusters)   / 3 * 100, 2))
    diversity = round(cat_score * 0.55 + cluster_score * 0.45, 2)

    # ── Keyword-based metrics ─────────────────────────────────────────────────
    # Score = fraction of logs containing any keyword for that metric × 200
    # (capped at 100).  Fraction-based scoring means longer periods do not
    # automatically outscore shorter ones — regularity matters, not just count.
    def keyword_score(metric):
        kws = keyword_map.get(metric, [])
        if not kws:
            return 0
        logs_with_skill = sum(
            1 for log in logs
            if any(kw in log.log_text.lower() for kw in kws)
        )
        fraction = logs_with_skill / len(logs)
        return min(100, round(fraction * 200, 2))

    leadership    = keyword_score('leadership')
    collaboration = keyword_score('collaboration')
    innovation    = keyword_score('innovation')
    learning      = keyword_score('learning')

    # ── Overall score ─────────────────────────────────────────────────────────
    # Weights reflect a modern office environment where consistent delivery and
    # teamwork are as important as raw output.
    #   Productivity  20% — core delivery
    #   Consistency   20% — reliable engagement
    #   Collaboration 15% — teamwork (critical in hybrid workplaces)
    #   Quality       15% — how well the work is done
    #   Leadership    10% — growth as a contributor
    #   Innovation    10% — improving processes and outcomes
    #   Learning       5% — professional development
    #   Diversity      5% — breadth of contribution
    scores  = [productivity, consistency, quality, diversity, leadership, collaboration, innovation, learning]
    weights = [0.20,         0.20,        0.15,    0.05,      0.10,       0.15,          0.10,       0.05]
    overall = round(sum(w * s for w, s in zip(weights, scores)), 2)

    kpi, _ = KpiScore.objects.update_or_create(
        user=user, week_start=week_start,
        defaults={
            'productivity':  productivity,
            'consistency':   consistency,
            'quality':       quality,
            'diversity':     diversity,
            'leadership':    leadership,
            'collaboration': collaboration,
            'innovation':    innovation,
            'learning':      learning,
            'overall':       overall,
        }
    )
    return kpi


# ── Explainability ────────────────────────────────────────────────────────────
# Generate a plain-English reason for each metric score so employees
# understand what drove their grade and what to do next.

def explain_kpi(kpi):
    """Return a dict of one-sentence explanations keyed by metric name."""

    def _explain(metric, score):
        s = float(score)

        if metric == 'productivity':
            if s >= 90: return f"Excellent — you completed ~{s:.0f}% of your planned tasks this period."
            if s >= 75: return f"Good — you completed ~{s:.0f}% of your planned tasks. Aim for 90%+ consistently."
            if s >= 50: return f"Average — only ~{s:.0f}% task completion. Try breaking tasks into smaller, achievable units."
            return f"Needs work — ~{s:.0f}% task completion. Plan fewer tasks per day and focus on finishing what you start."

        if metric == 'consistency':
            if s >= 85: return "Excellent — you logged work on nearly every expected work day."
            if s >= 65: return f"Good — you logged on about {s:.0f}% of work days. Aim for a daily log habit."
            if s >= 40: return f"Average — logs were submitted on ~{s:.0f}% of expected work days. Even a short daily entry helps."
            return "Low — very few logs this period. Submit a log every working day, even if brief."

        if metric == 'quality':
            if s >= 80: return "High quality — strong task completion paired with detailed, descriptive logs."
            if s >= 60: return "Good quality — solid output. Adding more detail to your logs will push this higher."
            if s >= 40: return "Average — improve both task completion rate and log descriptiveness together."
            return "Needs improvement — focus on completing tasks fully and writing more descriptive logs."

        if metric == 'diversity':
            if s >= 80: return "Wide range — you contributed across many different types of work this period."
            if s >= 50: return "Moderate range — some variety in your work. Try contributing across more activity types."
            return "Narrow range — most work is concentrated in one area. Broadening your involvement helps the team."

        if metric == 'leadership':
            if s >= 80: return "Strong leadership — you frequently facilitated, mentored, or guided colleagues."
            if s >= 40: return "Some leadership signals present. Mention when you run meetings, mentor others, or delegate tasks."
            return "Low — few leadership behaviours detected. Log when you present, train, coach, or take ownership of outcomes."

        if metric == 'collaboration':
            if s >= 80: return "Highly collaborative — you regularly worked with and supported teammates."
            if s >= 40: return "Some collaboration present. Mention joint work, code reviews, and cross-team discussions more explicitly."
            return "Low — few collaboration signals. Log when you work with colleagues, give feedback, or join team sessions."

        if metric == 'innovation':
            if s >= 80: return "Strong innovation — you regularly improved, automated, or redesigned processes."
            if s >= 40: return "Some innovation present. Highlight when you refactor, optimise, or introduce a better approach."
            return "Low — few improvement signals detected. Log when you automate tasks, streamline processes, or find efficiencies."

        if metric == 'learning':
            if s >= 80: return "Strong learning — you actively researched, experimented, and upskilled this period."
            if s >= 40: return "Some learning present. Document research sessions, proof-of-concept work, and new knowledge gained."
            return "Low — few learning signals. Log when you research topics, complete training, or experiment with new tools."

        return f"{s:.0f}/100"

    return {
        'productivity':  _explain('productivity',  kpi.productivity),
        'consistency':   _explain('consistency',   kpi.consistency),
        'quality':       _explain('quality',       kpi.quality),
        'diversity':     _explain('diversity',     kpi.diversity),
        'leadership':    _explain('leadership',    kpi.leadership),
        'collaboration': _explain('collaboration', kpi.collaboration),
        'innovation':    _explain('innovation',    kpi.innovation),
        'learning':      _explain('learning',      kpi.learning),
    }
