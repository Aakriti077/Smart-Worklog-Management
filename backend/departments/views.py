from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsAdmin, IsManagerOrAdmin
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsManagerOrAdmin()]

    def get(self, request):
        depts = Department.objects.prefetch_related('members').all()
        return Response(DepartmentSerializer(depts, many=True).data)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class DepartmentDetailView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        try:
            dept = Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        serializer = DepartmentSerializer(dept, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            dept = Department.objects.get(pk=pk)
        except Department.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        dept.delete()
        return Response(status=204)
