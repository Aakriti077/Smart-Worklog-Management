from django.contrib import admin
from .models import WorkLog, Category, Cluster


@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'svm_category', 'cluster', 'tasks_planned', 'tasks_completed', 'hours_worked')
    list_filter = ('svm_category', 'cluster', 'date')
    search_fields = ('user__name', 'user__email', 'log_text')
    ordering = ('-date',)
    date_hierarchy = 'date'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Cluster)
class ClusterAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
