"""
Synthetic training data generator for work log SVM classifier.
Generates ~8,000 labeled sentences per category using templated word banks.
Total output: ~64,000 examples across 8 categories.
"""

import random
import itertools

random.seed(42)

# ── Word banks per category ───────────────────────────────────────────────────

BACKEND = {
    'actions': [
        'Implemented', 'Built', 'Created', 'Fixed', 'Debugged', 'Optimized',
        'Refactored', 'Wrote', 'Updated', 'Developed', 'Added', 'Modified',
        'Deployed', 'Configured', 'Designed', 'Extended', 'Migrated',
        'Integrated', 'Tested', 'Resolved',
    ],
    'objects': [
        'REST API endpoint', 'database model', 'authentication system',
        'JWT token refresh', 'middleware layer', 'serializer logic',
        'SQL query', 'database migration', 'webhook handler', 'caching layer',
        'user permission system', 'pagination logic', 'filtering logic',
        'background task', 'email service', 'password reset flow',
        'data validation logic', 'error handling', 'rate limiting',
        'API versioning', 'request throttling', 'data serialization',
        'session management', 'OAuth integration', 'API schema',
        'database indexing', 'stored procedure', 'data export endpoint',
        'batch processing job', 'API response formatting',
    ],
    'tech': [
        'Django', 'Flask', 'FastAPI', 'PostgreSQL', 'MySQL', 'Redis',
        'Celery', 'Django REST Framework', 'SQLAlchemy', 'Python',
        'MongoDB', 'GraphQL', 'gRPC', 'RabbitMQ', 'ElasticSearch',
    ],
    'context': [
        'for the user management module', 'for the analytics dashboard',
        'for the notification system', 'for the admin panel',
        'for the reporting module', 'for the payment system',
        'for the search feature', 'for the authentication flow',
        'for the data pipeline', 'for the scheduling system',
        'for the employee portal', 'for the mobile API',
        'to improve performance', 'to fix a production bug',
        'as part of the sprint tasks', 'for the new feature release',
    ],
}

FRONTEND = {
    'actions': [
        'Built', 'Designed', 'Fixed', 'Implemented', 'Created', 'Styled',
        'Refactored', 'Integrated', 'Updated', 'Developed', 'Added',
        'Improved', 'Rewrote', 'Optimized', 'Debugged', 'Tested',
        'Deployed', 'Configured', 'Reviewed', 'Migrated',
    ],
    'objects': [
        'React component', 'dashboard UI', 'login form', 'modal dialog',
        'responsive layout', 'navigation bar', 'data table', 'chart widget',
        'CSS animation', 'search filter UI', 'sidebar menu', 'dropdown menu',
        'error boundary', 'loading skeleton', 'toast notification',
        'pagination component', 'form validation', 'date picker',
        'file upload component', 'progress bar', 'tab navigation',
        'card component', 'profile page', 'settings page', 'onboarding flow',
        'dark mode toggle', 'accessibility improvements', 'mobile layout',
        'state management logic', 'API integration layer',
    ],
    'tech': [
        'React', 'JavaScript', 'TypeScript', 'CSS', 'Tailwind CSS',
        'Redux', 'Axios', 'Vite', 'Webpack', 'SASS', 'Recharts',
        'React Router', 'Zustand', 'React Query', 'Next.js',
    ],
    'context': [
        'for the employee dashboard', 'for the admin panel',
        'for the manager view', 'for the mobile breakpoint',
        'for the KPI visualisation page', 'for the log submission page',
        'to improve user experience', 'to fix a rendering bug',
        'as part of the UI redesign', 'for the new onboarding flow',
        'to support dark mode', 'to pass accessibility audit',
        'for the performance review portal', 'for the task management page',
        'to improve responsiveness', 'for the reporting dashboard',
    ],
}

TESTING = {
    'actions': [
        'Wrote', 'Ran', 'Fixed', 'Created', 'Performed', 'Executed',
        'Added', 'Reviewed', 'Updated', 'Debugged', 'Automated',
        'Refactored', 'Expanded', 'Improved', 'Validated', 'Verified',
        'Investigated', 'Documented', 'Configured', 'Analysed',
    ],
    'objects': [
        'unit tests', 'integration tests', 'test cases', 'test fixtures',
        'mock objects', 'test assertions', 'test coverage report',
        'end-to-end tests', 'regression tests', 'smoke tests',
        'API tests', 'UI tests', 'performance tests', 'load tests',
        'security tests', 'test suite', 'test runner configuration',
        'flaky test fix', 'test data factory', 'snapshot tests',
        'functional tests', 'acceptance tests', 'contract tests',
        'edge case tests', 'boundary value tests', 'mutation tests',
        'parameterised test cases', 'CI test pipeline', 'test mocks',
        'test stubs',
    ],
    'tech': [
        'pytest', 'Jest', 'unittest', 'Selenium', 'Cypress', 'Playwright',
        'Postman', 'k6', 'Locust', 'coverage.py', 'React Testing Library',
        'Mocha', 'Vitest', 'Factory Boy', 'hypothesis',
    ],
    'context': [
        'for the authentication module', 'for the API endpoints',
        'for the KPI calculation engine', 'for the worklog service',
        'for the user management system', 'for the payment flow',
        'to improve code coverage', 'to catch regression bugs',
        'as part of TDD workflow', 'for the CI pipeline',
        'for the edge cases in the serializer', 'for the new feature',
        'before the production release', 'for the data migration',
        'to meet coverage requirements', 'for the login flow',
    ],
}

CODE_REVIEW = {
    'actions': [
        'Reviewed', 'Approved', 'Rejected', 'Commented on', 'Suggested',
        'Discussed', 'Merged', 'Analysed', 'Evaluated', 'Inspected',
        'Assessed', 'Provided feedback on', 'Requested changes on',
        'Gave feedback on', 'Pair reviewed', 'Walked through',
        'Checked', 'Validated', 'Critiqued', 'Endorsed',
    ],
    'objects': [
        'pull request', 'code changes', 'feature branch', 'merge request',
        'code diff', 'commit history', 'refactoring PR',
        'bug fix pull request', 'hotfix branch', 'code submission',
        'teammate code', 'junior developer code', 'API implementation',
        'database migration PR', 'frontend component PR',
        'authentication module changes', 'test coverage PR',
        'performance improvement PR', 'security patch', 'dependency update PR',
        'code style changes', 'architecture change proposal',
        'backend service update', 'UI component changes', 'config changes',
        'CI workflow changes', 'documentation PR', 'API schema changes',
        'data model changes', 'deployment script PR',
    ],
    'context': [
        'and provided detailed feedback', 'for security vulnerabilities',
        'for performance improvements', 'for correctness',
        'for code readability', 'for best practices',
        'before merging to main', 'as part of the sprint review',
        'for the backend team', 'for the frontend team',
        'after the design review', 'to ensure quality standards',
        'and suggested refactoring', 'for the release candidate',
        'to unblock the team', 'for the hotfix deployment',
    ],
}

DOCUMENTATION = {
    'actions': [
        'Wrote', 'Updated', 'Created', 'Documented', 'Drafted',
        'Revised', 'Published', 'Improved', 'Completed', 'Finalised',
        'Structured', 'Organised', 'Outlined', 'Reviewed', 'Proofread',
        'Translated', 'Summarised', 'Annotated', 'Formatted', 'Authored',
    ],
    'objects': [
        'README file', 'API documentation', 'technical design document',
        'changelog', 'onboarding guide', 'system architecture diagram',
        'database schema docs', 'deployment guide', 'runbook',
        'troubleshooting guide', 'code comments', 'inline documentation',
        'user manual', 'developer guide', 'API reference',
        'release notes', 'configuration guide', 'test plan document',
        'data flow diagram', 'sequence diagram', 'class diagram',
        'project wiki', 'FAQ document', 'specification document',
        'requirements document', 'meeting notes', 'design decision log',
        'postmortem report', 'performance report', 'security guidelines',
    ],
    'tech': [
        'Swagger', 'Markdown', 'Confluence', 'Notion', 'Google Docs',
        'Sphinx', 'JSDoc', 'OpenAPI', 'Draw.io', 'Mermaid',
        'ReadTheDocs', 'GitBook', 'Docusaurus', 'ReStructuredText', 'LaTeX',
    ],
    'context': [
        'for the new API endpoints', 'for the onboarding process',
        'for the deployment pipeline', 'for the database schema',
        'for new team members', 'for the client handover',
        'for the internal wiki', 'for the sprint retrospective',
        'for the release process', 'for the security audit',
        'to improve developer experience', 'for the technical review',
        'for the project documentation portal', 'for the integration guide',
        'to meet compliance requirements', 'for the product roadmap',
    ],
}

MEETINGS = {
    'actions': [
        'Attended', 'Participated in', 'Conducted', 'Led', 'Presented at',
        'Joined', 'Facilitated', 'Organised', 'Hosted', 'Chaired',
        'Contributed to', 'Took notes in', 'Presented in', 'Spoke at',
        'Scheduled', 'Prepared for', 'Followed up on', 'Summarised',
        'Coordinated', 'Ran',
    ],
    'objects': [
        'daily standup', 'sprint planning meeting', 'sprint retrospective',
        'technical design review', 'client requirements meeting',
        'one-on-one with manager', 'team sync', 'stakeholder demo',
        'onboarding session', 'product roadmap discussion',
        'cross-team sync', 'performance review meeting',
        'incident postmortem meeting', 'architecture review meeting',
        'project kickoff meeting', 'backlog grooming session',
        'release planning meeting', 'design critique session',
        'quarterly business review', 'hiring interview',
        'vendor evaluation call', 'budget planning meeting',
        'security review meeting', 'all-hands meeting',
        'department sync', 'leadership briefing', 'code walkthrough session',
        'training session', 'workshop', 'knowledge sharing session',
    ],
    'context': [
        'with the development team', 'with the product manager',
        'with external stakeholders', 'with the design team',
        'with the QA team', 'with the client',
        'with cross-functional teams', 'with leadership',
        'for the upcoming release', 'for the new project',
        'to discuss blockers', 'to align on priorities',
        'to review progress', 'to plan the next sprint',
        'to present findings', 'to gather requirements',
    ],
}

DEVOPS = {
    'actions': [
        'Deployed', 'Configured', 'Set up', 'Fixed', 'Monitored',
        'Updated', 'Automated', 'Optimized', 'Migrated', 'Scaled',
        'Troubleshot', 'Patched', 'Provisioned', 'Secured', 'Tested',
        'Reviewed', 'Rebuilt', 'Audited', 'Installed', 'Maintained',
    ],
    'objects': [
        'CI/CD pipeline', 'Docker container', 'Kubernetes cluster',
        'server configuration', 'database backup', 'SSL certificate',
        'load balancer', 'environment variables', 'secrets management',
        'reverse proxy', 'deployment script', 'infrastructure as code',
        'cloud resources', 'monitoring dashboard', 'alerting rules',
        'log aggregation', 'auto-scaling policy', 'firewall rules',
        'VPN configuration', 'network security group', 'S3 bucket policy',
        'CDN configuration', 'DNS records', 'container registry',
        'service mesh', 'API gateway', 'message queue',
        'build pipeline', 'release pipeline', 'artifact storage',
    ],
    'tech': [
        'GitHub Actions', 'Docker', 'Nginx', 'AWS', 'Kubernetes',
        'Terraform', 'Ansible', 'Jenkins', 'CircleCI', 'Helm',
        'Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'GCP',
    ],
    'context': [
        'for the production environment', 'for the staging server',
        'for the development environment', 'for the microservices architecture',
        'to reduce deployment time', 'to improve reliability',
        'after a production outage', 'for the new service',
        'to meet SLA requirements', 'for the disaster recovery plan',
        'to improve observability', 'for cost optimisation',
        'for the security compliance audit', 'for the high availability setup',
        'to automate manual processes', 'for the release pipeline',
    ],
}

RESEARCH = {
    'actions': [
        'Researched', 'Explored', 'Studied', 'Investigated', 'Evaluated',
        'Compared', 'Read about', 'Analysed', 'Prototyped', 'Benchmarked',
        'Reviewed literature on', 'Experimented with', 'Explored options for',
        'Assessed', 'Surveyed', 'Examined', 'Investigated alternatives for',
        'Identified best practices for', 'Summarised findings on',
        'Conducted a spike on', 'Did a technical investigation of',
        'Evaluated options for', 'Looked into', 'Investigated the use of',
    ],
    'objects': [
        'Redis caching strategies', 'Redis vs Memcached trade-offs',
        'PostgreSQL vs MongoDB options', 'React state management approaches',
        'Django vs FastAPI trade-offs', 'Docker vs Podman options',
        'authentication library options', 'caching strategy options',
        'machine learning classification algorithms',
        'API design patterns and best practices',
        'microservices vs monolith architecture',
        'message broker options like RabbitMQ and Kafka',
        'ElasticSearch full-text search capabilities',
        'WebSocket vs SSE for real-time updates',
        'encryption and hashing approaches',
        'payment gateway integration options',
        'cloud provider pricing and features',
        'open source framework alternatives',
        'performance profiling tools and techniques',
        'observability and monitoring platforms',
        'testing framework options and trade-offs',
        'containerisation and orchestration options',
        'serverless architecture trade-offs',
        'GraphQL vs REST API approaches',
        'NoSQL vs SQL database options',
        'frontend framework comparison',
        'build tool alternatives and benchmarks',
        'rate limiting and throttling strategies',
        'background job processing solutions',
        'event-driven architecture patterns',
        'Kubernetes vs Docker Swarm',
        'Next.js vs Vite for the frontend',
        'TF-IDF vs BERT for text classification',
        'PostgreSQL indexing strategies',
        'Celery vs RQ for task queues',
        'Nginx vs Caddy as reverse proxy',
    ],
    'context': [
        'for the upcoming sprint', 'for the new feature',
        'for the performance improvement initiative', 'for the security audit',
        'for the technology migration', 'for the scalability roadmap',
        'to compare trade-offs', 'to inform the architecture decision',
        'as part of the technical spike', 'for the proof of concept',
        'to improve developer productivity', 'for the innovation project',
        'for the team knowledge sharing', 'to evaluate fit for the project',
        'based on the client requirements', 'for the long-term roadmap',
        'before making a technology choice', 'to write a recommendation',
        'to present findings to the team', 'for the technical design doc',
    ],
}

CATEGORY_BANKS = {
    'Backend Development': BACKEND,
    'Frontend Development': FRONTEND,
    'Testing': TESTING,
    'Code Review': CODE_REVIEW,
    'Documentation': DOCUMENTATION,
    'Meetings': MEETINGS,
    'DevOps': DEVOPS,
    'Research': RESEARCH,
}

# ── Templates ─────────────────────────────────────────────────────────────────

def _make_templates(bank):
    templates = []
    actions = bank['actions']
    objects = bank['objects']
    context = bank.get('context', [''])
    tech = bank.get('tech', [])

    for a in actions:
        for o in objects:
            templates.append(f"{a} {o}")
        for o in objects:
            for c in context:
                templates.append(f"{a} {o} {c}")
        if tech:
            for t in tech:
                for o in objects[:10]:
                    templates.append(f"{a} {o} using {t}")
                    templates.append(f"{a} {o} in {t}")

    return templates


def generate_training_data(samples_per_category=8000):
    """Return list of (text, label) tuples with ~samples_per_category per class."""
    data = []
    for label, bank in CATEGORY_BANKS.items():
        pool = _make_templates(bank)
        # If pool is smaller than requested, oversample with slight variation
        if len(pool) >= samples_per_category:
            chosen = random.sample(pool, samples_per_category)
        else:
            chosen = pool[:]
            while len(chosen) < samples_per_category:
                extra = random.choice(pool)
                # add minor variation so duplicates are slightly different
                chosen.append(extra + ' as part of daily work')
            chosen = chosen[:samples_per_category]

        for text in chosen:
            data.append((text, label))

    random.shuffle(data)
    return data


# Pre-built at import time — used by classifier.py
TRAINING_DATA = generate_training_data(samples_per_category=8000)
