from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsManagerOrAdmin
from users.models import User
from .models import Summary
from .serializers import SummarySerializer
from .engine import generate_summary
from kpi.engine import get_week_start


class MySummaryView(APIView):
    """GET /summaries/me/ — employee sees their own summaries."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summaries = Summary.objects.filter(user=request.user)
        return Response(SummarySerializer(summaries, many=True).data)


# Alias so URLs can import either name
MySummariesView = MySummaryView


class GenerateOwnSummaryView(APIView):
    """POST /summaries/me/generate/ — employee generates their own current-week summary."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        week_start = get_week_start()
        summary = generate_summary(request.user, week_start)
        if not summary:
            return Response({'error': 'No logs found for this week'}, status=400)
        return Response(SummarySerializer(summary).data)


class GenerateSummaryView(APIView):
    """POST /summaries/generate/<user_id>/ — manager/admin generates a summary for any employee."""
    permission_classes = [IsManagerOrAdmin]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        week_start = get_week_start()
        summary = generate_summary(user, week_start)
        if not summary:
            return Response({'error': 'No logs found for this week'}, status=400)
        return Response(SummarySerializer(summary).data)


class UserSummaryView(APIView):
    """GET /summaries/user/<user_id>/ — manager/admin views all summaries for an employee."""
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, user_id):
        summaries = Summary.objects.filter(user_id=user_id)
        return Response(SummarySerializer(summaries, many=True).data)
