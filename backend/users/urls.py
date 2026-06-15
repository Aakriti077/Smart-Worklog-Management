from django.urls import path
from .views import UserListCreateView, UserDetailView, ToggleUserActiveView, ChangePasswordView, AdminResetPasswordView, UpdateOwnNameView

urlpatterns = [
    path('', UserListCreateView.as_view()),
    path('me/name/', UpdateOwnNameView.as_view()),
    path('<int:pk>/', UserDetailView.as_view()),
    path('<int:pk>/toggle-active/', ToggleUserActiveView.as_view()),
    path('<int:pk>/reset-password/', AdminResetPasswordView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
]
