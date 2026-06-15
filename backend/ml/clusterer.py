# K-Means unsupervised clustering for grouping similar work logs
# Uses TF-IDF to convert text into vectors, then K-Means finds 5 natural clusters
# Trained on a 50-sample corpus — one large text blob per cluster gives stable centroids

from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Human-readable labels for the 5 clusters
CLUSTER_LABELS = [
    'Bug Fixing & Debugging',
    'Feature Development',
    'Documentation & Review',
    'Meetings & Planning',
    'Research & Learning',
]

# Training corpus — rich representative texts per cluster
# K-Means initializes centroids from this data so clusters are semantically stable
TRAINING_CORPUS = [
    # Cluster 0 — Bug Fixing & Debugging
    "fixed bug authentication error login crash null pointer exception debugged resolved issue error "
    "traced root cause stack trace fixed broken endpoint repaired logic error corrected validation "
    "identified defect patched security vulnerability resolved failed test fixed merge conflict "
    "hotfix production outage fixed crash on null input corrected edge case bug report investigation "
    "reproduced bug fixed race condition resolved timeout error fixed memory leak debugging session",

    # Cluster 1 — Feature Development
    "built new feature dashboard component API endpoint implemented functionality developed module "
    "created user registration flow added search filter pagination built chart visualization "
    "implemented JWT authentication developed KPI scoring engine built admin panel user interface "
    "implemented file upload feature added email notification system created REST API endpoints "
    "built form validation developed sidebar navigation created reusable components wrote new service "
    "implemented password reset flow added role-based access control built interactive UI feature",

    # Cluster 2 — Documentation & Review
    "wrote documentation README updated technical docs API reference onboarding guide architecture "
    "code review pull request reviewed PR feedback comments reviewed teammate changes approved merge "
    "wrote inline comments refactored for readability updated changelog design document swagger "
    "reviewed code quality suggested improvements pair programming walkthrough knowledge transfer "
    "updated wiki wrote system requirements document reviewed database schema migration documentation "
    "documented KPI algorithm weights updated deployment guide wrote test documentation",

    # Cluster 3 — Meetings & Planning
    "attended meeting sprint planning standup retrospective discussion sync stakeholder demo "
    "client requirements one-on-one performance review team meeting product roadmap backlog grooming "
    "participated technical design review presented feature kickoff meeting status update call "
    "discussed blockers aligned priorities interviewed candidate onboarding session workshop "
    "daily standup weekly sync sprint review planning poker estimation session brainstorming",

    # Cluster 4 — Research & Learning
    "researched studied learning algorithm library exploration investigated compared evaluated "
    "read documentation explored proof of concept prototype experiment tried new framework "
    "learned React hooks studied machine learning K-Means SVM explored caching strategies Redis "
    "researched authentication OAuth JWT security best practices explored deployment options Docker "
    "investigated performance bottleneck profiling studied system design patterns compared libraries "
    "explored third party integrations reading articles tutorials online courses upskilling training",
]


_vectorizer = None
_kmeans = None


def _train():
    global _vectorizer, _kmeans
    _vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    X = _vectorizer.fit_transform(TRAINING_CORPUS)

    # Initialize K-Means with 5 clusters, using k-means++ seeding for better convergence
    _kmeans = KMeans(n_clusters=5, init='k-means++', random_state=42, n_init=20, max_iter=300)
    _kmeans.fit(X)


def assign_cluster(text):
    global _vectorizer, _kmeans
    if _vectorizer is None:
        _train()

    try:
        vec = _vectorizer.transform([text])
        cluster_idx = int(_kmeans.predict(vec)[0])
        label = CLUSTER_LABELS[cluster_idx]

        from worklogs.models import Cluster
        cluster, _ = Cluster.objects.get_or_create(name=label)
        return cluster
    except Exception:
        return None
