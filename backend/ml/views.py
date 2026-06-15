from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .classifier import classify_log, TRAINING_DATA, retrain
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
        label_counts = {}
        for _, label in TRAINING_DATA:
            label_counts[label] = label_counts.get(label, 0) + 1

        return Response({
            'svm': {
                'total_training': len(TRAINING_DATA),
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        try:
            retrain()
            return Response({'message': 'Model retrained successfully.'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
