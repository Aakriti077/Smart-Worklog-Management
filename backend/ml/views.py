from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdmin
from .classifier import classify_log, retrain, get_eval_report
from .training_data import generate_training_data
from .clusterer import assign_cluster


class ClassifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'text required'}, status=400)
        category = classify_log(text)
        cluster = assign_cluster(text)
        return Response({
            'category': category.name if category else None,
            'cluster': cluster.name if cluster else None,
        })


class MLInfoView(APIView):
    """GET /api/ml/info/ — returns model metadata for the admin ML Insights page."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from worklogs.models import Category, Cluster

        categories = list(Category.objects.values_list('name', flat=True))
        clusters = list(Cluster.objects.values_list('name', flat=True))

        # Count training examples per category
        training_data = generate_training_data()
        label_counts = {}
        for _, label in training_data:
            label_counts[label] = label_counts.get(label, 0) + 1

        return Response({
            'svm': {
                'total_training': len(training_data),
                'categories': categories,
                'label_counts': label_counts,
            },
            'kmeans': {
                'num_clusters': len(clusters),
                'clusters': clusters,
            },
        })


class RetrainView(APIView):
    """POST /api/ml/retrain/ — admin-only force retrain of the SVM model."""
    permission_classes = [IsAdmin]

    def post(self, request):
        try:
            retrain()
            report = get_eval_report()
            return Response({'message': 'Model retrained successfully.', 'eval': report})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class EvalReportView(APIView):
    """GET /api/ml/eval/ — return the latest model evaluation report."""
    permission_classes = [IsAdmin]

    def get(self, request):
        report = get_eval_report()
        if not report:
            return Response({'error': 'No evaluation report found. Retrain the model first.'}, status=404)
        return Response(report)
