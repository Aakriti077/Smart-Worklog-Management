# Management command to (re)train the SVM classifier and K-Means clusterer
# Deletes existing .pkl files so the models are retrained from scratch

import os
from django.core.management.base import BaseCommand

import ml.classifier as classifier_module
import ml.clusterer as clusterer_module


class Command(BaseCommand):
    help = 'Delete existing ML model files and retrain both the SVM classifier and K-Means clusterer.'

    def handle(self, *args, **options):
        # ── SVM classifier ───────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('=== Training SVM classifier ==='))

        model_path = classifier_module.MODEL_PATH
        if os.path.exists(model_path):
            os.remove(model_path)
            self.stdout.write(f'  Deleted old model: {model_path}')

        # Reset the cached in-memory model so a fresh one is trained
        classifier_module._model = None

        model = classifier_module.get_or_train_model()
        self.stdout.write(self.style.SUCCESS(
            f'  SVM model trained and saved to {model_path}'
        ))

        # ── K-Means clusterer ────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('=== Training K-Means clusterer ==='))

        # Reset in-memory state and retrain
        clusterer_module._vectorizer = None
        clusterer_module._kmeans = None
        clusterer_module._train()

        self.stdout.write(self.style.SUCCESS(
            f'  K-Means model trained ({len(clusterer_module.CLUSTER_LABELS)} clusters: '
            + ', '.join(clusterer_module.CLUSTER_LABELS) + ')'
        ))

        self.stdout.write(self.style.SUCCESS('All models trained successfully.'))
