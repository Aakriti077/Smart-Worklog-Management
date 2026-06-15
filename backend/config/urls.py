from django.contrib import admin
from django.urls import path, include

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
]
