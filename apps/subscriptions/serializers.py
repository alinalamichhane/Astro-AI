from rest_framework import serializers
from .models import Plan, UserSubscription, Payment


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'name', 'plan_type', 'description', 'price_npr',
                  'price_usd', 'ai_tokens', 'duration_days', 'features']


class PaymentSerializer(serializers.ModelSerializer):
    gateway_display = serializers.CharField(source='get_gateway_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'transaction_uuid', 'amount', 'currency',
                  'gateway', 'gateway_display', 'status', 'status_display',
                  'description', 'created_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'payment', 'status', 'is_active',
                  'started_at', 'expires_at', 'created_at']

    def get_is_active(self, obj):
        from django.utils import timezone
        return obj.status == 'active' and (
            obj.expires_at is None or obj.expires_at > timezone.now()
        )


class InitiatePaymentSerializer(serializers.Serializer):
    GATEWAY_CHOICES = ['khalti', 'esewa', 'stripe']

    plan_id = serializers.IntegerField()
    gateway = serializers.ChoiceField(choices=GATEWAY_CHOICES)
