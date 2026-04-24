import logging
from decimal import Decimal
from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Avg, Count
from .models import Category, Product, Order, OrderItem
from .serializers import (CategorySerializer, ProductSerializer,
                           OrderSerializer, CreateOrderSerializer,
                           ProductReviewSerializer)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Public views
# ─────────────────────────────────────────────────────────────────────────────

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured', 'planet_association']
    search_fields = ['name', 'description', 'healing_properties']
    ordering_fields = ['price_npr', 'price_usd', 'rating', 'created_at']

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True)
        zodiac = self.request.query_params.get('zodiac')
        if zodiac:
            qs = qs.filter(zodiac_benefits__contains=zodiac)
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


# ─────────────────────────────────────────────────────────────────────────────
# Product reviews
# ─────────────────────────────────────────────────────────────────────────────

class ProductReviewView(APIView):
    """POST /marketplace/products/<slug>/review/ — submit a rating + review."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only allow review if user has purchased this product
        purchased = OrderItem.objects.filter(
            order__user=request.user,
            order__status__in=['delivered', 'confirmed'],
            product=product,
        ).exists()
        if not purchased:
            return Response(
                {'error': 'You can only review products you have purchased.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProductReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Recalculate product rating
        # (In production you'd store individual reviews in a Review model)
        new_rating = serializer.validated_data['rating']
        total = (product.rating * product.rating_count) + new_rating
        product.rating_count += 1
        product.rating = round(total / product.rating_count, 2)
        product.save(update_fields=['rating', 'rating_count'])

        return Response({'message': 'Review submitted. Thank you!', 'new_rating': product.rating})


# ─────────────────────────────────────────────────────────────────────────────
# Orders
# ─────────────────────────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        currency = serializer.validated_data['currency']
        items_data = serializer.validated_data['items']

        if not items_data:
            return Response({'error': 'Order must contain at least one item.'},
                            status=status.HTTP_400_BAD_REQUEST)

        total = Decimal('0')
        order_items = []

        for item_data in items_data:
            product_id = item_data.get('product_id')
            if not product_id:
                return Response({'error': 'Each item must include a product_id.'},
                                status=status.HTTP_400_BAD_REQUEST)
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                return Response({'error': f'Product {product_id} not found.'},
                                status=status.HTTP_404_NOT_FOUND)

            try:
                qty = int(item_data.get('quantity', 1))
                if qty < 1:
                    raise ValueError
            except (ValueError, TypeError):
                return Response({'error': f'Invalid quantity for "{product.name}".'},
                                status=status.HTTP_400_BAD_REQUEST)

            if product.stock < qty:
                return Response(
                    {'error': f'"{product.name}" only has {product.stock} unit(s) in stock.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            price = product.price_usd if currency == 'USD' else product.price_npr
            total += Decimal(str(price)) * qty
            order_items.append({'product': product, 'quantity': qty, 'unit_price': price})

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    total_amount=total,
                    currency=currency,
                    shipping_address=serializer.validated_data['shipping_address'],
                    notes=serializer.validated_data.get('notes', ''),
                )
                for item in order_items:
                    OrderItem.objects.create(order=order, currency=currency, **item)
                    item['product'].stock -= item['quantity']
                    item['product'].save(update_fields=['stock'])
        except Exception:
            logger.exception('Order creation failed for user %s', request.user.id)
            return Response({'error': 'Failed to create order. Please try again.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderCancelView(APIView):
    """POST /marketplace/orders/<pk>/cancel/ — cancel a pending order and restore stock."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(id=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status not in ('pending', 'confirmed'):
            return Response(
                {'error': f'Cannot cancel an order with status "{order.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Restore stock
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])
            order.status = 'cancelled'
            order.save(update_fields=['status'])

        return Response({'message': 'Order cancelled and stock restored.'})


class OrderPaymentInitiateView(APIView):
    """
    POST /marketplace/orders/<pk>/pay/
    Initiate payment for a marketplace order using Khalti, eSewa, or Stripe.
    Reuses the same gateway infrastructure as subscriptions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(id=pk, user=request.user, status='pending')
        except Order.DoesNotExist:
            return Response({'error': 'Order not found or already paid.'},
                            status=status.HTTP_404_NOT_FOUND)

        gateway = request.data.get('gateway', 'khalti')
        if gateway not in ('khalti', 'esewa', 'stripe'):
            return Response({'error': 'Invalid gateway.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.subscriptions.models import Payment
        from django.conf import settings
        import uuid

        currency = 'USD' if gateway == 'stripe' else 'NPR'
        amount = float(order.total_amount)

        payment = Payment.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            gateway=gateway,
            status='pending',
            description=f'Order #{order.id}',
        )

        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return_url = f"{base_url}/marketplace/payment/callback/{gateway}/?order={order.id}&txn={payment.transaction_uuid}"
        success_url = f"{base_url}/marketplace/payment/callback/esewa/?order={order.id}"
        failure_url = f"{base_url}/marketplace/payment/failed/?order={order.id}"

        try:
            if gateway == 'khalti':
                from apps.subscriptions.gateways import khalti
                result = khalti.initiate_payment(
                    amount_npr=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    order_name=f'AstroAI Order #{order.id}',
                    return_url=return_url,
                    customer_name=request.user.get_full_name() or request.user.username,
                    customer_email=request.user.email,
                    customer_phone=request.user.phone or '',
                )
                payment.gateway_transaction_id = result['pidx']
                payment.gateway_response = result['raw']
                payment.save()
                # Link payment to order
                order.stripe_payment_intent_id = str(payment.transaction_uuid)
                order.save(update_fields=['stripe_payment_intent_id'])
                return Response({'gateway': 'khalti', 'payment_url': result['payment_url'],
                                 'transaction_uuid': str(payment.transaction_uuid)})

            elif gateway == 'esewa':
                from apps.subscriptions.gateways import esewa
                result = esewa.get_payment_form_data(
                    amount_npr=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    success_url=success_url,
                    failure_url=failure_url,
                )
                order.stripe_payment_intent_id = str(payment.transaction_uuid)
                order.save(update_fields=['stripe_payment_intent_id'])
                return Response({'gateway': 'esewa', 'payment_url': result['payment_url'],
                                 'form_fields': result['form_fields'],
                                 'transaction_uuid': str(payment.transaction_uuid)})

            elif gateway == 'stripe':
                from apps.subscriptions.gateways import stripe_gateway
                result = stripe_gateway.create_payment_intent(
                    amount_usd=amount,
                    transaction_uuid=str(payment.transaction_uuid),
                    user_email=request.user.email,
                    description=f'AstroAI Order #{order.id}',
                )
                payment.gateway_transaction_id = result['payment_intent_id']
                payment.save()
                order.stripe_payment_intent_id = str(payment.transaction_uuid)
                order.save(update_fields=['stripe_payment_intent_id'])
                return Response({'gateway': 'stripe', 'client_secret': result['client_secret'],
                                 'publishable_key': result['publishable_key'],
                                 'transaction_uuid': str(payment.transaction_uuid)})

        except Exception as e:
            payment.status = 'failed'
            payment.save()
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class OrderPaymentCallbackView(APIView):
    """
    GET /marketplace/orders/payment/callback/<gateway>/
    Verify payment and confirm the order.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, gateway):
        from apps.subscriptions.models import Payment

        txn_uuid = request.query_params.get('txn')
        order_id = request.query_params.get('order')

        if not txn_uuid or not order_id:
            return Response({'error': 'Missing parameters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(transaction_uuid=txn_uuid, gateway=gateway)
            order = Order.objects.get(id=order_id)
        except (Payment.DoesNotExist, Order.DoesNotExist):
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            if gateway == 'khalti':
                from apps.subscriptions.gateways import khalti
                pidx = request.query_params.get('pidx')
                result = khalti.verify_payment(pidx)
                if result['status'] == 'Completed':
                    payment.status = 'completed'
                    payment.gateway_response = result['raw']
                    payment.save()
                    order.status = 'confirmed'
                    order.save(update_fields=['status'])
                    return Response({'message': 'Payment successful.', 'status': 'completed'})
                else:
                    payment.status = 'failed'
                    payment.save()
                    return Response({'error': f'Payment not completed: {result["status"]}'},
                                    status=status.HTTP_400_BAD_REQUEST)

            elif gateway == 'esewa':
                from apps.subscriptions.gateways import esewa
                encoded = request.query_params.get('data')
                response_data = esewa.decode_callback_response(encoded)
                if not esewa.verify_callback_signature(response_data):
                    return Response({'error': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)
                if response_data.get('status') == 'COMPLETE':
                    payment.status = 'completed'
                    payment.gateway_response = response_data
                    payment.save()
                    order.status = 'confirmed'
                    order.save(update_fields=['status'])
                    return Response({'message': 'Payment successful.', 'status': 'completed'})
                else:
                    payment.status = 'failed'
                    payment.save()
                    return Response({'error': 'eSewa payment not complete.'},
                                    status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception('Order payment callback failed: %s', e)
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)
