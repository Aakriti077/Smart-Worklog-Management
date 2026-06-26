from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsManagerOrAdmin, IsAdmin
from users.models import User
from .models import KpiScore
from .serializers import KpiScoreSerializer
from .engine import calculate_kpi, get_week_start


class MyKpiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scores = KpiScore.objects.filter(user=request.user).order_by('-week_start')
        return Response(KpiScoreSerializer(scores, many=True).data)


class CalculateMyKpiView(APIView):
    """POST /kpi/me/calculate/ — employee calculates their own KPI for a given period."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from datetime import date as date_type, timedelta as td
        from worklogs.models import WorkLog

        today = date_type.today()
        period = request.data.get('period', 'week')
        date_param = request.data.get('date')

        week_start = None
        single_date = None
        date_from = None
        date_to = None

        if date_param:
            try:
                single_date = date_type.fromisoformat(date_param)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        else:
            PERIOD_MAP = {
                'today':     (today, today),
                'yesterday': (today - td(days=1), today - td(days=1)),
                'week':      (today - td(days=7), today),
                '1w':        (today - td(days=7), today),
                '1m':        (today - td(days=30), today),
                '3m':        (today - td(days=90), today),
                '6m':        (today - td(days=182), today),
                '1y':        (today - td(days=365), today),
            }
            if period == 'all':
                first_log = WorkLog.objects.filter(user=request.user).order_by('date').first()
                if first_log:
                    date_from, date_to = first_log.date, today
                else:
                    return Response({'error': 'No logs found.'}, status=400)
            elif period in PERIOD_MAP:
                date_from, date_to = PERIOD_MAP[period]
            else:
                return Response({'error': f'Unknown period "{period}".'}, status=400)

        kpi = calculate_kpi(
            request.user,
            week_start=week_start,
            single_date=single_date,
            date_from=date_from,
            date_to=date_to,
        )
        if not kpi:
            return Response({'error': 'No logs found for this period.'}, status=400)
        return Response(KpiScoreSerializer(kpi).data)


class CalculateKpiView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, user_id):
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Manager can only calculate KPI for employees in their own department
        if request.user.role == 'manager' and target.department != request.user.department:
            return Response({'error': 'Not authorized for this employee'}, status=403)

        from datetime import date as date_type, timedelta as td

        today = date_type.today()
        week_start = None
        single_date = None
        date_from = None
        date_to = None

        period = request.data.get('period', 'week')
        date_param = request.data.get('date')

        if date_param:
            # Specific single day
            try:
                single_date = date_type.fromisoformat(date_param)
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        else:
            PERIOD_MAP = {
                'today':     (today, today),
                'yesterday': (today - td(days=1), today - td(days=1)),
                'week':      (today - td(days=7), today),
                '1w':        (today - td(days=7), today),
                '1m':        (today - td(days=30), today),
                '3m':        (today - td(days=90), today),
                '6m':        (today - td(days=182), today),
                '1y':        (today - td(days=365), today),
            }
            if period == 'all':
                from worklogs.models import WorkLog
                first_log = WorkLog.objects.filter(user=target).order_by('date').first()
                if first_log:
                    date_from, date_to = first_log.date, today
                else:
                    return Response({'error': 'No logs found for this period.'}, status=400)
            elif period in PERIOD_MAP:
                date_from, date_to = PERIOD_MAP[period]
            else:
                return Response({'error': f'Unknown period "{period}".'}, status=400)

        kpi = calculate_kpi(target, week_start=week_start, single_date=single_date, date_from=date_from, date_to=date_to)
        if not kpi:
            return Response({'error': 'No logs found for this period.'}, status=400)
        return Response(KpiScoreSerializer(kpi).data)


class UserKpiView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, user_id):
        # Manager can only see KPIs of employees in their department
        if request.user.role == 'manager':
            try:
                target = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
            if target.department != request.user.department:
                return Response({'error': 'Not authorized'}, status=403)

        scores = KpiScore.objects.filter(user_id=user_id).order_by('-week_start')
        return Response(KpiScoreSerializer(scores, many=True).data)


class RankingsView(APIView):
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        from datetime import date, timedelta
        from django.db.models import Avg

        period = request.query_params.get('period', 'today')
        date_param = request.query_params.get('date', '')
        today = date.today()

        # Rolling window in days — matches the same logic used in the All Logs frontend filter
        PERIOD_DAYS = {'1w': 7, '1m': 30, '3m': 90, '6m': 182, '1y': 365}

        base_qs = KpiScore.objects.select_related('user').filter(user__role='employee')
        if request.user.role != 'admin':
            base_qs = base_qs.filter(user__department=request.user.department)

        # Specific date: try exact date first (single-day KPIs), then the week's Monday
        if date_param:
            try:
                target_date = date.fromisoformat(date_param)
                scores = base_qs.filter(week_start=target_date).order_by('-overall')
                if not scores.exists():
                    scores = base_qs.filter(week_start=get_week_start(target_date)).order_by('-overall')
                return Response(KpiScoreSerializer(scores, many=True).data)
            except ValueError:
                pass

        if period == 'latest':
            latest_week = base_qs.order_by('-week_start').values_list('week_start', flat=True).first()
            if not latest_week:
                return Response([])
            scores = base_qs.filter(week_start=latest_week).order_by('-overall')
            return Response(KpiScoreSerializer(scores, many=True).data)

        if period == 'today':
            scores = base_qs.filter(week_start=today).order_by('-overall')
            return Response(KpiScoreSerializer(scores, many=True).data)

        if period == 'yesterday':
            scores = base_qs.filter(week_start=today - timedelta(days=1)).order_by('-overall')
            return Response(KpiScoreSerializer(scores, many=True).data)

        # For all rolling-window periods (1w, 1m, 3m, 6m, 1y) aggregate all KPI records
        # within the window — same as how All Logs filters by date range
        if period in PERIOD_DAYS:
            base_qs = base_qs.filter(week_start__gte=today - timedelta(days=PERIOD_DAYS[period]))

        aggregated = (
            base_qs
            .values('user', 'user__name')
            .annotate(
                overall=Avg('overall'), productivity=Avg('productivity'),
                consistency=Avg('consistency'), quality=Avg('quality'),
                diversity=Avg('diversity'), leadership=Avg('leadership'),
                collaboration=Avg('collaboration'), innovation=Avg('innovation'),
                learning=Avg('learning'),
            )
            .order_by('-overall')
        )

        result = [
            {
                'id': a['user'], 'user': a['user'], 'user_name': a['user__name'],
                'week_start': str(today), 'overall': round(a['overall'] or 0, 2),
                'productivity': round(a['productivity'] or 0, 2),
                'consistency': round(a['consistency'] or 0, 2),
                'quality': round(a['quality'] or 0, 2),
                'diversity': round(a['diversity'] or 0, 2),
                'leadership': round(a['leadership'] or 0, 2),
                'collaboration': round(a['collaboration'] or 0, 2),
                'innovation': round(a['innovation'] or 0, 2),
                'learning': round(a['learning'] or 0, 2),
            }
            for a in aggregated
        ]
        return Response(result)


class AdminOverviewView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from users.models import User
        from worklogs.models import WorkLog
        from departments.models import Department
        from django.db.models import Avg
        from datetime import date, timedelta

        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today - timedelta(days=30)

        # Per-department avg KPI score last 30 days
        dept_performance = []
        for dept in Department.objects.all():
            dept_kpis = KpiScore.objects.filter(
                week_start__gte=month_start, user__department=dept
            )
            emp_count = User.objects.filter(department=dept, role='employee').count()
            avg = dept_kpis.aggregate(avg=Avg('overall'))['avg']
            dept_performance.append({
                'name': dept.name,
                'avg_score': round(float(avg), 1) if avg else None,
                'evaluated': dept_kpis.count(),
                'employees': emp_count,
            })

        # Recent work log activity (last 5)
        recent_logs = WorkLog.objects.select_related('user', 'svm_category').order_by('-date', '-id')[:5]
        recent_activity = [
            {
                'user': log.user.name,
                'category': log.svm_category.name if log.svm_category else 'Unclassified',
                'completed': log.tasks_completed,
                'planned': log.tasks_planned,
                'date': str(log.date),
            }
            for log in recent_logs
        ]

        return Response({
            'total_users':       User.objects.exclude(role='admin').count(),
            'total_employees':   User.objects.filter(role='employee').count(),
            'total_managers':    User.objects.filter(role='manager').count(),
            'total_departments': Department.objects.count(),
            'total_logs':        WorkLog.objects.count(),
            'logs_this_week':    WorkLog.objects.filter(date__gte=week_start).count(),
            'logs_this_month':   WorkLog.objects.filter(date__gte=month_start).count(),
            'total_kpi_records': KpiScore.objects.count(),
            'active_users':      User.objects.exclude(role='admin').filter(is_active=True).count(),
            'inactive_users':    User.objects.exclude(role='admin').filter(is_active=False).count(),
            'kpis_this_week':    KpiScore.objects.filter(week_start=week_start).count(),
            'kpis_this_month':   KpiScore.objects.filter(week_start__gte=month_start).count(),
            'dept_performance':  dept_performance,
            'recent_activity':   recent_activity,
        })
