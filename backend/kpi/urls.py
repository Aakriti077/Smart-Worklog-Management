from django.urls import path
from .views import MyKpiView, CalculateKpiView, UserKpiView, RankingsView, AdminOverviewView

urlpatterns = [
    path('me/', MyKpiView.as_view()),
    path('calculate/<int:user_id>/', CalculateKpiView.as_view()),
    path('user/<int:user_id>/', UserKpiView.as_view()),
    path('rankings/', RankingsView.as_view()),
    path('admin/overview/', AdminOverviewView.as_view()),
]
