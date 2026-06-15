from rest_framework import serializers
from .models import KpiScore


class KpiScoreSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = KpiScore
        fields = [
            'id', 'user', 'user_name', 'week_start',
            'productivity', 'consistency', 'quality', 'diversity',
            'leadership', 'collaboration', 'innovation', 'learning', 'overall'
        ]
