from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'manager', 'manager_name', 'member_count']

    def get_member_count(self, obj):
        return obj.members.count()
