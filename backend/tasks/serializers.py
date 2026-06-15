from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.name', read_only=True)
    assigned_to_dept = serializers.CharField(source='assigned_to.department.name', read_only=True)
    log_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'assigned_to', 'assigned_to_name', 'assigned_to_dept',
            'assigned_by', 'assigned_by_name',
            'deadline', 'created_at', 'updated_at', 'log_count'
        ]
        read_only_fields = ['assigned_by', 'created_at', 'updated_at']

    def get_log_count(self, obj):
        return obj.logs.count()
