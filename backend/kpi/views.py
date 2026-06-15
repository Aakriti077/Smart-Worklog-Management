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

        kpi = calculate_kpi(target)
        if not kpi:
            return Response({'error': 'No logs found for this week'}, status=400)
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
        week_start = get_week_start()
        if request.user.role == 'admin':
            # Admin sees all employee rankings company-wide
            scores = KpiScore.objects.filter(week_start=week_start).select_related('user').order_by('-overall')
        else:
            # Manager sees only rankings for their department
            scores = KpiScore.objects.filter(
                week_start=week_start,
                user__department=request.user.department
            ).select_related('user').order_by('-overall')
        return Response(KpiScoreSerializer(scores, many=True).data)


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

        # Per-department avg KPI score this week and employee count
        dept_performance = []
        for dept in Department.objects.all():
            dept_kpis = KpiScore.objects.filter(
                week_start=week_start, user__department=dept
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
        recent_logs = WorkLog.objects.select_related('user', 'svm_category').order_by('-created_at')[:5]
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
            'total_employees':   User.objects.filter(role='employee').count(),
            'total_managers':    User.objects.filter(role='manager').count(),
            'total_departments': Department.objects.count(),
            'total_logs':        WorkLog.objects.count(),
            'logs_this_week':    WorkLog.objects.filter(date__gte=week_start).count(),
            'total_kpi_records': KpiScore.objects.count(),
            'active_users':      User.objects.filter(is_active=True).count(),
            'inactive_users':    User.objects.filter(is_active=False).count(),
            'kpis_this_week':    KpiScore.objects.filter(week_start=week_start).count(),
            'dept_performance':  dept_performance,
            'recent_activity':   recent_activity,
        })
