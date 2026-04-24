from rest_framework import serializers
from .models import Category, Product, ProductImage, Order, OrderItem


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'order']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    uploaded_images = ProductImageSerializer(source='product_images', many=True, read_only=True)
    all_images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'description',
            'short_description', 'price_npr', 'price_usd', 'stock', 'images',
            'uploaded_images', 'all_images',
            'zodiac_benefits', 'planet_association', 'healing_properties',
            'is_featured', 'rating', 'rating_count',
        ]

    def get_all_images(self, obj):
        """Merged list: uploaded files first, then URL-based images."""
        request = self.context.get('request')
        uploaded = []
        for img in obj.product_images.all().order_by('order'):
            if img.image:
                url = request.build_absolute_uri(img.image.url) if request else img.image.url
                uploaded.append(url)
        return uploaded + (obj.images or [])


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'currency', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_amount', 'currency', 'shipping_address',
                  'notes', 'items', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class ProductReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(max_length=500, required=False, allow_blank=True)


class CreateOrderSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField()  # [{product_id, quantity}]
    )
    shipping_address = serializers.DictField()
    currency = serializers.ChoiceField(choices=['NPR', 'USD'], default='NPR')
    notes = serializers.CharField(required=False, allow_blank=True)
