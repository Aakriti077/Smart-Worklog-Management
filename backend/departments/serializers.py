from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    manager_names = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'manager', 'manager_name', 'manager_names', 'member_count', 'members']

    def get_member_count(self, obj):
        return sum(1 for u in obj.members.all() if u.is_active)

    def get_manager_names(self, obj):
        return [u.name for u in obj.members.all() if u.role == 'manager']

    def get_members(self, obj):
        return [
            {'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role}
            for u in obj.members.all() if u.is_active
        ]
