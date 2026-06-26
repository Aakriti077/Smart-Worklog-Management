from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('summaries', '0003_summary_add_period_end'),
    ]

    operations = [
        migrations.AddField(
            model_name='summary',
            name='period_type',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
