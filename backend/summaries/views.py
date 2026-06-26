from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsManagerOrAdmin
from users.models import User
from .models import Summary
from .serializers import SummarySerializer
from .engine import generate_summary


class MySummaryView(APIView):
    """GET /summaries/me/ — employee sees their own summaries."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summaries = Summary.objects.filter(user=request.user)
        return Response(SummarySerializer(summaries, many=True).data)


# Alias so URLs can import either name
MySummariesView = MySummaryView


class GenerateOwnSummaryView(APIView):
    """POST /summaries/me/generate/ — employee generates their own summary for the requested period."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from datetime import date as date_type, timedelta as td

        today = date_type.today()
        date_param = request.data.get('date')
        period = request.data.get('period', 'week')

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

        if date_param:
            try:
                d = date_type.fromisoformat(date_param)
                date_from, date_to = d, d
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        else:
            if period == 'all':
                from worklogs.models import WorkLog
                first_log = WorkLog.objects.filter(user=request.user).order_by('date').first()
                if first_log:
                    date_from, date_to = first_log.date, today
                else:
                    return Response({'error': 'No logs found for this period'}, status=400)
            elif period in PERIOD_MAP:
                date_from, date_to = PERIOD_MAP[period]
            else:
                return Response({'error': f'Unknown period "{period}".'}, status=400)

        pt = period if not date_param else None
        summary = generate_summary(request.user, date_from, date_to=date_to, period_type=pt)
        if not summary:
            return Response({'error': 'No logs found for this period'}, status=400)
        return Response(SummarySerializer(summary).data)


class GenerateSummaryView(APIView):
    """POST /summaries/generate/<user_id>/ — manager/admin generates a summary for any employee."""
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, user_id):
        from datetime import date as date_type, timedelta as td
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        if request.user.role == 'manager' and user.department != request.user.department:
            return Response({'error': 'Not authorized for this employee.'}, status=403)

        today = date_type.today()
        date_from = None
        date_to = None

        date_param = request.data.get('date')
        period = request.data.get('period', 'week')

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

        if date_param:
            try:
                d = date_type.fromisoformat(date_param)
                date_from, date_to = d, d
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
        else:
            if period == 'all':
                from worklogs.models import WorkLog
                first_log = WorkLog.objects.filter(user=user).order_by('date').first()
                if first_log:
                    date_from, date_to = first_log.date, today
                else:
                    return Response({'error': 'No logs found for this period.'}, status=400)
            elif period in PERIOD_MAP:
                date_from, date_to = PERIOD_MAP[period]
            else:
                return Response({'error': f'Unknown period "{period}".'}, status=400)

        pt = period if not date_param else None
        summary = generate_summary(user, date_from, date_to=date_to, period_type=pt)
        if not summary:
            return Response({'error': 'No logs found for this period.'}, status=400)
        return Response(SummarySerializer(summary).data)


class UserSummaryView(APIView):
    """GET /summaries/user/<user_id>/ — manager/admin views all summaries for an employee."""
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        if request.user.role == 'manager' and user.department != request.user.department:
            return Response({'error': 'Not authorized for this employee.'}, status=403)
        summaries = Summary.objects.filter(user_id=user_id)
        return Response(SummarySerializer(summaries, many=True).data)
