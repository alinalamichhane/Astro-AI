from django.contrib import admin
from .models import BirthChart, Horoscope, KundaliMatch, PlanetaryTransit


@admin.register(Horoscope)
class HoroscopeAdmin(admin.ModelAdmin):
    list_display = ['zodiac_sign', 'period', 'date', 'is_ai_generated']
    list_filter = ['period', 'zodiac_sign', 'is_ai_generated']
    search_fields = ['zodiac_sign', 'content']
    date_hierarchy = 'date'


@admin.register(BirthChart)
class BirthChartAdmin(admin.ModelAdmin):
    list_display = ['user', 'sun_sign', 'moon_sign', 'ascendant', 'generated_at']
    search_fields = ['user__email']


@admin.register(KundaliMatch)
class KundaliMatchAdmin(admin.ModelAdmin):
    list_display = ['user', 'partner_name', 'match_score', 'created_at']


@admin.register(PlanetaryTransit)
class PlanetaryTransitAdmin(admin.ModelAdmin):
    list_display = ['planet', 'from_sign', 'to_sign', 'transit_date']
    date_hierarchy = 'transit_date'
