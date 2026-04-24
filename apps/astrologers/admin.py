from django.contrib import admin
from .models import Astrologer, Consultation, AstrologerAvailability


@admin.register(Astrologer)
class AstrologerAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'user_email', 'experience_years', 'rating',
                    'profile_complete', 'is_available', 'is_verified']
    list_filter = ['is_verified', 'is_available', 'profile_complete']
    search_fields = ['display_name', 'user__email']
    list_editable = ['is_available', 'is_verified']
    readonly_fields = ['created_at', 'total_consultations', 'rating', 'rating_count']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ['user', 'astrologer', 'consultation_type', 'status', 'scheduled_at', 'amount']
    list_filter = ['status', 'consultation_type']
    search_fields = ['user__email', 'astrologer__display_name']
    date_hierarchy = 'scheduled_at'


admin.site.register(AstrologerAvailability)
