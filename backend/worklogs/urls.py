from django.urls import path
from .views import WorkLogListCreateView, UserWorkLogView, WorkLogDetailView

urlpatterns = [
    path('', WorkLogListCreateView.as_view()),
    path('<int:pk>/', WorkLogDetailView.as_view()),
    path('user/<int:user_id>/', UserWorkLogView.as_view()),
]
