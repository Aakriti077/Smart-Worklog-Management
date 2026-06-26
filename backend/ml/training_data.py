"""
Synthetic training data for work log SVM classifier.
Categories = 9 departments (Administration excluded — no logs should classify there).
~8,000 samples per department via action × object templating.
"""

import random
import itertools

random.seed(42)

# ── Word banks per department ─────────────────────────────────────────────────

ENGINEERING = {
    'actions': [
        'Implemented', 'Built', 'Fixed', 'Debugged', 'Deployed', 'Refactored',
        'Optimised', 'Optimized', 'Developed', 'Shipped', 'Integrated', 'Migrated',
        'Created', 'Extended', 'Rewrote', 'Wired up', 'Released', 'Resolved',
        'Configured', 'Designed',
    ],
    'objects': [
        'REST API endpoint', 'database migration', 'authentication system',
        'JWT token refresh', 'middleware layer', 'serializer logic',
        'SQL query optimisation', 'webhook handler', 'caching layer',
        'user permission system', 'pagination logic', 'rate limiting middleware',
        'background task', 'password reset flow', 'data validation logic',
        'error handling', 'API versioning', 'data serialization',
        'session management', 'OAuth integration', 'bulk import endpoint',
        'React component', 'dashboard UI', 'login form', 'responsive layout',
        'navigation bar', 'data table', 'chart widget', 'CSS animation',
        'search filter UI', 'sidebar menu', 'loading skeleton',
        'toast notification', 'pagination component', 'form validation',
        'dark mode toggle', 'mobile layout', 'state management logic',
        'ML model training pipeline', 'model inference API endpoint',
        'model serving endpoint', 'data preprocessing pipeline',
        'NLP text classification pipeline', 'model retraining pipeline',
        'batch inference pipeline', 'model versioning system',
        'ML experiment tracking system', 'feature extraction pipeline',
        'neural network training script', 'transformer fine-tuning pipeline',
        'embedding generation pipeline', 'real-time prediction API',
        'k-means clustering module', 'training pipeline for text classification',
        'automated model retraining job', 'model deployment pipeline',
        'tokenisation pipeline', 'semantic search API',
    ],
    'tech': [
        'Django', 'Flask', 'FastAPI', 'PostgreSQL', 'MySQL', 'Redis',
        'Celery', 'Django REST Framework', 'Python', 'MongoDB',
        'React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Recharts',
        'PyTorch', 'TensorFlow', 'scikit-learn', 'HuggingFace', 'MLflow',
        'ONNX', 'sentence-transformers', 'Pinecone', 'Weaviate',
    ],
    'context': [
        'for the user management module', 'for the employee portal',
        'for the authentication flow', 'for the reporting module',
        'for the admin panel', 'to fix a production bug',
        'for the new feature release', 'to improve performance',
        'for the AI model training system', 'for the ML pipeline',
        'for the model inference service', 'for the employee dashboard',
        'for the KPI visualisation page', 'to reduce model latency',
        'for the mobile API', 'for the search feature',
    ],
}

DEVOPS_INFRA = {
    'actions': [
        'Deployed', 'Configured', 'Set up', 'Migrated', 'Provisioned', 'Scaled',
        'Automated', 'Monitored', 'Patched', 'Rebuilt', 'Rotated', 'Tuned',
        'Wrote', 'Optimised', 'Troubleshot', 'Validated', 'Hardened',
        'Orchestrated', 'Upgraded', 'Managed',
    ],
    'objects': [
        'Kubernetes cluster', 'CI/CD pipeline', 'Docker container',
        'load balancer', 'Terraform module', 'SSL certificate',
        'Nginx reverse proxy', 'VPN configuration', 'database backup',
        'deployment script', 'infrastructure health check',
        'log aggregation pipeline', 'disaster recovery plan',
        'monitoring alert', 'auto-scaling policy', 'container registry',
        'service mesh configuration', 'secrets management setup',
        'network security group', 'blue-green deployment',
        'Helm chart', 'bastion host', 'cloud storage bucket',
        'compute instance', 'DNS configuration',
    ],
    'tech': [
        'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'Nginx',
        'AWS', 'GCP', 'Azure', 'Prometheus', 'Grafana', 'PagerDuty',
        'Ansible', 'ELK stack', 'Helm', 'ArgoCD', 'Vault', 'Datadog',
    ],
    'context': [
        'for the production environment', 'for the deployment pipeline',
        'to handle peak traffic', 'for the staging environment',
        'to reduce build time', 'for the disaster recovery drill',
        'to improve uptime', 'for the infrastructure audit',
        'for zero-downtime releases', 'to meet security requirements',
    ],
}

DATA_SCIENCE = {
    'actions': [
        'Analysed', 'Built', 'Created', 'Modelled', 'Forecasted', 'Designed',
        'Calculated', 'Segmented', 'Explored', 'Validated', 'Developed',
        'Ran', 'Prepared', 'Processed', 'Automated', 'Generated',
        'Visualised', 'Investigated', 'Computed', 'Aggregated',
    ],
    'objects': [
        'SQL dashboard', 'ETL pipeline', 'cohort retention analysis',
        'revenue forecast model', 'KPI report', 'data pipeline',
        'A/B test results', 'churn prediction model', 'feature importance report',
        'data quality checks', 'business metrics dashboard',
        'analytics data model', 'data warehouse query', 'segment analysis',
        'funnel drop-off report', 'NPS analysis', 'product usage report',
        'subscription revenue model', 'weekly KPI reporting pipeline',
        'data dictionary', 'anomaly detection report',
        'dimensionality reduction analysis', 'time-series forecast',
        'customer lifetime value model', 'attribution model',
    ],
    'tech': [
        'SQL', 'Tableau', 'dbt', 'Pandas', 'Power BI', 'Looker',
        'Snowflake', 'BigQuery', 'Python', 'Spark', 'Redshift',
        'Excel', 'Amplitude', 'Mixpanel', 'Great Expectations',
    ],
    'context': [
        'for the business review', 'for the finance team',
        'for the marketing team', 'for the executive dashboard',
        'for the weekly digest', 'for the product team',
        'for the board presentation', 'to inform the roadmap decision',
        'for the quarterly report', 'for the analytics team',
    ],
}

QUALITY_ASSURANCE = {
    'actions': [
        'Wrote', 'Ran', 'Executed', 'Validated', 'Fixed', 'Automated',
        'Created', 'Performed', 'Reviewed', 'Tested', 'Completed',
        'Filed', 'Reported', 'Discovered', 'Investigated', 'Verified',
        'Documented', 'Expanded', 'Reproduced', 'Triaged',
    ],
    'objects': [
        'regression test suite', 'Cypress end-to-end tests', 'bug report',
        'UAT session', 'load test', 'test plan', 'smoke test',
        'test coverage report', 'exploratory testing session',
        'integration test suite', 'performance benchmark',
        'QA sign-off', 'defect log', 'accessibility audit',
        'cross-browser compatibility test', 'API test collection',
        'test data factory', 'flaky test fix', 'security penetration test',
        'unit test suite', 'acceptance test', 'stress test',
    ],
    'tech': [
        'Cypress', 'pytest', 'Selenium', 'k6', 'Postman', 'JMeter',
        'Playwright', 'Jest', 'axe-core', 'Locust', 'coverage.py',
        'React Testing Library', 'Mocha', 'Vitest', 'BrowserStack',
    ],
    'context': [
        'for the release candidate', 'for the new feature',
        'before the production deployment', 'to meet coverage requirements',
        'for the sprint regression', 'for the hotfix validation',
        'to catch edge-case bugs', 'for the QA sign-off',
        'for the performance SLO', 'for the security audit',
    ],
}

HUMAN_RESOURCES = {
    'actions': [
        'Conducted', 'Facilitated', 'Hired', 'Onboarded', 'Processed',
        'Reviewed', 'Updated', 'Prepared', 'Led', 'Ran', 'Resolved',
        'Analysed', 'Developed', 'Organised', 'Managed', 'Coordinated',
        'Completed', 'Filed', 'Scheduled', 'Documented',
    ],
    'objects': [
        'performance review session', 'job posting', 'onboarding checklist',
        'payroll run', 'leave policy', 'employee handbook',
        'interview panel', 'engagement survey', 'compensation review',
        'offboarding procedure', 'D&I training session', 'attrition report',
        'headcount plan', 'HR compliance file', 'salary adjustment',
        'new hire orientation', 'talent pipeline', 'exit interview',
        'workforce planning session', 'benefit enrolment',
        'skip-level meeting', 'conflict resolution session',
        'recruitment campaign', 'culture survey results',
    ],
    'tech': [
        'HRIS', 'BambooHR', 'Workday', 'LinkedIn', 'ATS', 'Greenhouse',
        'Lever', 'Lattice', 'Culture Amp', 'Slack', 'Zoom',
    ],
    'context': [
        'for the engineering team', 'for the quarterly review',
        'for new hires', 'for the HR compliance file',
        'for the retention programme', 'for the annual cycle',
        'for the onboarding cohort', 'for the diversity initiative',
        'across all departments', 'for the performance cycle',
    ],
}

PRODUCT = {
    'actions': [
        'Wrote', 'Defined', 'Prioritised', 'Ran', 'Facilitated',
        'Presented', 'Groomed', 'Created', 'Reviewed', 'Demoed',
        'Planned', 'Aligned', 'Gathered', 'Refined', 'Led',
        'Drafted', 'Mapped', 'Scoped', 'Validated', 'Synthesised',
    ],
    'objects': [
        'product requirements document', 'user story', 'product roadmap',
        'sprint planning', 'backlog', 'acceptance criteria',
        'user interview', 'feature spec', 'OKR review',
        'competitive analysis', 'product strategy', 'release plan',
        'MVP scope', 'stakeholder presentation', 'feature priority matrix',
        'go-to-market plan', 'product brief', 'launch checklist',
        'discovery session', 'north star metric review',
        'product feedback analysis', 'NPS deep-dive',
        'sprint retrospective', 'outcome-based roadmap',
    ],
    'tech': [
        'Jira', 'Confluence', 'Notion', 'Figma', 'Miro',
        'Amplitude', 'ProductBoard', 'Linear', 'Asana', 'Coda',
    ],
    'context': [
        'for the Q3 release', 'for engineering alignment',
        'for the stakeholder review', 'for the sprint',
        'for the product launch', 'with the design team',
        'for the annual planning', 'for the discovery phase',
        'with engineering and design', 'for the beta programme',
    ],
}

SALES = {
    'actions': [
        'Ran', 'Attended', 'Presented', 'Closed', 'Pitched', 'Negotiated',
        'Followed up', 'Led', 'Qualified', 'Built', 'Researched',
        'Prepared', 'Prospected', 'Managed', 'Hosted', 'Booked',
        'Advanced', 'Demoed', 'Reviewed', 'Mapped',
    ],
    'objects': [
        'product demo', 'discovery call', 'sales proposal',
        'pipeline review', 'enterprise deal', 'partner meeting',
        'CRM record', 'outreach campaign', 'contract negotiation',
        'sales forecast', 'competitive battle card', 'account plan',
        'lead qualification call', 'win-loss analysis',
        'reseller agreement', 'commercial negotiation',
        'outbound prospecting sequence', 'SDR call review',
        'quarterly business review', 'upsell opportunity',
        'renewal negotiation', 'customer success check-in',
        'market sizing analysis', 'target account list',
    ],
    'tech': [
        'Salesforce', 'HubSpot', 'LinkedIn Sales Navigator',
        'Gong', 'Outreach', 'Salesloft', 'ZoomInfo', 'Chorus',
        'DocuSign', 'PandaDoc',
    ],
    'context': [
        'for the enterprise prospect', 'for the Q3 pipeline',
        'for the partner programme', 'for the revenue forecast',
        'with the fintech vertical', 'for the SMB segment',
        'for the APAC expansion', 'to advance the deal',
        'for the inbound lead', 'with the account executive',
    ],
}

FINANCE = {
    'actions': [
        'Prepared', 'Processed', 'Reconciled', 'Reviewed', 'Filed',
        'Automated', 'Completed', 'Approved', 'Calculated', 'Analysed',
        'Generated', 'Submitted', 'Audited', 'Forecasted', 'Budgeted',
        'Verified', 'Closed', 'Accrued', 'Modelled', 'Reported',
    ],
    'objects': [
        'financial report', 'budget submission', 'invoice processing',
        'payroll reconciliation', 'tax filing', 'cash flow forecast',
        'variance analysis', 'audit pack', 'fixed asset register',
        'expense report', 'purchase order', 'balance sheet',
        'statutory accounts', 'board pack', 'monthly management accounts',
        'VAT return', 'vendor payment run', 'departmental budget review',
        'treasury forecast', 'accruals journal',
        'P&L statement', 'accounts payable run',
        'rolling 6-month forecast', 'cost centre analysis',
    ],
    'tech': [
        'QuickBooks', 'Xero', 'SAP', 'NetSuite', 'Excel',
        'Oracle Finance', 'Sage', 'Workiva', 'Concur', 'Coupa',
    ],
    'context': [
        'for the Q2 close', 'for the external audit',
        'for the board meeting', 'for the annual filing',
        'for the management accounts', 'for the CFO review',
        'for the payroll cycle', 'for the budget planning round',
        'for the statutory deadline', 'for the finance committee',
    ],
}

UI_UX = {
    'actions': [
        'Designed', 'Created', 'Built', 'Ran', 'Tested', 'Prototyped',
        'Presented', 'Conducted', 'Redesigned', 'Iterated', 'Delivered',
        'Produced', 'Led', 'Facilitated', 'Updated', 'Mapped',
        'Sketched', 'Validated', 'Refined', 'Annotated',
    ],
    'objects': [
        'high-fidelity mockup', 'Figma prototype', 'usability test session',
        'design system', 'wireframe', 'accessibility audit',
        'user journey map', 'component library', 'icon set',
        'colour token palette', 'design handoff spec', 'user persona',
        'card sorting study', 'heatmap analysis', 'interaction design spec',
        'information architecture', 'micro-interaction animation',
        'responsive breakpoint spec', 'dark mode theme',
        'empty state illustration', 'onboarding flow design',
        'design critique session', 'A/B variant mockup',
    ],
    'tech': [
        'Figma', 'Sketch', 'Adobe XD', 'Miro', 'Maze',
        'Hotjar', 'InVision', 'Principle', 'Zeplin', 'Storybook',
        'Adobe Illustrator', 'Lottie',
    ],
    'context': [
        'for the employee dashboard', 'for the onboarding flow',
        'for the mobile breakpoint', 'for the design review',
        'for the product team handoff', 'for the accessibility audit',
        'for the design system', 'for the marketing site',
        'for the admin panel', 'with the engineering team',
    ],
}

# ── Combined ENGINEERING bank = Backend + Frontend + AI/ML ───────────────────

CATEGORY_BANKS = {
    'Engineering':                  ENGINEERING,
    'DevOps & Infrastructure':      DEVOPS_INFRA,
    'Data Science & Analytics':     DATA_SCIENCE,
    'Quality Assurance':            QUALITY_ASSURANCE,
    'Human Resources':              HUMAN_RESOURCES,
    'Product':                      PRODUCT,
    'Sales & Business Development': SALES,
    'Finance & Accounting':         FINANCE,
    'UI/UX Design':                 UI_UX,
}

# ── Templates ─────────────────────────────────────────────────────────────────

def _make_templates(bank):
    templates = []
    actions = bank['actions']
    objects = bank['objects']
    context = bank.get('context', [''])
    tech    = bank.get('tech', [])

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


# ── Realistic conversational samples ─────────────────────────────────────────
# Template-generated data produces clean, formal sentences. Real employee logs
# are shorter, first-person, informal, and often mix two activities. These
# supplementary samples bridge that gap and significantly improve real-world
# classification accuracy.

REALISTIC_SAMPLES = {
    'Engineering': [
        "Fixed the login bug that was causing 500 errors for about 20% of users",
        "Spent the morning debugging a memory leak in the background worker process",
        "Pushed the new dashboard component to staging for QA review",
        "Rewrote the pagination logic — old version was running N+1 queries",
        "Pair programmed with Alex on the auth refactor for most of the afternoon",
        "Finally got the WebSocket connection stable after chasing a race condition",
        "Reviewed and merged 4 PRs today — mostly frontend cleanup work",
        "Set up local dev environment and fixed broken Docker compose setup",
        "Deployed the hotfix to production at 2pm — rollback plan was ready just in case",
        "Wrote unit tests for the new invoice serializer — coverage up to 87%",
        "Refactored the user permissions module — reduced it from 400 to 180 lines",
        "Integrated the payment gateway API and tested with sandbox credentials",
        "Fixed a CORS issue that was blocking mobile app requests to the API",
        "Built the CSV export endpoint — handles up to 100k rows with streaming",
        "Optimised the main dashboard query — went from 4.2s to 0.3s load time",
        "Updated dependencies and resolved 3 security vulnerabilities flagged by Dependabot",
        "Implemented dark mode toggle — persisted to localStorage across sessions",
        "Debugged an intermittent test failure in CI that had been flaking for weeks",
        "Created reusable modal component used by 6 different pages now",
        "Worked on the search filter feature — elastic-style fuzzy matching with debounce",
        "Connected the React frontend to the new KPI API endpoints",
        "Wrote the database migration for the new period_type field on summaries",
        "Hardened the API rate limiting — bots were hammering the auth endpoint",
        "Set up GitHub Actions CI pipeline with lint, test, and deploy stages",
        "Reviewed the data model changes for the multi-tenant feature with the backend team",
    ],

    'DevOps & Infrastructure': [
        "Kubernetes cluster went down at 3am — investigated and brought it back up by 4am",
        "Upgraded the production database from Postgres 13 to 15 with zero downtime",
        "Terraform'd the new staging environment from scratch",
        "Fixed a broken CI pipeline that had been blocking deploys for 2 days",
        "Rotated API keys and updated all secrets in Vault after a key was accidentally committed",
        "Set up monitoring alerts in Grafana for CPU and memory thresholds",
        "Scaled the web server fleet from 4 to 8 nodes ahead of the product launch",
        "Patched 12 servers with the latest security updates during the maintenance window",
        "Wrote a disaster recovery runbook for the database — tested the restore procedure",
        "Diagnosed a slow network issue between the API server and database — turned out to be DNS",
        "Configured auto-scaling policies for the API servers based on request volume",
        "Migrated the container images from DockerHub to our private ECR registry",
        "Set up SSL certificates for 3 new subdomains using Let's Encrypt automation",
        "Wrote Ansible playbooks to automate the server provisioning process",
        "Reviewed and cleaned up 40+ stale branches and 6 unused container images",
        "Configured a blue-green deployment strategy for the main API service",
        "Investigated high memory usage on the worker nodes — found and fixed a Celery misconfiguration",
        "Set up ELK stack for centralised log aggregation across all services",
        "Ran load tests with k6 — found the API starts degrading above 500 concurrent users",
        "Managed the on-call rotation for the week — 2 minor incidents, both resolved quickly",
    ],

    'Data Science & Analytics': [
        "Built a cohort retention analysis to understand where users drop off after signup",
        "Ran the monthly revenue forecast model — updated assumptions for Q4",
        "Explored the churn dataset and found 3 leading indicators we hadn't noticed before",
        "Created an interactive Power BI dashboard for the finance team's weekly review",
        "Cleaned and validated 6 months of raw event data from the product analytics DB",
        "Ran an A/B test analysis for the new onboarding flow — 18% improvement in activation",
        "Built a customer segmentation model using K-Means on purchase behaviour data",
        "Wrote a Python script to automate the weekly KPI report generation and email distribution",
        "Found a major data quality issue in the attribution model — fixed the join logic",
        "Presented the NPS deep-dive findings to the product team — 3 action items agreed",
        "Modelled the impact of a 10% price increase on projected churn and LTV",
        "Investigated anomalies in the signup data — traced to a tracking bug in the mobile app",
        "Created a feature importance report for the churn prediction model using SHAP values",
        "Aggregated data from 4 different systems into a single customer 360 view",
        "Wrote SQL queries to populate the new data warehouse tables for the BI team",
        "Validated the data pipeline end-to-end after the schema change last week",
        "Built a time-series forecast for headcount planning using Prophet",
        "Reviewed the analytics data model with the engineering team — agreed on changes",
        "Set up Great Expectations data quality checks on the ETL pipeline",
        "Analysed product usage patterns to identify the top 5 underused features",
    ],

    'Quality Assurance': [
        "Found 3 critical bugs in the checkout flow during regression testing before release",
        "Wrote end-to-end Cypress tests for the new onboarding flow — 100% coverage",
        "Ran a full regression suite on the release candidate — 2 failures, both fixed same day",
        "Filed a detailed bug report for the payment amount rounding issue — reproduced consistently",
        "Performed exploratory testing on the new admin panel — discovered edge cases not in spec",
        "Reviewed the test plan for the upcoming Q3 release — flagged 4 missing test cases",
        "Set up automated smoke tests to run on every deploy to staging",
        "Load tested the API at 1000 concurrent users — identified a DB connection pool bottleneck",
        "Signed off on the authentication module after verifying all acceptance criteria",
        "Investigated a flaky test that was blocking the CI pipeline — fixed the timing issue",
        "Documented all known bugs in the issue tracker and triaged by severity",
        "Ran cross-browser compatibility tests on Chrome, Firefox, Safari, and Edge",
        "Created test data factory for the integration tests — reduces manual setup time by 80%",
        "Performed accessibility audit using axe-core — found 6 WCAG violations to fix",
        "Reviewed the API contract with the frontend team to prevent integration bugs",
        "Verified the hotfix for the session timeout bug — deployed to production",
        "Expanded the unit test suite for the payment module — coverage up from 60% to 91%",
        "Ran a security penetration test on the auth endpoints — no critical findings",
        "Reproduced the intermittent 403 error reported by customers — traced to a race condition",
        "Updated the QA test plan to cover the new multi-role permissions feature",
    ],

    'Human Resources': [
        "Conducted quarterly performance reviews for 8 team members today",
        "Ran the monthly onboarding session for 3 new hires — covered policies and tools",
        "Facilitated a conflict resolution meeting between two team members in engineering",
        "Reviewed and updated the leave policy to comply with new statutory requirements",
        "Processed payroll for the month — reconciled 2 discrepancies with Finance",
        "Led skip-level meetings with 4 individual contributors to gather unfiltered feedback",
        "Drafted 5 job descriptions for open roles across engineering and product",
        "Ran the D&I training session — 100% attendance achieved across the company",
        "Analysed the engagement survey results — identified 3 key themes to address",
        "Coordinated with the finance team on the annual compensation review",
        "Held one-on-one check-ins with 8 employees flagged in the retention risk report",
        "Updated the employee handbook with the revised remote work policy",
        "Ran an interview panel for 2 candidates for the senior engineering role",
        "Documented the exit interview findings for the 3 recent departures",
        "Prepared the headcount plan for Q4 board presentation",
        "Organised a team offsite for the HR department — agenda and logistics finalised",
        "Completed the annual compliance training records for all 45 employees",
        "Compiled the H1 attrition report — turnover rate down 3% vs last year",
        "Reviewed 12 CVs for the open product manager role — shortlisted 4 for interview",
        "Set up the new HRIS module for performance cycle tracking",
    ],

    'Product': [
        "Wrote the PRD for the new analytics dashboard — shared with engineering for estimation",
        "Ran the sprint planning session — backlog groomed and velocity set for next 2 weeks",
        "Gathered user feedback from 5 customer interviews about the onboarding flow",
        "Prioritised the Q4 roadmap based on OKR alignment and engineering capacity",
        "Demoed the new feature to stakeholders — collected feedback and agreed on 3 changes",
        "Wrote acceptance criteria for 8 user stories in the upcoming sprint",
        "Reviewed the competitive landscape — 2 competitors launched similar features last month",
        "Facilitated a discovery session with the sales and CS teams about churn drivers",
        "Refined the north star metric definition — aligned with the data science team on measurement",
        "Ran a retrospective for the Q3 launch — documented 5 lessons learned",
        "Mapped the user journey for the new reporting feature — identified 4 pain points",
        "Presented the product roadmap to the exec team — got sign-off on the Q4 priorities",
        "Wrote the go-to-market plan for the new integration launch",
        "Groomed and estimated 15 backlog items with the engineering team",
        "Aligned with design on the new onboarding flow mockups — 2 rounds of feedback",
        "Reviewed NPS responses and synthesised key themes into a product brief",
        "Ran a user testing session for the new search feature — 6 participants",
        "Scoped the MVP for the mobile app — cut 40% of features to hit the deadline",
        "Created a feature priority matrix weighing impact vs effort for 20 backlog items",
        "Wrote the product brief for the AI-powered summary feature based on customer research",
    ],

    'Sales & Business Development': [
        "Ran 3 product demos today for mid-market prospects — 2 moved to next stage",
        "Closed the enterprise deal with Acme Corp — Q3 target now at 94%",
        "Had a discovery call with a new inbound lead from the fintech sector",
        "Followed up with 12 prospects who hadn't responded to last week's outreach",
        "Prepared a customised proposal for the retail client — submitted by EOD",
        "Reviewed the Q3 pipeline with the sales manager — identified 5 at-risk deals",
        "Ran a QBR with our top 3 enterprise accounts — all renewed for another year",
        "Prospected 25 new accounts in the healthcare vertical using LinkedIn Sales Navigator",
        "Negotiated contract terms with the legal team for a £500k annual deal",
        "Updated Salesforce with notes from this week's 8 customer calls",
        "Pitched to a VC-backed startup — they requested a technical deep-dive next week",
        "Researched the competitive landscape before the call with a prospect evaluating 3 vendors",
        "Mapped the buying committee for the enterprise prospect — 6 stakeholders identified",
        "Ran an SDR call review session — coached 3 reps on discovery questions",
        "Hosted a product webinar for 40 prospects — 15 requested follow-up demos",
        "Advanced 4 deals by booking next steps before end of quarter",
        "Qualified a warm inbound lead from the website — booked a demo for next Tuesday",
        "Reviewed and refined the battle card against our main competitor",
        "Closed out a renewal negotiation — upsold 2 additional seats at the same time",
        "Presented the quarterly business review to the regional sales team",
    ],

    'Finance & Accounting': [
        "Closed the monthly accounts — all P&L and balance sheet entries reconciled",
        "Prepared the board pack for tomorrow's meeting — includes full variance analysis",
        "Processed the vendor payment run — 34 invoices totalling £280k approved",
        "Reviewed and approved expense claims for the week — 3 flagged for clarification",
        "Filed the quarterly VAT return — submitted to HMRC before the deadline",
        "Ran the payroll reconciliation — caught a discrepancy in overtime calculations",
        "Forecasted Q4 cash flow — flagged a potential shortfall in November to the CFO",
        "Completed the annual fixed asset register update — 12 assets added, 4 disposed",
        "Prepared the audit pack for the external auditors arriving next week",
        "Analysed the department budget variances — marketing overspent by 18% in Q3",
        "Processed accruals journals for September month-end close",
        "Reviewed contracts from 3 new vendors against the procurement policy",
        "Modelled the impact of a potential acquisition on the group P&L",
        "Submitted the statutory accounts filing before the Companies House deadline",
        "Generated the weekly cash position report for the CFO — treasury review tomorrow",
        "Reconciled the accounts payable ledger — 5 duplicate payments identified and reversed",
        "Prepared the departmental cost centre analysis for the quarterly budget review",
        "Validated the rolling 6-month forecast against actuals — revised 3 assumptions",
        "Automated the monthly expense report using Excel macros — saves 3 hours per month",
        "Reviewed the management accounts with department heads in the monthly finance meeting",
    ],

    'UI/UX Design': [
        "Designed the high-fidelity mockups for the new dashboard in Figma — ready for review",
        "Ran a usability testing session with 5 participants for the checkout flow",
        "Iterated on the onboarding flow based on last week's user testing feedback",
        "Delivered the design system components to the engineering team for implementation",
        "Conducted an accessibility audit — found 4 contrast ratio failures to fix",
        "Sketched wireframes for the mobile navigation redesign — 3 concepts to review",
        "Presented the UX research findings to the product team — agreed on 2 quick wins",
        "Reviewed the frontend implementation against the design spec — flagged 6 inconsistencies",
        "Created the icon set for the new admin panel using the existing design language",
        "Ran a card sorting study to validate the new information architecture",
        "Updated the component library with the new colour tokens from the brand refresh",
        "Designed A/B test variants for the landing page hero section",
        "Mapped the user journey for the new employee onboarding flow — 3 friction points found",
        "Built an interactive prototype in Figma for the stakeholder walkthrough tomorrow",
        "Annotated the design spec for the new notification system — 40 components documented",
        "Reviewed competitor apps for UX patterns to inform the mobile redesign",
        "Facilitated a design critique session with the team — 8 iterations reviewed",
        "Designed empty state illustrations for 6 different pages in the app",
        "Created responsive breakpoint specs for the new dashboard layout",
        "Validated the new checkout flow with 3 participants via remote Maze testing",
    ],
}


def generate_training_data(samples_per_category=8000):
    """Return list of (text, label) tuples with ~samples_per_category per class."""
    data = []
    for label, bank in CATEGORY_BANKS.items():
        # Template-generated examples
        pool = _make_templates(bank)
        # Realistic conversational examples (weighted 3× for better real-world fit)
        realistic = REALISTIC_SAMPLES.get(label, [])
        pool = pool + realistic * 3

        if len(pool) >= samples_per_category:
            chosen = random.sample(pool, samples_per_category)
        else:
            repeats = (samples_per_category // len(pool)) + 1
            chosen  = (pool * repeats)[:samples_per_category]
        data.extend((text, label) for text in chosen)
    random.shuffle(data)
    return data


