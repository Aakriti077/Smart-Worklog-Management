from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsManagerOrAdmin
from .models import Task
from .serializers import TaskSerializer


class TaskListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            tasks = Task.objects.all()
        elif user.role == 'manager':
            tasks = Task.objects.filter(
                assigned_by=user
            ) | Task.objects.filter(
                assigned_to__department=user.department
            )
            tasks = tasks.distinct()
        else:
            tasks = Task.objects.filter(assigned_to=user)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Lazy import to avoid any potential circular import
        from users.models import User

        assigned_to_id = request.data.get('assigned_to')
        if not assigned_to_id:
            return Response({'error': 'assigned_to is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignee = User.objects.get(pk=assigned_to_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate: assignee must be an employee (not manager or admin)
        if assignee.role != 'employee':
            return Response(
                {'error': 'You can only assign tasks to employees.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate: assignee must be in the manager's department
        manager = request.user
        if assignee.department_id != manager.department_id:
            return Response(
                {'error': 'You can only assign tasks to employees in your department.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(assigned_by=manager)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return None

    def get(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'admin' or task.assigned_to == user or task.assigned_by == user:
            serializer = TaskSerializer(task)
            return Response(serializer.data)
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    def put(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role != 'admin' and task.assigned_by != user:
            return Response({'error': 'Only the assigning manager or admin can update this task.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskSerializer(task, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        task = self.get_object(pk)
        if not task:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role != 'admin' and task.assigned_by != user:
            return Response({'error': 'Only the assigning manager or admin can delete this task.'}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    VALID_TRANSITIONS = {
        'pending': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': ['cancelled'],
        'cancelled': [],
    }

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only the assigned employee can update status
        if task.assigned_to != request.user:
            return Response({'error': 'Only the assigned employee can update task status.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = self.VALID_TRANSITIONS.get(task.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Invalid transition from "{task.status}" to "{new_status}". Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])
        serializer = TaskSerializer(task)
        return Response(serializer.data)


class TeamTasksView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            tasks = Task.objects.all()
        else:
            tasks = Task.objects.filter(assigned_by=user)

        total = tasks.count()
        pending = tasks.filter(status='pending').count()
        in_progress = tasks.filter(status='in_progress').count()
        completed = tasks.filter(status='completed').count()
        cancelled = tasks.filter(status='cancelled').count()

        serializer = TaskSerializer(tasks, many=True)
        return Response({
            'stats': {
                'total': total,
                'pending': pending,
                'in_progress': in_progress,
                'completed': completed,
                'cancelled': cancelled,
            },
            'tasks': serializer.data,
        })
