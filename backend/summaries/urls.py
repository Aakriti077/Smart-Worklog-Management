from django.urls import path
from .views import MySummaryView, GenerateOwnSummaryView, GenerateSummaryView, UserSummaryView

urlpatterns = [
    path('me/', MySummaryView.as_view()),
    path('me/generate/', GenerateOwnSummaryView.as_view()),
    path('generate/<int:user_id>/', GenerateSummaryView.as_view()),
    path('user/<int:user_id>/', UserSummaryView.as_view()),
]
