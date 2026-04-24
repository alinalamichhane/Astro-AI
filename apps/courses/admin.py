from django.contrib import admin
from .models import Course, Lesson, Enrollment


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ['title', 'duration_minutes', 'order', 'is_preview']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'level', 'price_npr', 'price_usd', 'is_free',
                    'is_published', 'is_featured', 'enrollment_count', 'rating']
    list_filter = ['level', 'is_free', 'is_published', 'is_featured']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_published', 'is_featured']
    inlines = [LessonInline]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'progress_percent', 'is_completed', 'enrolled_at']
    list_filter = ['is_completed']
    search_fields = ['user__email', 'course__title']
