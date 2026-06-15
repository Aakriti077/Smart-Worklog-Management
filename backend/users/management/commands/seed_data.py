# Management command to seed the database with demo data
# Idempotent — safe to run multiple times (uses get_or_create everywhere)

from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction

from departments.models import Department
from users.models import User
from worklogs.models import WorkLog
from kpi.models import KpiRule
from ml.classifier import classify_log
from ml.clusterer import assign_cluster
from kpi.engine import calculate_kpi, get_week_start


# ── KPI rule definitions ──────────────────────────────────────────────────────

KPI_KEYWORDS = {
    'leadership': [
        'led', 'mentored', 'guided', 'coordinated', 'supervised',
        'managed', 'directed', 'presented', 'delegated', 'trained',
    ],
    'collaboration': [
        'collaborated', 'helped', 'assisted', 'partnered', 'team',
        'shared', 'supported', 'pair', 'reviewed', 'coordinated',
    ],
    'innovation': [
        'improved', 'optimized', 'refactored', 'automated', 'redesigned',
        'new approach', 'created', 'built', 'enhanced', 'streamlined',
    ],
    'learning': [
        'learned', 'studied', 'researched', 'explored', 'investigated',
        'documentation', 'training', 'course', 'understood', 'experimented',
    ],
}


# ── Per-employee log data ─────────────────────────────────────────────────────

EMPLOYEE_LOGS = {
    'carol@company.com': [
        {
            'log_text': (
                "Fixed critical bug in the authentication module. The JWT token validation was failing "
                "for expired tokens. Debugged the issue using logs and resolved it. Led the bug fix "
                "session with team."
            ),
            'tasks_planned': 5,
            'tasks_completed': 5,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Implemented new REST API endpoints for user profile management. Added CRUD operations "
                "with proper validation and error handling."
            ),
            'tasks_planned': 5,
            'tasks_completed': 4,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Collaborated with frontend team to integrate the new dashboard APIs. Helped David with "
                "understanding the API response structure."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Attended sprint planning and retrospective meetings. Coordinated with the team to set "
                "priorities for next sprint. Mentored junior developer."
            ),
            'tasks_planned': 2,
            'tasks_completed': 2,
            'hours_worked': 5,
        },
        {
            'log_text': (
                "Researched Redis caching strategies to optimize API performance. Explored different "
                "approaches and documented findings for the team."
            ),
            'tasks_planned': 4,
            'tasks_completed': 3,
            'hours_worked': 8,
        },
    ],
    'david@company.com': [
        {
            'log_text': (
                "Built new React dashboard component with Recharts for performance visualization. "
                "Improved the chart design significantly."
            ),
            'tasks_planned': 5,
            'tasks_completed': 5,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Fixed responsive CSS layout issues on mobile screens. Enhanced the sidebar navigation "
                "for better user experience."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Wrote comprehensive unit tests for the authentication module. Added test coverage for "
                "all API endpoints."
            ),
            'tasks_planned': 4,
            'tasks_completed': 3,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Reviewed pull requests from teammates and provided detailed feedback on code quality. "
                "Helped Carol resolve merge conflicts."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Studied machine learning algorithms for text classification. Experimented with TF-IDF "
                "vectorization for work log analysis."
            ),
            'tasks_planned': 3,
            'tasks_completed': 2,
            'hours_worked': 5,
        },
    ],
    'eva@company.com': [
        {
            'log_text': (
                "Deployed new features to staging environment successfully. Set up CI/CD pipeline with "
                "GitHub Actions for automated deployments."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Documented all new API endpoints in Swagger format. Updated the technical README with "
                "deployment instructions."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Attended client requirements meeting and product roadmap discussion. Presented new "
                "feature proposals to stakeholders."
            ),
            'tasks_planned': 2,
            'tasks_completed': 2,
            'hours_worked': 4,
        },
        {
            'log_text': (
                "Implemented search and filter functionality for the logs dashboard. Collaborated with "
                "backend team on query optimization."
            ),
            'tasks_planned': 5,
            'tasks_completed': 4,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Researched third-party analytics integrations. Investigated potential solutions and "
                "created a comparison document."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 6,
        },
    ],
    'frank@company.com': [
        {
            'log_text': (
                "Configured Docker containers for the development environment. Streamlined the local "
                "setup process for the team."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Fixed failing integration tests in the CI pipeline. Resolved database connection "
                "issues in test environment."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Refactored the user management module for better code organization. Reduced code "
                "duplication by 30%."
            ),
            'tasks_planned': 4,
            'tasks_completed': 3,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Conducted code review session and onboarded new team member. Guided them through the "
                "codebase architecture."
            ),
            'tasks_planned': 2,
            'tasks_completed': 2,
            'hours_worked': 5,
        },
        {
            'log_text': (
                "Explored WebSocket implementation for real-time dashboard updates. Built a proof of "
                "concept with Socket.io."
            ),
            'tasks_planned': 4,
            'tasks_completed': 3,
            'hours_worked': 7,
        },
    ],
    'grace@company.com': [
        {
            'log_text': (
                "Monitored server performance and identified memory leak in production. Resolved the "
                "issue and optimized memory usage."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Updated Nginx configuration for load balancing. Set up automatic backups for the "
                "PostgreSQL database."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Attended team sync meeting and weekly retrospective. Coordinated with development "
                "team on deployment schedule."
            ),
            'tasks_planned': 2,
            'tasks_completed': 2,
            'hours_worked': 4,
        },
        {
            'log_text': (
                "Automated deployment scripts to reduce manual intervention. Streamlined the release "
                "process significantly."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Investigated and resolved SSL certificate renewal issue. Documented the process for "
                "future reference."
            ),
            'tasks_planned': 2,
            'tasks_completed': 2,
            'hours_worked': 5,
        },
    ],
    'henry@company.com': [
        {
            'log_text': (
                "Built employee onboarding automation scripts. Created new workflow to improve HR "
                "process efficiency."
            ),
            'tasks_planned': 4,
            'tasks_completed': 3,
            'hours_worked': 7,
        },
        {
            'log_text': (
                "Collaborated with engineering team on infrastructure requirements. Helped plan the "
                "server scaling strategy."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 6,
        },
        {
            'log_text': (
                "Researched cloud cost optimization strategies. Studied AWS pricing models and "
                "identified savings opportunities."
            ),
            'tasks_planned': 3,
            'tasks_completed': 2,
            'hours_worked': 5,
        },
        {
            'log_text': (
                "Designed new operational monitoring dashboard. Improved visibility into system "
                "health metrics."
            ),
            'tasks_planned': 4,
            'tasks_completed': 4,
            'hours_worked': 8,
        },
        {
            'log_text': (
                "Led knowledge transfer session for new operations team member. Documented all "
                "runbooks and procedures."
            ),
            'tasks_planned': 3,
            'tasks_completed': 3,
            'hours_worked': 6,
        },
    ],
}


class Command(BaseCommand):
    help = 'Seed the database with demo departments, users, KPI rules and work logs.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('=== Seeding KPI rules ==='))
        self._seed_kpi_rules()

        self.stdout.write(self.style.MIGRATE_HEADING('=== Seeding departments ==='))
        depts = self._seed_departments()

        self.stdout.write(self.style.MIGRATE_HEADING('=== Seeding users ==='))
        users = self._seed_users(depts)

        self.stdout.write(self.style.MIGRATE_HEADING('=== Seeding work logs ==='))
        self._seed_logs(users)

        self.stdout.write(self.style.MIGRATE_HEADING('=== Calculating KPIs ==='))
        self._calculate_kpis(users)

        self.stdout.write(self.style.SUCCESS('Done! Database seeded successfully.'))

    # ── helpers ──────────────────────────────────────────────────────────────

    def _seed_kpi_rules(self):
        count = 0
        for metric, keywords in KPI_KEYWORDS.items():
            for kw in keywords:
                _, created = KpiRule.objects.get_or_create(metric=metric, keyword=kw)
                if created:
                    count += 1
        self.stdout.write(f'  KPI rules: {count} new rows inserted.')

    def _seed_departments(self):
        dept_names = [
            'Engineering', 'Product', 'Operations', 'Human Resources',
            'Quality Assurance', 'DevOps & Infrastructure',
            'Data Science & Analytics', 'UI/UX Design',
            'Sales & Business Development', 'Finance & Accounting',
        ]
        depts = {}
        for name in dept_names:
            dept, created = Department.objects.get_or_create(name=name)
            depts[name] = dept
            status = 'created' if created else 'already exists'
            self.stdout.write(f'  Department "{name}": {status}')
        return depts

    def _seed_users(self, depts):
        user_defs = [
            # (name, email, password, role, dept_key)
            ('Alice Johnson',  'alice@company.com', 'Manager@123', 'manager',  'Engineering'),
            ('Bob Smith',      'bob@company.com',   'Manager@123', 'manager',  'Product'),
            ('Carol Davis',    'carol@company.com', 'Emp@123',     'employee', 'Engineering'),
            ('David Lee',      'david@company.com', 'Emp@123',     'employee', 'Engineering'),
            ('Eva Martinez',   'eva@company.com',   'Emp@123',     'employee', 'Product'),
            ('Frank Wilson',   'frank@company.com', 'Emp@123',     'employee', 'Product'),
            ('Grace Kim',      'grace@company.com', 'Emp@123',     'employee', 'Operations'),
            ('Henry Chen',     'henry@company.com', 'Emp@123',     'employee', 'Operations'),
        ]

        users = {}
        for name, email, password, role, dept_key in user_defs:
            dept = depts[dept_key]
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'role': role,
                    'department': dept,
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  User created: {name} <{email}> ({role})')
            else:
                self.stdout.write(f'  User already exists: {name} <{email}>')
            users[email] = user

        # Assign managers as department managers
        alice = users['alice@company.com']
        bob = users['bob@company.com']
        eng_dept = depts['Engineering']
        prod_dept = depts['Product']
        if eng_dept.manager != alice:
            eng_dept.manager = alice
            eng_dept.save()
        if prod_dept.manager != bob:
            prod_dept.manager = bob
            prod_dept.save()

        return users

    def _seed_logs(self, users):
        today = date.today()
        employee_emails = [
            'carol@company.com', 'david@company.com',
            'eva@company.com',   'frank@company.com',
            'grace@company.com', 'henry@company.com',
        ]

        for email in employee_emails:
            user = users[email]
            log_defs = EMPLOYEE_LOGS[email]
            self.stdout.write(f'  Logs for {user.name}:')

            for i, log_def in enumerate(log_defs):
                log_date = today - timedelta(days=i * 2)

                # Check if a log with same text already exists for this user on this date
                existing = WorkLog.objects.filter(
                    user=user,
                    log_text=log_def['log_text'],
                ).first()

                if existing:
                    log = existing
                    self.stdout.write(f'    [{log_date}] already exists (id={log.pk})')
                else:
                    log = WorkLog(
                        user=user,
                        log_text=log_def['log_text'],
                        tasks_planned=log_def['tasks_planned'],
                        tasks_completed=log_def['tasks_completed'],
                        hours_worked=log_def['hours_worked'],
                    )
                    # Override auto_now_add date by saving then updating
                    log.save()
                    # Update the date field directly (auto_now_add blocks normal assignment)
                    WorkLog.objects.filter(pk=log.pk).update(date=log_date)
                    log.refresh_from_db()

                    # Run ML classification and clustering
                    category = classify_log(log.log_text)
                    cluster = assign_cluster(log.log_text)
                    if category:
                        log.svm_category = category
                    if cluster:
                        log.cluster = cluster
                    log.save()

                    self.stdout.write(
                        f'    [{log_date}] created — category={category}, cluster={cluster}'
                    )

    def _calculate_kpis(self, users):
        employee_emails = [
            'carol@company.com', 'david@company.com',
            'eva@company.com',   'frank@company.com',
            'grace@company.com', 'henry@company.com',
        ]

        today = date.today()
        # Compute unique week_start values for the dates we inserted (last 10 days)
        week_starts = set()
        for i in range(5):
            log_date = today - timedelta(days=i * 2)
            week_starts.add(get_week_start(log_date))

        for email in employee_emails:
            user = users[email]
            for ws in sorted(week_starts):
                kpi = calculate_kpi(user, week_start=ws)
                if kpi:
                    self.stdout.write(
                        f'  KPI for {user.name} week {ws}: overall={kpi.overall}'
                    )
                else:
                    self.stdout.write(
                        f'  KPI for {user.name} week {ws}: no logs found'
                    )
