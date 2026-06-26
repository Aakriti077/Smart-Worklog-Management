from rest_framework import serializers
from .models import KpiScore
from .engine import explain_kpi


class KpiScoreSerializer(serializers.ModelSerializer):
    user_name    = serializers.CharField(source='user.name', read_only=True)
    explanations = serializers.SerializerMethodField()

    class Meta:
        model  = KpiScore
        fields = [
            'id', 'user', 'user_name', 'week_start',
            'productivity', 'consistency', 'quality', 'diversity',
            'leadership', 'collaboration', 'innovation', 'learning', 'overall',
            'explanations',
        ]

    def get_explanations(self, obj):
        return explain_kpi(obj)
