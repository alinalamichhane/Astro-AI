from django.urls import path
from .views import (
    CategoryListView, ProductListView, ProductDetailView, ProductReviewView,
    CreateOrderView, MyOrdersView, OrderDetailView,
    OrderCancelView, OrderPaymentInitiateView, OrderPaymentCallbackView,
)

urlpatterns = [
    # Products
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('products/', ProductListView.as_view(), name='products'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/<slug:slug>/review/', ProductReviewView.as_view(), name='product_review'),

    # Orders
    path('orders/', CreateOrderView.as_view(), name='create_order'),
    path('orders/my/', MyOrdersView.as_view(), name='my_orders'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('orders/<int:pk>/cancel/', OrderCancelView.as_view(), name='cancel_order'),
    path('orders/<int:pk>/pay/', OrderPaymentInitiateView.as_view(), name='order_pay'),
    path('orders/payment/callback/<str:gateway>/', OrderPaymentCallbackView.as_view(), name='order_payment_callback'),
]
