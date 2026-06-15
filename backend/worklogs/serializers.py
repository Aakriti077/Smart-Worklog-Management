from rest_framework import serializers
from .models import WorkLog, Category, Cluster


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cluster
        fields = ['id', 'name', 'description']


class WorkLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    svm_category_name = serializers.CharField(source='svm_category.name', read_only=True)
    cluster_name = serializers.CharField(source='cluster.name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = WorkLog
        fields = [
            'id', 'user', 'user_name', 'log_text', 'tasks_planned',
            'tasks_completed', 'hours_worked', 'task', 'task_title', 'date',
            'svm_category', 'svm_category_name',
            'cluster', 'cluster_name', 'created_at'
        ]
        read_only_fields = ['user', 'date', 'svm_category', 'cluster', 'created_at']


class WorkLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkLog
        fields = ['log_text', 'tasks_planned', 'tasks_completed', 'hours_worked', 'task']
