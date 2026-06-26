from django.contrib import admin
from .models import Summary


@admin.register(Summary)
class SummaryAdmin(admin.ModelAdmin):
    list_display = ('user', 'week_start', 'period_end', 'generated_at')
    list_filter = ('week_start',)
    search_fields = ('user__name', 'user__email', 'summary_text')
    ordering = ('-week_start',)
    date_hierarchy = 'week_start'
