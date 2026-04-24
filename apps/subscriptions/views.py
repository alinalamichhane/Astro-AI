from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Plan, UserSubscription, Payment
from .serializers import (PlanSerializer, UserSubscriptionSerializer,
                           PaymentSerializer, InitiatePaymentSerializer)
from .gateways import khalti, esewa, stripe_gateway


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------

class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


# ---------------------------------------------------------------------------
# Initiate Payment  (user picks gateway here)
# ---------------------------------------------------------------------------

class InitiatePaymentView(APIView):
    """
    POST /api/v1/subscriptions/initiate/
    Body: { plan_id, gateway: 'khalti'|'esewa'|'stripe' }

    Returns gateway-specific data the frontend needs to redirect/render.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan_id = serializer.validated_data['plan_id']
        gateway = serializer.validated_data['gateway']

        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Stripe is USD, everything else is NPR
        currency = 'USD' if gateway == 'stripe' else 'NPR'
        amount = float(plan.price_usd if currency == 'USD' else plan.price_npr)

        # Create a pending Payment record first
        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            amount=amount,
            currency=currency,
            gateway=gateway,
            status='pending',
            description=f"Subscription: {plan.name}",
        )

        user = request.user
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return_url = f"{base_url}/payment/callback/{gateway}/?txn={payment.transaction_uuid}"
        # eSewa success/failure URLs — eSewa appends ?data=<base64> to success_url
        success_url = f"{base_url}/payment/callback/esewa/"
        failure_url = f"{base_url}/payment/failed/?txn={payment.transaction_uuid}"

        try:
            if gateway == 'khalti':
                result = khalti.initiate_payment(
                    amount_npr=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    order_name=plan.name,
                    return_url=return_url,
                    customer_name=user.get_full_name() or user.username,
                    customer_email=user.email,
                    customer_phone=user.phone or '',
                )
                payment.gateway_transaction_id = result['pidx']
                payment.gateway_response = result['raw']
                payment.save()
                return Response({
                    'gateway': 'khalti',
                    'payment_url': result['payment_url'],
                    'pidx': result['pidx'],
                    'transaction_uuid': str(payment.transaction_uuid),
                    'expires_at': result.get('expires_at'),
                })

            elif gateway == 'esewa':
                result = esewa.get_payment_form_data(
                    amount_npr=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    success_url=success_url,
                    failure_url=failure_url,
                )
                payment.save()
                return Response({
                    'gateway': 'esewa',
                    'payment_url': result['payment_url'],
                    'form_fields': result['form_fields'],
                    'transaction_uuid': str(payment.transaction_uuid),
                })

            elif gateway == 'stripe':
                result = stripe_gateway.create_payment_intent(
                    amount_usd=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    user_email=user.email,
                    description=f"AstroAI - {plan.name}",
                )
                payment.gateway_transaction_id = result['payment_intent_id']
                payment.save()
                return Response({
                    'gateway': 'stripe',
                    'client_secret': result['client_secret'],
                    'publishable_key': result['publishable_key'],
                    'transaction_uuid': str(payment.transaction_uuid),
                })

        except Exception as e:
            payment.status = 'failed'
            payment.save()
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


# ---------------------------------------------------------------------------
# Khalti Callback  (Khalti redirects user here after payment)
# ---------------------------------------------------------------------------

class KhaltiCallbackView(APIView):
    """
    GET /api/v1/subscriptions/callback/khalti/
    Query params: pidx, status, transaction_id, tidx, amount, mobile, purchase_order_id
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        pidx = request.query_params.get('pidx')
        txn_uuid = request.query_params.get('purchase_order_id')

        if not pidx or not txn_uuid:
            return Response({'error': 'Missing pidx or purchase_order_id.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(transaction_uuid=txn_uuid, gateway='khalti')
        except Payment.DoesNotExist:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Server-side verification
        try:
            result = khalti.verify_payment(pidx)
        except Exception as e:
            payment.status = 'failed'
            payment.save()
            return Response({'error': f'Khalti verification failed: {e}'},
                            status=status.HTTP_502_BAD_GATEWAY)

        payment.gateway_response = result['raw']
        payment.gateway_transaction_id = result.get('transaction_id', pidx)

        if result['status'] == 'Completed':
            payment.status = 'completed'
            payment.save()
            _activate_subscription(payment)
            return Response({'message': 'Payment successful.', 'status': 'completed'})
        else:
            payment.status = 'failed'
            payment.save()
            return Response({'error': f"Payment not completed. Status: {result['status']}"},
                            status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# eSewa Callback  (eSewa redirects user to success_url with ?data=<base64>)
# ---------------------------------------------------------------------------

class EsewaCallbackView(APIView):
    """
    GET /api/v1/subscriptions/callback/esewa/
    Query params: data (base64-encoded JSON from eSewa)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        encoded_data = request.query_params.get('data')
        if not encoded_data:
            return Response({'error': 'Missing data parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response_data = esewa.decode_callback_response(encoded_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Verify signature
        if not esewa.verify_callback_signature(response_data):
            return Response({'error': 'Invalid signature. Possible tampering detected.'},
                            status=status.HTTP_400_BAD_REQUEST)

        txn_uuid = response_data.get('transaction_uuid')
        esewa_status = response_data.get('status')  # "COMPLETE"

        try:
            payment = Payment.objects.get(transaction_uuid=txn_uuid, gateway='esewa')
        except Payment.DoesNotExist:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment.gateway_response = response_data
        payment.gateway_transaction_id = response_data.get('transaction_code', '')

        if esewa_status == 'COMPLETE':
            payment.status = 'completed'
            payment.save()
            _activate_subscription(payment)
            return Response({'message': 'Payment successful.', 'status': 'completed'})
        else:
            payment.status = 'failed'
            payment.save()
            return Response({'error': f"eSewa payment not complete. Status: {esewa_status}"},
                            status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Stripe Callback  (frontend confirms after Stripe.js completes)
# ---------------------------------------------------------------------------

class StripeCallbackView(APIView):
    """
    POST /api/v1/subscriptions/callback/stripe/
    Body: { transaction_uuid, payment_intent_id }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        txn_uuid = request.data.get('transaction_uuid')
        payment_intent_id = request.data.get('payment_intent_id')

        if not txn_uuid or not payment_intent_id:
            return Response({'error': 'Missing transaction_uuid or payment_intent_id.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(
                transaction_uuid=txn_uuid, user=request.user, gateway='stripe'
            )
        except Payment.DoesNotExist:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = stripe_gateway.verify_payment_intent(payment_intent_id)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        payment.gateway_transaction_id = payment_intent_id
        payment.gateway_response = result

        if result['status'] == 'succeeded':
            payment.status = 'completed'
            payment.save()
            _activate_subscription(payment)
            return Response({'message': 'Payment successful.', 'status': 'completed'})
        else:
            payment.status = 'failed'
            payment.save()
            return Response({'error': f"Stripe payment not succeeded. Status: {result['status']}"},
                            status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def _activate_subscription(payment: Payment):
    """Activate or create subscription after successful payment."""
    if not payment.plan:
        return

    sub, _ = UserSubscription.objects.get_or_create(
        user=payment.user,
        plan=payment.plan,
        defaults={'status': 'pending'},
    )
    sub.payment = payment
    sub.status = 'active'
    sub.started_at = timezone.now()
    sub.expires_at = timezone.now() + timedelta(days=payment.plan.duration_days)
    sub.save()

    # Grant AI tokens
    user = payment.user
    user.ai_tokens += payment.plan.ai_tokens
    user.save()


# ---------------------------------------------------------------------------
# User views
# ---------------------------------------------------------------------------

class MySubscriptionView(generics.ListAPIView):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSubscription.objects.filter(
            user=self.request.user
        ).select_related('plan', 'payment').order_by('-created_at')


class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')
