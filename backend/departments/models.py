from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    manager = models.ForeignKey(
        'users.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='managed_departments'
    )

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return self.name
