from rest_framework import serializers
from .models import Astrologer, Consultation, AstrologerAvailability


class AstrologerAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = AstrologerAvailability
        fields = ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_active']


class AstrologerSerializer(serializers.ModelSerializer):
    availability = AstrologerAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Astrologer
        fields = [
            'id', 'display_name', 'bio', 'specializations', 'experience_years',
            'languages', 'profile_image', 'rate_per_min_npr', 'rate_per_min_usd',
            'is_available', 'is_verified', 'profile_complete',
            'total_consultations', 'rating', 'rating_count', 'availability',
        ]


class AstrologerProfileUpdateSerializer(serializers.ModelSerializer):
    """Used by astrologers to update their own profile."""
    class Meta:
        model = Astrologer
        fields = [
            'display_name', 'bio', 'specializations', 'experience_years',
            'languages', 'profile_image', 'rate_per_min_npr', 'rate_per_min_usd',
            'is_available',
        ]


class ConsultationSerializer(serializers.ModelSerializer):
    astrologer_name = serializers.CharField(source='astrologer.display_name', read_only=True)
    astrologer_image = serializers.ImageField(source='astrologer.profile_image', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Consultation
        fields = [
            'id', 'astrologer', 'astrologer_name', 'astrologer_image',
            'user_name', 'user_email',
            'consultation_type', 'status', 'scheduled_at', 'duration_minutes',
            'amount', 'currency', 'notes', 'cancellation_reason',
            'user_rating', 'user_review', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'amount', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class BookConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = ['astrologer', 'consultation_type', 'scheduled_at', 'duration_minutes',
                  'notes', 'currency']


class ReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class ConsultationStatusSerializer(serializers.Serializer):
    """Used by astrologers to update consultation status."""
    ALLOWED = ['confirmed', 'ongoing', 'completed', 'cancelled']
    status = serializers.ChoiceField(choices=ALLOWED)
    cancellation_reason = serializers.CharField(
        max_length=500, required=False, allow_blank=True,
        help_text='Required when cancelling/declining a consultation.'
    )

    def validate(self, attrs):
        if attrs['status'] == 'cancelled' and not attrs.get('cancellation_reason', '').strip():
            raise serializers.ValidationError(
                {'cancellation_reason': 'Please provide a reason for declining this consultation.'}
            )
        return attrs


class AstrologerDashboardSerializer(serializers.ModelSerializer):
    """Summary stats for the astrologer dashboard."""
    total_earnings_npr = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    upcoming = serializers.SerializerMethodField()

    class Meta:
        model = Astrologer
        fields = [
            'id', 'display_name', 'is_available', 'is_verified',
            'rating', 'rating_count', 'total_consultations',
            'total_earnings_npr', 'pending_count', 'completed_count', 'upcoming',
        ]

    def get_total_earnings_npr(self, obj):
        from django.db.models import Sum
        result = obj.consultations.filter(
            status='completed', currency='NPR'
        ).aggregate(total=Sum('amount'))['total']
        return float(result or 0)

    def get_pending_count(self, obj):
        return obj.consultations.filter(status='pending').count()

    def get_completed_count(self, obj):
        return obj.consultations.filter(status='completed').count()

    def get_upcoming(self, obj):
        from django.utils import timezone
        qs = obj.consultations.filter(
            status__in=['pending', 'confirmed'],
            scheduled_at__gte=timezone.now()
        ).order_by('scheduled_at')[:5]
        return ConsultationSerializer(qs, many=True).data
