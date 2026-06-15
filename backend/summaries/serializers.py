from rest_framework import serializers
from .models import Summary


class SummarySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Summary
        fields = ['id', 'user', 'user_name', 'week_start', 'summary_text', 'generated_at']
