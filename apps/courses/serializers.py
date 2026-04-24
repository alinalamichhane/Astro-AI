from rest_framework import serializers
from .models import Course, Lesson, Enrollment


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'video_url', 'content',
                  'duration_minutes', 'order', 'is_preview']


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'instructor_name', 'description', 'short_description',
            'thumbnail', 'price_npr', 'price_usd', 'level', 'language', 'duration_hours',
            'topics', 'is_free', 'is_featured', 'rating', 'enrollment_count',
            'lesson_count', 'is_enrolled',
        ]

    def get_instructor_name(self, obj):
        if obj.instructor:
            return obj.instructor.get_full_name() or obj.instructor.username
        return 'AstroAI Team'

    def get_lesson_count(self, obj):
        return obj.lessons.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False


class CourseDetailSerializer(CourseSerializer):
    lessons = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['lessons']

    def get_lessons(self, obj):
        request = self.context.get('request')
        is_enrolled = (request and request.user.is_authenticated and
                       Enrollment.objects.filter(user=request.user, course=obj).exists())
        lessons = obj.lessons.all()
        if not is_enrolled:
            lessons = lessons.filter(is_preview=True)
        return LessonSerializer(lessons, many=True).data


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'completed_lessons', 'progress_percent',
                  'is_completed', 'certificate_issued', 'enrolled_at']
