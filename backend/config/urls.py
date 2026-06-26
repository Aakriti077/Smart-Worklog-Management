from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/users/', include('users.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/worklogs/', include('worklogs.urls')),
    path('api/kpi/', include('kpi.urls')),
    path('api/summaries/', include('summaries.urls')),
    path('api/ml/', include('ml.urls')),
    path('api/tasks/', include('tasks.urls')),
    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
