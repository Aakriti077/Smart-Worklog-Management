# KPI calculation engine — rule-based scoring system
# Calculates 8 performance metrics for a user based on their weekly work logs

from datetime import date, timedelta
from worklogs.models import WorkLog
from .models import KpiScore, KpiRule


# Fallback keywords used when the kpi_rules table is empty
DEFAULT_KEYWORDS = {
    'leadership': [
        'led', 'mentored', 'guided', 'coordinated', 'supervised',
        'managed', 'directed', 'presented', 'delegated', 'trained',
    ],
    'collaboration': [
        'collaborated', 'helped', 'assisted', 'partnered', 'team',
        'shared', 'supported', 'pair', 'reviewed', 'assisted',
    ],
    'innovation': [
        'improved', 'optimized', 'refactored', 'automated', 'redesigned',
        'approach', 'created', 'built', 'enhanced', 'streamlined',
    ],
    'learning': [
        'learned', 'studied', 'researched', 'explored', 'investigated',
        'documentation', 'training', 'course', 'understood', 'experimented',
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
    # Returns the Monday of the current (or given) week
    d = d or date.today()
    return d - timedelta(days=d.weekday())


def calculate_kpi(user, week_start=None):
    week_start = week_start or get_week_start()
    week_end = week_start + timedelta(days=6)

    # Fetch all logs submitted by this user during the week
    logs = list(WorkLog.objects.filter(user=user, date__range=(week_start, week_end)))
    if not logs:
        return None

    # Build a keyword map from the kpi_rules table: { metric: [keywords] }
    rules = list(KpiRule.objects.all())
    keyword_map = {}
    for rule in rules:
        keyword_map.setdefault(rule.metric, []).append(rule.keyword.lower())

    # Fall back to hardcoded keywords if the table is empty
    if not keyword_map:
        keyword_map = {k: list(v) for k, v in DEFAULT_KEYWORDS.items()}

    # Combine all log texts into one string for keyword matching
    all_text = ' '.join(log.log_text.lower() for log in logs)

    total_planned = sum(log.tasks_planned for log in logs)
    total_completed = sum(log.tasks_completed for log in logs)

    # Productivity = tasks completed / tasks planned * 100
    productivity = min(100, round((total_completed / total_planned * 100) if total_planned > 0 else 0, 2))

    # Consistency — prefer hours_worked when available, else use log-count method
    total_hours = sum(
        float(log.hours_worked) for log in logs if log.hours_worked is not None
    )
    if total_hours > 0:
        # Treat 40 hours/week as full consistency
        consistency = min(100, round((total_hours / 40) * 100, 2))
    else:
        # Fall back: how many days out of 5 the employee logged work
        consistency = min(100, round(len(logs) / 5 * 100, 2))

    # Diversity = how many different SVM categories appeared in the logs
    categories = set(log.svm_category_id for log in logs if log.svm_category_id)
    diversity = min(100, round(len(categories) / 5 * 100, 2))

    # Quality = average of productivity and consistency
    quality = min(100, round((productivity + consistency) / 2, 2))

    # Keyword-based scoring: count how many keywords for a metric appear in the logs
    def keyword_score(metric):
        kws = keyword_map.get(metric, [])
        hits = sum(1 for kw in kws if kw in all_text)
        return min(100, round(hits / max(len(kws), 1) * 100, 2))

    leadership = keyword_score('leadership')
    collaboration = keyword_score('collaboration')
    innovation = keyword_score('innovation')
    learning = keyword_score('learning')

    # Weighted average to compute overall score
    # Productivity has the highest weight (25%) as it is the core metric
    weights = [0.25, 0.15, 0.15, 0.10, 0.10, 0.10, 0.10, 0.05]
    scores = [productivity, consistency, quality, diversity, leadership, collaboration, innovation, learning]
    overall = round(sum(w * s for w, s in zip(weights, scores)), 2)

    # Save or update the KPI record for this user and week
    kpi, _ = KpiScore.objects.update_or_create(
        user=user, week_start=week_start,
        defaults={
            'productivity': productivity,
            'consistency': consistency,
            'quality': quality,
            'diversity': diversity,
            'leadership': leadership,
            'collaboration': collaboration,
            'innovation': innovation,
            'learning': learning,
            'overall': overall,
        }
    )
    return kpi
