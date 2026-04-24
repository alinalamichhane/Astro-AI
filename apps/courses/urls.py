from django.urls import path
from .views import (CourseListView, CourseDetailView, EnrollCourseView,
                    MyEnrollmentsView, UpdateProgressView)

urlpatterns = [
    path('', CourseListView.as_view(), name='course_list'),
    path('<slug:slug>/', CourseDetailView.as_view(), name='course_detail'),
    path('<slug:slug>/enroll/', EnrollCourseView.as_view(), name='enroll_course'),
    path('<slug:slug>/progress/', UpdateProgressView.as_view(), name='update_progress'),
    path('my/enrollments/', MyEnrollmentsView.as_view(), name='my_enrollments'),
]
