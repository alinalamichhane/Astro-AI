from django.urls import path
from .views import (
    PlanListView,
    InitiatePaymentView,
    KhaltiCallbackView,
    EsewaCallbackView,
    StripeCallbackView,
    MySubscriptionView,
    PaymentHistoryView,
)

urlpatterns = [
    # Plans
    path('plans/', PlanListView.as_view(), name='plan_list'),

    # Initiate payment (user picks gateway)
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),

    # Gateway callbacks
    path('callback/khalti/', KhaltiCallbackView.as_view(), name='khalti_callback'),
    path('callback/esewa/', EsewaCallbackView.as_view(), name='esewa_callback'),
    path('callback/stripe/', StripeCallbackView.as_view(), name='stripe_callback'),

    # User data
    path('my/', MySubscriptionView.as_view(), name='my_subscriptions'),
    path('payments/', PaymentHistoryView.as_view(), name='payment_history'),
]
