from django.urls import path
from .views import TaskListCreateView, TaskDetailView, TaskStatusUpdateView, TeamTasksView

urlpatterns = [
    path('', TaskListCreateView.as_view()),
    path('<int:pk>/', TaskDetailView.as_view()),
    path('<int:pk>/status/', TaskStatusUpdateView.as_view()),
    path('team/', TeamTasksView.as_view()),
]
