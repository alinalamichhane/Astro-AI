import logging
from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Course, Lesson, Enrollment
from .serializers import CourseSerializer, CourseDetailSerializer, EnrollmentSerializer

logger = logging.getLogger(__name__)


class CourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'language', 'is_free', 'is_featured']
    search_fields = ['title', 'description', 'topics']
    ordering_fields = ['price_npr', 'rating', 'enrollment_count', 'created_at']

    def get_queryset(self):
        return Course.objects.filter(is_published=True)

    def get_serializer_context(self):
        return {'request': self.request}


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_serializer_context(self):
        return {'request': self.request}


class EnrollCourseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            course = Course.objects.get(slug=slug, is_published=True)
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'You are already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            enrollment = Enrollment.objects.create(user=request.user, course=course)
            Course.objects.filter(pk=course.pk).update(
                enrollment_count=course.enrollment_count + 1
            )
            return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception('Enrollment failed for user %s course %s', request.user.id, slug)
            return Response(
                {'error': 'Enrollment failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).order_by('-enrolled_at')


class UpdateProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response(
                {'error': 'lesson_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            course = Course.objects.get(slug=slug, is_published=True)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            enrollment = Enrollment.objects.get(user=request.user, course=course)
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'You are not enrolled in this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            lesson = Lesson.objects.get(id=lesson_id, course=course)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

        completed = list(enrollment.completed_lessons)
        if lesson_id not in completed:
            completed.append(lesson_id)
            enrollment.completed_lessons = completed
            total = course.lessons.count()
            enrollment.progress_percent = int((len(completed) / total) * 100) if total else 0
            if enrollment.progress_percent >= 100:
                enrollment.is_completed = True
                enrollment.completed_at = timezone.now()
            enrollment.save()

        return Response({
            'progress': enrollment.progress_percent,
            'completed': enrollment.is_completed,
        })


class CourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'language', 'is_free', 'is_featured']
    search_fields = ['title', 'description', 'topics']
    ordering_fields = ['price_npr', 'rating', 'enrollment_count', 'created_at']

    def get_queryset(self):
        return Course.objects.filter(is_published=True)

    def get_serializer_context(self):
        return {'request': self.request}


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_serializer_context(self):
        return {'request': self.request}


class EnrollCourseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            course = Course.objects.get(slug=slug, is_published=True)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response({'error': 'Already enrolled.'}, status=status.HTTP_400_BAD_REQUEST)

        if not course.is_free:
            # Check if user has active subscription or paid
            # For now, just create enrollment (payment handled separately)
            pass

        enrollment = Enrollment.objects.create(user=request.user, course=course)
        course.enrollment_count += 1
        course.save()
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).order_by('-enrolled_at')


class UpdateProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        lesson_id = request.data.get('lesson_id')
        try:
            course = Course.objects.get(slug=slug)
            enrollment = Enrollment.objects.get(user=request.user, course=course)
            lesson = Lesson.objects.get(id=lesson_id, course=course)
        except (Course.DoesNotExist, Enrollment.DoesNotExist, Lesson.DoesNotExist):
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        completed = enrollment.completed_lessons
        if lesson_id not in completed:
            completed.append(lesson_id)
            enrollment.completed_lessons = completed
            total = course.lessons.count()
            enrollment.progress_percent = int((len(completed) / total) * 100) if total else 0
            if enrollment.progress_percent == 100:
                enrollment.is_completed = True
                enrollment.completed_at = timezone.now()
            enrollment.save()

        return Response({'progress': enrollment.progress_percent, 'completed': enrollment.is_completed})
