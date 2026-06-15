from django.db import models


class KpiScore(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='kpi_scores')
    week_start = models.DateField()
    productivity = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    consistency = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    quality = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    diversity = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    leadership = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    collaboration = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    innovation = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    learning = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = 'kpi_scores'
        unique_together = ('user', 'week_start')
        ordering = ['-week_start']

    def __str__(self):
        return f'{self.user.name} — week {self.week_start} — {self.overall}'


class KpiRule(models.Model):
    metric = models.CharField(max_length=50)
    keyword = models.CharField(max_length=100)

    class Meta:
        db_table = 'kpi_rules'
        unique_together = ('metric', 'keyword')

    def __str__(self):
        return f'{self.metric}: {self.keyword}'
