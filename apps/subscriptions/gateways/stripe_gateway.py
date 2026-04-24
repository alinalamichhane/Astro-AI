"""
Stripe Payment Gateway (for international/USD payments)
Used when user selects USD currency or is outside Nepal.
"""
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_payment_intent(amount_usd: float, transaction_uuid: str,
                           user_email: str, description: str) -> dict:
    """
    Create a Stripe PaymentIntent.
    Returns: {'client_secret': ..., 'payment_intent_id': ...}
    """
    intent = stripe.PaymentIntent.create(
        amount=int(amount_usd * 100),   # Stripe uses cents
        currency='usd',
        receipt_email=user_email,
        description=description,
        metadata={'transaction_uuid': str(transaction_uuid)},
    )
    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
    }


def verify_payment_intent(payment_intent_id: str) -> dict:
    """
    Verify a Stripe PaymentIntent status.
    Returns: {'status': 'succeeded'|'pending'|..., 'amount_usd': ...}
    """
    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    return {
        "status": intent.status,
        "amount_usd": intent.amount / 100,
        "payment_intent_id": intent.id,
    }
