from datetime import timedelta

from django.db import migrations, models


def backfill_period_end(apps, schema_editor):
    Summary = apps.get_model('summaries', 'Summary')
    for s in Summary.objects.filter(period_end__isnull=True):
        s.period_end = s.week_start + timedelta(days=6)
        s.save(update_fields=['period_end'])


class Migration(migrations.Migration):

    dependencies = [
        ('summaries', '0002_initial'),
    ]

    operations = [
        # Step 1: add nullable field
        migrations.AddField(
            model_name='summary',
            name='period_end',
            field=models.DateField(blank=True, null=True),
        ),
        # Step 2: backfill existing rows as weekly (week_start + 6 days)
        migrations.RunPython(backfill_period_end, migrations.RunPython.noop),
        # Step 3: swap unique constraint to include period_end
        migrations.AlterUniqueTogether(
            name='summary',
            unique_together={('user', 'week_start', 'period_end')},
        ),
    ]
