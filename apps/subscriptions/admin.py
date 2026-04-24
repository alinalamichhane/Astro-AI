from django.contrib import admin
from .models import Plan, UserSubscription, Payment


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price_npr', 'price_usd', 'ai_tokens',
                    'duration_days', 'is_active']
    list_editable = ['is_active']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'amount', 'currency', 'gateway',
                    'status', 'gateway_transaction_id', 'created_at']
    list_filter = ['status', 'gateway', 'currency']
    search_fields = ['user__email', 'gateway_transaction_id', 'transaction_uuid']
    readonly_fields = ['transaction_uuid', 'gateway_response', 'created_at', 'updated_at']


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'started_at', 'expires_at']
    list_filter = ['status']
    search_fields = ['user__email', 'plan__name']
    readonly_fields = ['created_at']
