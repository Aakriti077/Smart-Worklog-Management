from django.db import models


class Summary(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='summaries')
    week_start = models.DateField()
    summary_text = models.TextField(blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'summaries'
        unique_together = ('user', 'week_start')
        ordering = ['-week_start']

    def __str__(self):
        return f'{self.user.name} — week {self.week_start}'
