from django.contrib import admin
from .models import KpiScore


@admin.register(KpiScore)
class KpiScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'week_start', 'overall', 'productivity', 'quality', 'collaboration', 'consistency')
    list_filter = ('week_start',)
    search_fields = ('user__name', 'user__email')
    ordering = ('-week_start',)
    date_hierarchy = 'week_start'
