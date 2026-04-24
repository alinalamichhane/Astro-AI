from django.urls import path
from .views import (
    # Public / user-facing
    AstrologerListView, AstrologerDetailView,
    BookConsultationView, MyConsultationsView,
    ConsultationDetailView, ReviewConsultationView,
    # Astrologer registration
    AstrologerRegisterView,
    # Astrologer dashboard
    AstrologerDashboardView, AstrologerProfileView,
    AstrologerToggleAvailabilityView, AstrologerConsultationsView,
    AstrologerUpdateConsultationView, AstrologerAvailabilityView,
    ConsultationClientView,
)

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────────────
    path('', AstrologerListView.as_view(), name='astrologer_list'),
    path('<int:pk>/', AstrologerDetailView.as_view(), name='astrologer_detail'),

    # ── User booking ─────────────────────────────────────────────────────────
    path('book/', BookConsultationView.as_view(), name='book_consultation'),
    path('consultations/', MyConsultationsView.as_view(), name='my_consultations'),
    path('consultations/<int:pk>/', ConsultationDetailView.as_view(), name='consultation_detail'),
    path('consultations/<int:pk>/review/', ReviewConsultationView.as_view(), name='review_consultation'),

    # ── Astrologer registration ───────────────────────────────────────────────
    path('register/', AstrologerRegisterView.as_view(), name='astrologer_register'),

    # ── Astrologer dashboard ─────────────────────────────────────────────────
    path('dashboard/', AstrologerDashboardView.as_view(), name='astrologer_dashboard'),
    path('profile/', AstrologerProfileView.as_view(), name='astrologer_profile'),
    path('toggle-availability/', AstrologerToggleAvailabilityView.as_view(), name='toggle_availability'),
    path('my-consultations/', AstrologerConsultationsView.as_view(), name='astrologer_consultations'),
    path('my-consultations/<int:pk>/status/', AstrologerUpdateConsultationView.as_view(), name='update_consultation_status'),
    path('my-consultations/<int:pk>/client/', ConsultationClientView.as_view(), name='consultation_client'),
    path('availability/', AstrologerAvailabilityView.as_view(), name='astrologer_availability'),
]
