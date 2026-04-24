import logging
from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from .models import Astrologer, Consultation, AstrologerAvailability
from .permissions import IsAstrologer
from .serializers import (
    AstrologerSerializer, AstrologerProfileUpdateSerializer,
    AstrologerDashboardSerializer, ConsultationSerializer,
    BookConsultationSerializer, ReviewSerializer,
    ConsultationStatusSerializer, AstrologerAvailabilitySerializer,
)

from apps.core.permissions import IsRegularUser
from .emails import notify_astrologer_new_booking, notify_user_status_change

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Public / User-facing views
# ─────────────────────────────────────────────────────────────────────────────

class AstrologerListView(generics.ListAPIView):
    serializer_class = AstrologerSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_available', 'is_verified']
    search_fields = ['display_name', 'specializations', 'languages']
    ordering_fields = ['rating', 'experience_years', 'rate_per_min_npr']

    def get_queryset(self):
        return Astrologer.objects.filter(is_verified=True).order_by('-rating')


class AstrologerDetailView(generics.RetrieveAPIView):
    queryset = Astrologer.objects.filter(is_verified=True)
    serializer_class = AstrologerSerializer
    permission_classes = [permissions.AllowAny]


class BookConsultationView(APIView):
    permission_classes = [IsRegularUser]  # astrologers cannot book consultations

    def post(self, request):
        serializer = BookConsultationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        astrologer = serializer.validated_data['astrologer']
        duration = serializer.validated_data['duration_minutes']
        currency = serializer.validated_data.get('currency', 'NPR')

        if not astrologer.is_verified:
            return Response(
                {'error': 'This astrologer is not currently accepting bookings.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rate = astrologer.rate_per_min_usd if currency == 'USD' else astrologer.rate_per_min_npr
        amount = rate * duration

        try:
            consultation = serializer.save(
                user=request.user, amount=amount, currency=currency, status='pending',
            )
            # Notify astrologer about the new booking
            notify_astrologer_new_booking(consultation)
            return Response(ConsultationSerializer(consultation).data, status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception('Consultation booking failed for user %s', request.user.id)
            return Response({'error': 'Booking failed. Please try again.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyConsultationsView(generics.ListAPIView):
    """User's own consultation history."""
    serializer_class = ConsultationSerializer
    permission_classes = [IsRegularUser]

    def get_queryset(self):
        return Consultation.objects.filter(user=self.request.user).order_by('-created_at')


class ConsultationDetailView(generics.RetrieveAPIView):
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Consultation.objects.filter(user=self.request.user)


class ReviewConsultationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            consultation = Consultation.objects.get(id=pk, user=request.user, status='completed')
        except Consultation.DoesNotExist:
            return Response({'error': 'Consultation not found or not yet completed.'},
                            status=status.HTTP_404_NOT_FOUND)

        if consultation.user_rating is not None:
            return Response({'error': 'You have already reviewed this consultation.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consultation.user_rating = serializer.validated_data['rating']
        consultation.user_review = serializer.validated_data.get('review', '')
        consultation.save()

        try:
            astrologer = consultation.astrologer
            agg = Consultation.objects.filter(
                astrologer=astrologer, user_rating__isnull=False
            ).aggregate(avg=Avg('user_rating'), count=Count('id'))
            astrologer.rating = round(agg['avg'] or 0, 2)
            astrologer.rating_count = agg['count']
            astrologer.save(update_fields=['rating', 'rating_count'])
        except Exception:
            logger.exception('Failed to update astrologer rating for consultation %s', pk)

        return Response({'message': 'Review submitted successfully.'})


# ─────────────────────────────────────────────────────────────────────────────
# Astrologer registration
# ─────────────────────────────────────────────────────────────────────────────

class AstrologerRegisterView(APIView):
    """
    POST /api/v1/astrologers/register/
    Updates the draft astrologer record created at signup with full profile details.
    Sets profile_complete=True so the astrologer can access their dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'astrologer':
            return Response(
                {'error': 'Only users with astrologer role can set up an astrologer profile.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AstrologerProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update the draft record that was auto-created at registration
        astrologer, created = Astrologer.objects.get_or_create(
            user=user,
            defaults={'display_name': user.get_full_name() or user.username},
        )

        for field, value in serializer.validated_data.items():
            setattr(astrologer, field, value)
        astrologer.profile_complete = True
        astrologer.save()

        return Response(
            AstrologerSerializer(astrologer).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Astrologer dashboard views  (IsAstrologer permission required)
# ─────────────────────────────────────────────────────────────────────────────

class AstrologerDashboardView(APIView):
    """GET /api/v1/astrologers/dashboard/ — stats summary."""
    permission_classes = [IsAstrologer]

    def get(self, request):
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Astrologer profile not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(AstrologerDashboardSerializer(astrologer).data)


class AstrologerProfileView(APIView):
    """GET/PATCH /api/v1/astrologers/profile/ — own profile."""
    permission_classes = [IsAstrologer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AstrologerSerializer(astrologer).data)

    def patch(self, request):
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AstrologerProfileUpdateSerializer(
            astrologer, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Mark profile as complete once they've saved real data
        if not astrologer.profile_complete and astrologer.display_name and astrologer.bio:
            astrologer.profile_complete = True
            astrologer.save(update_fields=['profile_complete'])

        return Response(AstrologerSerializer(astrologer).data)


class AstrologerToggleAvailabilityView(APIView):
    """POST /api/v1/astrologers/toggle-availability/ — go online/offline."""
    permission_classes = [IsAstrologer]

    def post(self, request):
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        astrologer.is_available = not astrologer.is_available
        astrologer.save(update_fields=['is_available'])
        return Response({'is_available': astrologer.is_available})


class AstrologerConsultationsView(generics.ListAPIView):
    """GET /api/v1/astrologers/my-consultations/ — astrologer's bookings."""
    serializer_class = ConsultationSerializer
    permission_classes = [IsAstrologer]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['scheduled_at', 'created_at']

    def get_queryset(self):
        try:
            return self.request.user.astrologer_profile.consultations.all().order_by('-scheduled_at')
        except Astrologer.DoesNotExist:
            return Consultation.objects.none()


class AstrologerUpdateConsultationView(APIView):
    """PATCH /api/v1/astrologers/my-consultations/<pk>/status/ — confirm/complete/cancel."""
    permission_classes = [IsAstrologer]

    def patch(self, request, pk):
        try:
            astrologer = request.user.astrologer_profile
            consultation = Consultation.objects.get(id=pk, astrologer=astrologer)
        except (Astrologer.DoesNotExist, Consultation.DoesNotExist):
            return Response({'error': 'Consultation not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ConsultationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']

        # Simple state machine
        allowed_transitions = {
            'pending':   ['confirmed', 'cancelled'],
            'confirmed': ['ongoing', 'cancelled'],
            'ongoing':   ['completed'],
        }
        if consultation.status not in allowed_transitions or \
                new_status not in allowed_transitions.get(consultation.status, []):
            return Response(
                {'error': f'Cannot move from "{consultation.status}" to "{new_status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        consultation.status = new_status
        if new_status == 'cancelled':
            consultation.cancellation_reason = serializer.validated_data.get('cancellation_reason', '')
        consultation.save(update_fields=['status', 'cancellation_reason'])

        # Notify user about the status change
        notify_user_status_change(consultation)

        # Increment total_consultations on completion
        if new_status == 'completed':
            Astrologer.objects.filter(pk=astrologer.pk).update(
                total_consultations=astrologer.total_consultations + 1
            )

        return Response(ConsultationSerializer(consultation).data)


class ConsultationClientView(APIView):
    """
    GET /api/v1/astrologers/my-consultations/<pk>/client/
    Returns the client's profile + birth chart for active consultations.
    Only accessible by the astrologer assigned to that consultation.
    Only available for pending/confirmed/ongoing consultations.
    """
    permission_classes = [IsAstrologer]

    def get(self, request, pk):
        try:
            astrologer = request.user.astrologer_profile
            consultation = Consultation.objects.get(id=pk, astrologer=astrologer)
        except (Astrologer.DoesNotExist, Consultation.DoesNotExist):
            return Response({'error': 'Consultation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if consultation.status not in ('pending', 'confirmed', 'ongoing'):
            return Response(
                {'error': 'Client details are only available for active consultations.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = consultation.user
        data = {
            'id': user.id,
            'name': user.get_full_name() or user.username,
            'email': user.email,
            'phone': user.phone,
            'gender': user.get_gender_display() if user.gender else None,
            'date_of_birth': user.date_of_birth,
            'time_of_birth': user.time_of_birth,
            'place_of_birth': user.place_of_birth,
            'timezone': user.timezone,
            'bio': user.bio,
            'birth_chart': None,
        }

        try:
            chart = user.birth_chart
            data['birth_chart'] = {
                'sun_sign': chart.sun_sign,
                'moon_sign': chart.moon_sign,
                'ascendant': chart.ascendant,
                'nakshatra': chart.nakshatra,
                'chart_data': chart.chart_data,
            }
        except Exception:
            pass  # No birth chart — that's fine

        return Response(data)


class AstrologerAvailabilityView(APIView):
    """GET/POST /api/v1/astrologers/availability/ — manage weekly schedule."""
    permission_classes = [IsAstrologer]

    def get(self, request):
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        slots = astrologer.availability.all().order_by('day_of_week')
        return Response(AstrologerAvailabilitySerializer(slots, many=True).data)

    def post(self, request):
        """Bulk-save availability slots (replaces existing)."""
        try:
            astrologer = request.user.astrologer_profile
        except Astrologer.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slots_data = request.data.get('slots', [])
        if not isinstance(slots_data, list):
            return Response({'error': 'slots must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for slot in slots_data:
            serializer = AstrologerAvailabilitySerializer(data=slot)
            serializer.is_valid(raise_exception=True)
            obj, _ = AstrologerAvailability.objects.update_or_create(
                astrologer=astrologer,
                day_of_week=serializer.validated_data['day_of_week'],
                defaults={
                    'start_time': serializer.validated_data['start_time'],
                    'end_time': serializer.validated_data['end_time'],
                    'is_active': serializer.validated_data.get('is_active', True),
                },
            )
            created.append(obj)

        return Response(AstrologerAvailabilitySerializer(created, many=True).data)
