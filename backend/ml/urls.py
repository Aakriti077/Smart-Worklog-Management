from django.urls import path
from .views import ClassifyView, MLInfoView, RetrainView

urlpatterns = [
    path('classify/', ClassifyView.as_view()),
    path('info/', MLInfoView.as_view()),
    path('retrain/', RetrainView.as_view()),
]
