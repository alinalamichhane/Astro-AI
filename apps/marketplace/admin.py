from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductImage, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3          # show 3 empty upload slots by default
    fields = ['image', 'image_preview', 'alt_text', 'order']
    readonly_fields = ['image_preview']

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:60px;width:60px;object-fit:cover;border-radius:6px;" />',
                obj.image.url
            )
        return '—'
    image_preview.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['thumbnail', 'name', 'category', 'price_npr', 'price_usd',
                    'stock', 'is_active', 'is_featured', 'rating']
    list_filter = ['category', 'is_active', 'is_featured', 'planet_association']
    search_fields = ['name', 'description', 'healing_properties']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'is_featured', 'stock', 'price_npr', 'price_usd']
    readonly_fields = ['rating', 'rating_count', 'created_at']
    inlines = [ProductImageInline]

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'category', 'short_description', 'description')
        }),
        ('Pricing & Stock', {
            'fields': ('price_npr', 'price_usd', 'stock')
        }),
        ('Astrology', {
            'fields': ('planet_association', 'zodiac_benefits', 'healing_properties')
        }),
        ('Settings', {
            'fields': ('is_active', 'is_featured', 'images')
        }),
        ('Stats (read-only)', {
            'fields': ('rating', 'rating_count', 'created_at'),
            'classes': ('collapse',),
        }),
    )

    def thumbnail(self, obj):
        imgs = list(obj.product_images.all()[:1])
        if imgs and imgs[0].image:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:4px;" />',
                imgs[0].image.url
            )
        if obj.images:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:4px;" />',
                obj.images[0]
            )
        return '💎'
    thumbnail.short_description = ''


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'unit_price', 'currency']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_amount', 'currency', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['user__email']
    list_editable = ['status']
    inlines = [OrderItemInline]
    readonly_fields = ['created_at', 'updated_at']
