import re
from datetime import timedelta

from worklogs.models import WorkLog
from .models import Summary


# ── Blocker detection ─────────────────────────────────────────────────────────

_BLOCKER_PATTERNS = [
    r'\bblocked\b', r'\bblocker\b', r'\bblocking\b',
    r'\bwaiting for\b', r'\bwaiting on\b', r'\bpending\b',
    r"couldn't complete", r'\bcould not complete\b',
    r'\bunable to\b', r'\bstuck on\b', r'\bstuck\b',
    r'\bdepends on\b', r'\bdependency\b', r'\bescalated\b',
    r'\bno access\b', r'\bno response\b', r'\boverdue\b',
    r'\bdelayed\b', r'\bdelay\b', r'\bneed approval\b',
    r'\bawaiting\b', r'\bblocked by\b',
]

_BLOCKER_RE = re.compile('|'.join(_BLOCKER_PATTERNS), re.IGNORECASE)


def detect_blockers(logs):
    """Return a deduplicated list of sentences that signal blockers."""
    blockers = []
    seen = set()
    for log in logs:
        text = (log.log_text or '').replace('!', '.').replace('?', '.')
        for sentence in text.split('.'):
            s = sentence.strip()
            if len(s) > 10 and _BLOCKER_RE.search(s):
                key = s.lower()
                if key not in seen:
                    seen.add(key)
                    blockers.append(s)
    return blockers[:5]  # cap at 5 to keep summary concise


# ── Extractive summarisation ──────────────────────────────────────────────────

def extractive_summary(logs, n=3):
    """Divide the period into n equal time bands (by log position after date-sort)
    and pick the first unique sentence found in each band. Scanning the whole band
    means repeated log text doesn't block a highlight — we keep looking until we
    find something unseen. 1 Month and 1 Year cover different date ranges so their
    bands contain different logs, producing different highlights."""
    if not logs:
        return []

    total = len(logs)
    highlights = []
    seen = set()
    band_size = max(1, total // n)

    for band in range(n):
        start = band * band_size
        end = total if band == n - 1 else (band + 1) * band_size
        for log in logs[start:end]:
            text = (log.log_text or '').replace('!', '.').replace('?', '.')
            found = False
            for s in text.split('.'):
                s = s.strip()
                if len(s) > 15:
                    key = s.lower()
                    if key not in seen:
                        seen.add(key)
                        highlights.append(s)
                        found = True
                        break
            if found:
                break  # move on to the next band

    return highlights


# ── Main generator ────────────────────────────────────────────────────────────

def generate_summary(user, week_start, date_to=None, period_type=None):
    week_end = date_to if date_to else week_start + timedelta(days=6)

    # Fetch all logs for this user in the given week, including category info
    logs = list(WorkLog.objects.filter(
        user=user, date__range=(week_start, week_end)
    ).select_related('svm_category', 'cluster').order_by('date'))

    if not logs:
        return None

    total = len(logs)
    planned = sum(l.tasks_planned for l in logs)
    completed = sum(l.tasks_completed for l in logs)
    total_hours = sum(float(l.hours_worked) for l in logs if l.hours_worked is not None)

    # Count how many logs fall into each SVM category
    category_counts = {}
    for log in logs:
        if log.svm_category:
            category_counts[log.svm_category.name] = category_counts.get(log.svm_category.name, 0) + 1

    # Count how many logs fall into each K-Means cluster
    cluster_counts = {}
    for log in logs:
        if log.cluster:
            cluster_counts[log.cluster.name] = cluster_counts.get(log.cluster.name, 0) + 1

    # Pick the top 3 most frequent categories / clusters
    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_clusters = sorted(cluster_counts.items(), key=lambda x: x[1], reverse=True)[:3]

    cat_str = (
        ', '.join(f'{c} ({n})' for c, n in top_categories)
        if top_categories else 'various tasks'
    )
    cluster_str = (
        ', '.join(f'{c} ({n})' for c, n in top_clusters)
        if top_clusters else 'various activities'
    )

    completion_rate = round(completed / planned * 100) if planned > 0 else 0

    # 3 highlights, sampled from start/middle/end of the period window
    highlight_list = extractive_summary(logs, n=3)

    # ── Build structured summary text (parsed by SummaryCard in frontend) ──
    cat_names    = ', '.join(c for c, _ in top_categories) if top_categories else 'Various'
    cluster_names = ', '.join(c for c, _ in top_clusters) if top_clusters else 'Various'

    highlight_lines = '\n'.join(f'• {h}' for h in highlight_list)

    lines = [
        f'Total logs: {total}',
        f'Completion rate: {completion_rate}%',
        f'Top categories: {cat_names}',
        f'Top clusters: {cluster_names}',
    ]
    if total_hours > 0:
        lines.insert(1, f'Total hours: {total_hours:.1f}h')

    if highlight_lines:
        lines.append('Key highlights:')
        lines.append(highlight_lines)

    # Blocker detection: scan all logs for impediment signals
    blocker_list = detect_blockers(logs)
    if blocker_list:
        lines.append('Blockers detected:')
        lines.append('\n'.join(f'⚠ {b}' for b in blocker_list))

    text = '\n'.join(lines)

    if period_type:
        # Named periods (1w, 1m, 3m, 6m, 1y, all) always replace the previous record
        # for that period so "1 Month" never creates a second card.
        Summary.objects.filter(user=user, period_type=period_type).delete()
        summary = Summary.objects.create(
            user=user, week_start=week_start, period_end=week_end,
            period_type=period_type, summary_text=text,
        )
    else:
        # Date-specific summaries keep the original unique key
        summary, _ = Summary.objects.update_or_create(
            user=user, week_start=week_start, period_end=week_end,
            defaults={'summary_text': text},
        )
    return summary
