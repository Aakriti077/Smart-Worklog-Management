# Work log API views — handles creating and retrieving work logs
# When a log is submitted, it automatically runs SVM classification and K-Means clustering

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsManagerOrAdmin
from .models import WorkLog
from .serializers import WorkLogSerializer, WorkLogCreateSerializer
from ml.classifier import classify_log
from ml.clusterer import assign_cluster


class WorkLogListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            # Admin sees all logs across the entire organisation
            logs = WorkLog.objects.select_related('user', 'svm_category', 'cluster').all()
        elif user.role == 'manager':
            # Manager only sees logs from employees in their own department
            logs = WorkLog.objects.select_related('user', 'svm_category', 'cluster').filter(
                user__department=user.department
            )
        else:
            # Employee sees only their own logs
            logs = WorkLog.objects.select_related('svm_category', 'cluster').filter(user=user)
        return Response(WorkLogSerializer(logs, many=True).data)

    def post(self, request):
        serializer = WorkLogCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # Save the log first, then run ML on the text
        log = serializer.save(user=request.user)

        # SVM classifies the log text into a category (e.g. Backend, Testing)
        category = classify_log(log.log_text)
        # K-Means assigns the log to a cluster (e.g. Bug Fixing, Feature Building)
        cluster = assign_cluster(log.log_text)

        if category:
            log.svm_category = category
        if cluster:
            log.cluster = cluster
        log.save()

        return Response(WorkLogSerializer(log).data, status=201)


class UserWorkLogView(APIView):
    # Manager/admin can view logs for a specific employee
    permission_classes = [IsManagerOrAdmin]

    def get(self, request, user_id):
        user = request.user
        # Manager can only access employees in their own department
        if user.role == 'manager':
            from users.models import User as UserModel
            try:
                target = UserModel.objects.get(pk=user_id)
            except UserModel.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
            if target.department != user.department:
                return Response({'error': 'Not authorized'}, status=403)

        logs = WorkLog.objects.filter(user_id=user_id).select_related('svm_category', 'cluster')
        return Response(WorkLogSerializer(logs, many=True).data)


class WorkLogDetailView(APIView):
    """GET/PUT/DELETE a single work log by primary key.

    - GET:    owner, manager of the same dept, or admin may read the log.
    - PUT:    owner only — updates log_text, tasks_planned, tasks_completed, hours_worked
              and re-runs ML classification/clustering.
    - DELETE: owner only.
    """
    permission_classes = [IsAuthenticated]

    def _get_log_or_404(self, pk):
        try:
            return WorkLog.objects.select_related(
                'user', 'svm_category', 'cluster'
            ).get(pk=pk)
        except WorkLog.DoesNotExist:
            return None

    def _can_read(self, request_user, log):
        if request_user.role == 'admin':
            return True
        if request_user == log.user:
            return True
        if request_user.role == 'manager' and log.user.department == request_user.department:
            return True
        return False

    def get(self, request, pk):
        log = self._get_log_or_404(pk)
        if log is None:
            return Response({'error': 'Log not found'}, status=404)
        if not self._can_read(request.user, log):
            return Response({'error': 'Not authorized'}, status=403)
        return Response(WorkLogSerializer(log).data)

    def put(self, request, pk):
        log = self._get_log_or_404(pk)
        if log is None:
            return Response({'error': 'Log not found'}, status=404)
        if request.user != log.user:
            return Response({'error': 'Only the owner can edit this log'}, status=403)

        serializer = WorkLogCreateSerializer(log, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        log = serializer.save()

        # Re-run ML if log_text changed
        if 'log_text' in request.data:
            category = classify_log(log.log_text)
            cluster = assign_cluster(log.log_text)
            if category:
                log.svm_category = category
            if cluster:
                log.cluster = cluster
            log.save()

        return Response(WorkLogSerializer(log).data)

    def delete(self, request, pk):
        log = self._get_log_or_404(pk)
        if log is None:
            return Response({'error': 'Log not found'}, status=404)
        if request.user != log.user:
            return Response({'error': 'Only the owner can delete this log'}, status=403)
        log.delete()
        return Response({'message': 'Log deleted successfully'}, status=200)
