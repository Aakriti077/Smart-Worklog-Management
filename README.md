# Smart Employee WorkLog Management System

A full-stack web application for employee performance evaluation and worklog management, built with Django REST Framework and React.

---

## Features

### Employee
- Submit daily work logs (ML auto-classifies into categories)
- View and manage own logs (edit / delete)
- Track assigned tasks and update status (pending → in progress → completed)
- View weekly KPI scores with radar chart and trend analysis
- Generate AI-powered weekly summaries (TF-IDF extractive summarization)

### Manager
- Assign tasks to team employees with priority and deadline
- View team task progress
- Calculate and review KPI scores for each team member
- View team work logs and summaries

### Admin
- Full user management (create, enable/disable, reset password)
- Department management
- Organisation chart (manager → employee hierarchy)
- View all logs across the system
- Employee performance rankings
- ML Insights: test the SVM classifier and retrain the model

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, Vite, Recharts |
| Database | PostgreSQL |
| Authentication | JWT (Simple JWT) |
| ML Classification | SVM + TF-IDF (scikit-learn), trained on 64,000 examples |
| Summarization | TF-IDF extractive summarization |
| Clustering | K-Means++ |

---

## ML Components

- **SVM Classifier** — classifies work logs into 8 categories: Backend Development, Frontend Development, Testing, Code Review, Documentation, Meetings, DevOps, Research. Trained on 64,000 synthetic labeled examples. Uses a confidence threshold to label unrelated text as "Unrelated / General".
- **K-Means Clustering** — groups logs into 5 behavioral clusters.
- **TF-IDF Summarization** — extracts the top 3 most representative sentences from a week's logs to generate a summary.
- **KPI Engine** — rule-based scoring across 8 metrics: Productivity, Consistency, Quality, Diversity, Leadership, Collaboration, Innovation, Learning.

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py train_models
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | Admin@123 |
| Manager | alice@company.com | Manager@123 |
| Employee | henry@company.com | Emp@123 |

---

## Project Structure

```
├── backend/
│   ├── authentication/     # JWT login/logout
│   ├── users/              # User management, roles
│   ├── departments/        # Department CRUD
│   ├── worklogs/           # Work log submission and retrieval
│   ├── kpi/                # KPI calculation engine
│   ├── summaries/          # TF-IDF summary generation
│   ├── ml/                 # SVM classifier + K-Means clusterer
│   └── tasks/              # Task assignment system
└── frontend/
    └── src/
        ├── pages/
        │   ├── admin/      # Admin dashboard, users, departments, rankings, ML
        │   ├── manager/    # Manager dashboard, tasks, team KPIs
        │   └── employee/   # Employee dashboard, logs, tasks, KPIs, summaries
        ├── components/     # Sidebar, Topbar
        └── context/        # Auth context (JWT)
```
