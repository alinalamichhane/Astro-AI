from django.db import models
from django.conf import settings


class Astrologer(models.Model):
    SPECIALIZATION_CHOICES = [
        ('vedic', 'Vedic Astrology'),
        ('numerology', 'Numerology'),
        ('tarot', 'Tarot Reading'),
        ('vastu', 'Vastu Shastra'),
        ('palmistry', 'Palmistry'),
        ('kundali', 'Kundali Matching'),
        ('career', 'Career Guidance'),
        ('relationship', 'Relationship & Marriage'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='astrologer_profile')
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    specializations = models.JSONField(default=list)
    experience_years = models.PositiveIntegerField(default=0)
    languages = models.JSONField(default=list)
    profile_image = models.ImageField(upload_to='astrologers/', blank=True, null=True)
    rate_per_min_npr = models.DecimalField(max_digits=8, decimal_places=2, default=50)
    rate_per_min_usd = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    is_available = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    profile_complete = models.BooleanField(default=False)  # True once astrologer fills in their details
    total_consultations = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'astrologers'

    def __str__(self):
        return self.display_name


class Consultation(models.Model):
    TYPE_CHOICES = [('chat', 'Chat'), ('video', 'Video Call'), ('phone', 'Phone Call')]
    STATUS_CHOICES = [
        ('pending', 'Pending'), ('confirmed', 'Confirmed'),
        ('ongoing', 'Ongoing'), ('completed', 'Completed'), ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='consultations')
    astrologer = models.ForeignKey(Astrologer, on_delete=models.CASCADE,
                                   related_name='consultations')
    consultation_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='chat')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='NPR')
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)  # filled by astrologer when declining
    user_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    user_review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'consultations'

    def __str__(self):
        return f"{self.user.email} with {self.astrologer.display_name}"


class AstrologerAvailability(models.Model):
    DAY_CHOICES = [(i, day) for i, day in enumerate(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )]

    astrologer = models.ForeignKey(Astrologer, on_delete=models.CASCADE,
                                   related_name='availability')
    day_of_week = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'astrologer_availability'
        unique_together = ['astrologer', 'day_of_week']
