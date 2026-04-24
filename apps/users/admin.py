from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_verified', 'ai_tokens', 'is_staff']
    list_filter = ['is_verified', 'is_staff', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('AstroAI Profile', {
            'fields': ('phone', 'avatar', 'gender', 'date_of_birth', 'time_of_birth',
                       'place_of_birth', 'latitude', 'longitude', 'timezone',
                       'bio', 'is_verified', 'ai_tokens')
        }),
    )
