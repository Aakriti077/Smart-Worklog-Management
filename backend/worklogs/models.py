from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name


class Cluster(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'clusters'

    def __str__(self):
        return self.name


class WorkLog(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='work_logs')
    log_text = models.TextField()
    tasks_planned = models.IntegerField(default=0)
    tasks_completed = models.IntegerField(default=0)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    task = models.ForeignKey('tasks.Task', null=True, blank=True, on_delete=models.SET_NULL, related_name='logs')
    date = models.DateField(auto_now_add=True)
    svm_category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    cluster = models.ForeignKey(Cluster, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'work_logs'
        ordering = ['-date']

    def __str__(self):
        return f'{self.user.name} — {self.date}'
