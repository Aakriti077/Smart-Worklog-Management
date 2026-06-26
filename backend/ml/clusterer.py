import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

CLUSTER_LABELS = [
    'Bug Fixing & Debugging',
    'Feature Development',
    'Documentation & Review',
    'Meetings & Planning',
    'Research & Learning',
]

# Distance threshold on L2-normalised vectors (cosine distance ≈ Euclidean/√2)
# On unit-sphere vectors, distance 0 = identical, distance √2 ≈ 1.41 = orthogonal
# Unrelated text shares no vocabulary → distance near √2; set cutoff at 1.20
DISTANCE_THRESHOLD = 1.20

# Representative sentences per cluster (hand-curated, ~60 each)
TRAINING_CORPUS = {
    'Bug Fixing & Debugging': [
        # Engineering bugs
        "fixed authentication bug in the login flow",
        "debugged null pointer exception in user service",
        "resolved failing unit tests in CI pipeline",
        "patched security vulnerability in API endpoint",
        "fixed memory leak in background worker",
        "traced root cause of production 500 error",
        "fixed broken database migration script",
        "resolved merge conflict in feature branch",
        "identified and fixed race condition in scheduler",
        "fixed CSS layout bug on mobile screens",
        "debugged slow SQL query causing timeout",
        "fixed regression introduced in last release",
        "resolved token expiry bug in authentication",
        "fixed incorrect validation logic in form",
        "debugged WebSocket connection dropping issue",
        "fixed broken import in configuration module",
        "resolved test assertion failure in serializer",
        "patched CORS error blocking API requests",
        "fixed edge case crash on empty input",
        "debugged intermittent failure in integration test",
        "resolved null reference error in data pipeline",
        "fixed incorrect HTTP status code in API response",
        "traced and fixed infinite loop in retry logic",
        "resolved environment variable misconfiguration",
        "fixed broken redirect after login",
        "debugged incorrect date formatting in report",
        "fixed permission check bypassed by query parameter",
        "resolved database deadlock in concurrent requests",
        "fixed failing end-to-end test in staging",
        "patched XSS vulnerability in user input field",
        # Non-engineering bug fixes (data, process, systems)
        "found and corrected the data entry error in the monthly report",
        "fixed the incorrect formula in the budget spreadsheet",
        "corrected the wrong customer email in the CRM system",
        "resolved the duplicate record issue in the client database",
        "fixed the broken link in the employee handbook",
        "corrected a calculation error in the payroll file",
        "tracked down and fixed the wrong price in the product catalogue",
        "resolved an error in the quarterly financial statements",
        "fixed the data import issue causing duplicate invoices",
        "corrected the misconfigured alert that was sending false alarms",
        "resolved the booking system error causing double scheduling",
        "fixed the broken form on the HR portal that prevented submissions",
        "tracked down the source of incorrect sales figures in the report",
        "corrected a process error causing delays in the approval workflow",
        "resolved the mismatch between contract and invoice amounts",
    ],
    'Feature Development': [
        # Engineering features
        "built new React dashboard component with charts",
        "implemented JWT token refresh endpoint",
        "created REST API for user profile management",
        "developed KPI scoring engine with weighted metrics",
        "built search and filter functionality for logs table",
        "implemented file upload feature with progress bar",
        "created email notification service for alerts",
        "built role-based access control for admin panel",
        "developed pagination for API response",
        "implemented dark mode toggle in settings page",
        "built interactive data visualisation with Recharts",
        "created onboarding flow for new users",
        "implemented password reset via email link",
        "built reusable modal component library",
        "developed background job for scheduled reports",
        "created webhook handler for third party events",
        "implemented real-time updates with WebSocket",
        "built responsive mobile layout for dashboard",
        "developed export to CSV feature for reports",
        "implemented two-factor authentication flow",
        "built admin user management interface",
        "created drag and drop task board UI",
        "implemented infinite scroll for activity feed",
        "built API rate limiting middleware",
        "developed analytics tracking for user actions",
        "set up CI/CD pipeline with GitHub Actions",
        "configured Docker containers for development",
        "deployed application to production server",
        "automated deployment scripts for releases",
        "configured Nginx reverse proxy and load balancer",
        # Non-engineering delivery work
        "launched the new employee referral programme this week",
        "rolled out the updated onboarding checklist for new hires",
        "created a new client proposal template for the sales team",
        "built the quarterly KPI tracking spreadsheet for the team",
        "set up the new project in Jira and configured workflows",
        "delivered the new pricing structure to the sales team",
        "introduced the new expense submission process company-wide",
        "created an automated weekly report for department heads",
        "developed the new social media content calendar for Q4",
        "launched the updated performance review process this cycle",
        "built out the new customer success playbook for CSMs",
        "completed and delivered the market analysis for the board",
        "finalised and shared the new vendor evaluation framework",
        "created the product demo environment for sales calls",
        "designed and delivered the team training programme",
    ],
    'Documentation & Review': [
        # Engineering docs and code reviews
        "wrote API documentation in Swagger format",
        "reviewed pull request and left detailed feedback",
        "updated README with setup instructions",
        "documented database schema and relationships",
        "wrote technical design document for new feature",
        "reviewed code changes for security vulnerabilities",
        "created onboarding guide for new developers",
        "updated changelog with breaking changes",
        "wrote inline comments for complex functions",
        "reviewed merge request for code quality",
        "documented KPI scoring algorithm and weights",
        "wrote architecture diagram for the system",
        "updated deployment guide with new configuration",
        "reviewed database migration for correctness",
        "wrote test documentation and test plan",
        "updated API reference with new endpoints",
        "conducted code walkthrough with team member",
        "reviewed frontend component for accessibility",
        "wrote runbook for production incident response",
        "approved pull request after reviewing all changes",
        "documented API error codes and responses",
        "wrote release notes for new version",
        "reviewed performance improvement PR",
        "updated wiki with new architecture decisions",
        "wrote specification document for new module",
        "reviewed dependency updates for security",
        "documented environment setup for local development",
        "wrote postmortem report after production incident",
        "reviewed data model changes for correctness",
        "updated technical documentation for API clients",
        # Non-engineering documentation and review work
        "reviewed and updated the HR policy handbook",
        "wrote the process documentation for the finance team",
        "reviewed the vendor contract before signing",
        "updated the sales playbook with new objection handling",
        "wrote the monthly summary report for the department",
        "reviewed the marketing copy for the new campaign",
        "documented the new compliance procedure for the team",
        "reviewed and approved the budget proposal",
        "wrote the project brief for the Q4 initiative",
        "updated the client onboarding guide with new steps",
        "reviewed the customer support escalation procedures",
        "documented the recruitment process for new managers",
        "wrote the internal announcement for the new policy",
        "reviewed the financial model before presenting to leadership",
        "updated the training materials with the latest product changes",
    ],
    'Meetings & Planning': [
        # Engineering meetings
        "attended daily standup with the development team",
        "participated in sprint planning meeting",
        "joined sprint retrospective and discussed blockers",
        "attended client requirements gathering session",
        "presented new feature proposal to stakeholders",
        "conducted one-on-one performance review with manager",
        "joined product roadmap discussion meeting",
        "attended backlog grooming and estimation session",
        "participated in technical design review meeting",
        "attended all-hands company meeting",
        "joined cross-team sync to align on priorities",
        "presented demo to stakeholders and gathered feedback",
        "attended onboarding session for new team member",
        "participated in vendor evaluation call",
        "joined weekly team sync meeting",
        "attended release planning meeting for next sprint",
        "participated in architecture review discussion",
        "joined hiring interview panel for new developer",
        "attended quarterly business review meeting",
        "participated in knowledge sharing session",
        "joined department sync to discuss project status",
        "attended design critique and brainstorming session",
        "participated in incident postmortem meeting",
        "joined workshop on new development practices",
        "attended planning poker estimation session",
        "participated in stakeholder alignment meeting",
        "joined team meeting to discuss project blockers",
        "attended sprint review and demo session",
        "participated in leadership briefing",
        "joined training session on new tools and processes",
        # Non-engineering meetings and planning
        "ran the monthly performance review cycle with the team",
        "attended the quarterly finance review with the CFO",
        "joined the sales pipeline review call with the regional manager",
        "participated in the cross-functional product planning session",
        "met with the legal team to discuss contract terms",
        "joined the customer success call to review account health",
        "attended the department heads meeting to set Q4 priorities",
        "participated in the hiring debrief for the open product role",
        "ran the bi-weekly team sync to align on deliverables",
        "attended the investor update call with the exec team",
        "joined the HR town hall and noted action items",
        "participated in the vendor onboarding call",
        "met with the finance team to discuss budget allocation",
        "joined the kick-off meeting for the new client project",
        "attended the end-of-year planning session with leadership",
    ],
    'Research & Learning': [
        # Engineering research
        "researched Redis caching strategies for performance",
        "studied machine learning classification algorithms",
        "explored React state management options",
        "investigated WebSocket vs SSE for real-time updates",
        "evaluated third-party payment gateway options",
        "read documentation for new Django REST framework features",
        "researched best practices for API design",
        "explored Docker and Kubernetes for containerisation",
        "studied TF-IDF and SVM for text classification",
        "investigated database indexing strategies for performance",
        "researched OAuth2 and JWT for authentication",
        "explored GraphQL as alternative to REST API",
        "studied cloud cost optimisation strategies on AWS",
        "investigated microservices vs monolith architecture",
        "researched accessibility guidelines for UI components",
        "explored charting libraries for data visualisation",
        "studied PostgreSQL query optimisation techniques",
        "investigated NoSQL vs SQL for the data model",
        "researched rate limiting and throttling approaches",
        "explored serverless architecture for background jobs",
        "studied Celery for background task processing",
        "investigated search engine options like ElasticSearch",
        "researched frontend build tool alternatives",
        "explored message broker options RabbitMQ vs Kafka",
        "studied observability and monitoring best practices",
        "investigated encryption approaches for sensitive data",
        "researched WCAG accessibility compliance requirements",
        "explored real-time collaboration features implementation",
        "studied system design patterns for scalability",
        "investigated performance profiling tools for Python",
        # Self-study and learning sentences
        "learned to code in Python and practiced exercises",
        "learned coding concepts and documented my progress",
        "practiced programming and noted what I learned",
        "learned about algorithms and worked through examples",
        "self-studied JavaScript fundamentals and wrote notes",
        "took an online course and documented key takeaways",
        "learned a new framework and practiced building examples",
        "went through a coding tutorial and completed exercises",
        "practiced coding challenges to improve my skills",
        "learned system design concepts through reading and practice",
        "upskilled in React by following tutorials",
        "completed a self-study session on design patterns",
        "learned about clean code principles and practised them",
        "studied new library documentation and built a prototype",
        "worked through tutorial on how to code and document it",
        "learned programming skills and kept notes on progress",
        "learned to code and write documentation for it",
        "practiced new skills and tracked my learning journey",
        "self-taught myself a new language through exercises",
        "followed a learning course and documented what I studied",
        # Non-engineering research and learning
        "researched competitors to understand the market landscape",
        "studied best practices for employee performance management",
        "explored new sales methodologies and frameworks",
        "read industry reports on market trends for the sector",
        "investigated tools for automating the finance reconciliation process",
        "researched customer feedback to identify key product gaps",
        "studied effective recruitment strategies for tech roles",
        "explored new marketing channels and evaluated their ROI potential",
        "investigated compliance requirements for the new regulation",
        "read up on change management strategies for the restructure",
        "researched best practices for customer success in SaaS",
        "studied leadership development frameworks and approaches",
        "explored data governance practices for the analytics team",
        "investigated pricing strategies used by competitors",
        "researched vendor options for the new procurement system",
    ],
}


_vectorizer = None
_kmeans = None


def _train():
    global _vectorizer, _kmeans

    all_texts = []
    all_labels = []
    for cluster_name, sentences in TRAINING_CORPUS.items():
        for s in sentences:
            all_texts.append(s)
            all_labels.append(cluster_name)

    _vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    X_raw = _vectorizer.fit_transform(all_texts)

    # L2-normalise so Euclidean distance ≈ cosine distance (bounded 0–√2)
    X = normalize(X_raw, norm='l2')

    # Build labelled centroids as initial cluster centres
    label_to_idx = {name: i for i, name in enumerate(CLUSTER_LABELS)}
    n_features = X.shape[1]
    init_centers = np.zeros((5, n_features))
    counts = np.zeros(5)

    for i, label in enumerate(all_labels):
        idx = label_to_idx.get(label)
        if idx is not None:
            init_centers[idx] += X[i].toarray()[0]
            counts[idx] += 1

    for i in range(5):
        if counts[i] > 0:
            init_centers[i] /= counts[i]

    _kmeans = KMeans(
        n_clusters=5,
        init=init_centers,
        n_init=1,
        max_iter=300,
        random_state=42,
    )
    _kmeans.fit(X)


VOCAB_NORM_THRESHOLD = 0.15  # raw TF-IDF norm below this = too few vocab matches = unrelated

def assign_cluster(text):
    global _vectorizer, _kmeans
    if _vectorizer is None:
        _train()

    try:
        from ml.preprocess import preprocess
        text = preprocess(text)
        if not text.strip():
            from worklogs.models import Cluster
            cluster, _ = Cluster.objects.get_or_create(name='Unrelated / General')
            return cluster

        raw_vec = _vectorizer.transform([text])

        # Check how many vocabulary words the text actually contains.
        # If the raw TF-IDF norm is very low the text shares almost no
        # vocabulary with the training corpus → unrelated content.
        raw_norm = float(np.sqrt(raw_vec.multiply(raw_vec).sum()))
        if raw_norm < VOCAB_NORM_THRESHOLD:
            label = 'Unrelated / General'
        else:
            vec = normalize(raw_vec, norm='l2')
            distances = _kmeans.transform(vec)[0]
            cluster_idx = int(distances.argmin())
            label = CLUSTER_LABELS[cluster_idx]

        from worklogs.models import Cluster
        cluster, _ = Cluster.objects.get_or_create(name=label)
        return cluster
    except Exception:
        return None
