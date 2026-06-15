# Summary generation engine — auto-generates a weekly performance summary for an employee
# Uses TF-IDF extractive summarisation plus aggregate stats

from datetime import timedelta

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from worklogs.models import WorkLog
from .models import Summary


# ── Extractive summarisation ──────────────────────────────────────────────────

def extractive_summary(log_texts, n=3):
    """Return the n most representative sentences using TF-IDF scoring."""
    sentences = []
    for text in log_texts:
        for s in text.replace('!', '.').replace('?', '.').split('.'):
            s = s.strip()
            if len(s) > 15:
                sentences.append(s)

    if not sentences:
        return ""
    if len(sentences) <= n:
        return '. '.join(sentences) + '.'

    try:
        vec = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        mat = vec.fit_transform(sentences)
        scores = np.array(mat.sum(axis=1)).flatten()
        top = sorted(scores.argsort()[-n:][::-1])
        return '. '.join(sentences[i] for i in top) + '.'
    except Exception:
        return '. '.join(sentences[:n]) + '.'


# ── Main generator ────────────────────────────────────────────────────────────

def generate_summary(user, week_start):
    week_end = week_start + timedelta(days=6)

    # Fetch all logs for this user in the given week, including category info
    logs = list(WorkLog.objects.filter(
        user=user, date__range=(week_start, week_end)
    ).select_related('svm_category', 'cluster'))

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

    # ── Extractive AI summary from log texts ──────────────────────────────
    log_texts = [l.log_text for l in logs]
    ai_excerpt = extractive_summary(log_texts, n=3)

    # ── Build the final rich summary text ─────────────────────────────────
    hours_line = (
        f' Total hours logged: {total_hours:.1f}h.'
        if total_hours > 0 else ''
    )

    text = (
        f"{user.name} submitted {total} work log(s) during the week of "
        f"{week_start.strftime('%B %d, %Y')}. "
        f"They planned {planned} task(s) and completed {completed} "
        f"({completion_rate}% completion rate).{hours_line} "
        f"Top SVM categories: {cat_str}. "
        f"Top activity clusters: {cluster_str}. "
        f"Highlights: {ai_excerpt}"
    )

    # Save or update the summary for this user and week
    summary, _ = Summary.objects.update_or_create(
        user=user, week_start=week_start,
        defaults={'summary_text': text}
    )
    return summary
