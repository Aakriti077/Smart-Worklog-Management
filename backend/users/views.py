from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer, UserCreateSerializer
from .permissions import IsAdmin


class UserListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            # Admin sees every user in the system
            users = User.objects.select_related('department').all()
        elif user.role == 'manager':
            # Manager only sees employees in their own department
            users = User.objects.select_related('department').filter(
                department=user.department, role='employee'
            )
        else:
            # Employee sees only themselves
            users = User.objects.select_related('department').filter(pk=user.pk)
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            new_user = serializer.save()
            return Response(UserSerializer(new_user).data, status=201)
        return Response(serializer.errors, status=400)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(UserSerializer(user).data)

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if user.role == 'admin' and ('role' in request.data or 'department' in request.data):
            return Response({'error': 'Cannot change role or department of an admin account.'}, status=403)
        if request.data.get('role') == 'admin':
            return Response({'error': 'Cannot promote a user to admin role.'}, status=403)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if user.role == 'admin':
            return Response({'error': 'Cannot delete an admin account.'}, status=403)
        try:
            user.delete()
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        return Response(status=204)


class ToggleUserActiveView(APIView):
    """Admin-only: enable or disable a user account (is_active toggle)."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        user.is_active = not user.is_active
        user.save()
        return Response({'id': user.pk, 'is_active': user.is_active})


class ChangePasswordView(APIView):
    """Authenticated user changes their own password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not old_password or not new_password:
            return Response({'error': 'Both old and new password are required.'}, status=400)

        if not request.user.check_password(old_password):
            return Response({'error': 'Current password is incorrect.'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters.'}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


class UpdateOwnNameView(APIView):
    """Any authenticated user can update their own display name."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Name cannot be empty.'}, status=400)
        if len(name) > 150:
            return Response({'error': 'Name too long.'}, status=400)
        request.user.name = name
        request.user.save()
        return Response(UserSerializer(request.user).data)


class AdminResetPasswordView(APIView):
    """Admin-only: reset any user's password without knowing their old one."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        new_password = request.data.get('new_password', '')
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=400)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        user.set_password(new_password)
        user.save()
        return Response({'message': f'Password for {user.name} reset successfully.'})
