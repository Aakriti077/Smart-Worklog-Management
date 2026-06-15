# Authentication views — handles login and fetching the current user
# JWT tokens are used so the frontend can make authenticated API requests

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from users.serializers import UserSerializer


class LoginView(APIView):
    # Anyone can access the login endpoint (no token needed)
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Django's authenticate checks the email and password against the database
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)

        # Generate JWT access and refresh tokens for the logged-in user
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),   # Short-lived token for API requests
            'refresh': str(refresh),                # Long-lived token to get a new access token
            'user': UserSerializer(user).data,      # User details sent to the frontend
        })


class MeView(APIView):
    # Returns the currently logged-in user's profile
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
