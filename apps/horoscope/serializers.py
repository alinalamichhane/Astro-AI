from rest_framework import serializers
from .models import BirthChart, Horoscope, KundaliMatch, PlanetaryTransit


class BirthChartSerializer(serializers.ModelSerializer):
    class Meta:
        model = BirthChart
        fields = ['id', 'chart_data', 'ascendant', 'moon_sign', 'sun_sign',
                  'nakshatra', 'generated_at']
        read_only_fields = ['id', 'chart_data', 'ascendant', 'moon_sign',
                            'sun_sign', 'nakshatra', 'generated_at']


class HoroscopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horoscope
        fields = ['id', 'zodiac_sign', 'period', 'date', 'content',
                  'love', 'career', 'health', 'finance',
                  'lucky_number', 'lucky_color', 'compatibility', 'rating']


class KundaliMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = KundaliMatch
        fields = ['id', 'partner_name', 'partner_dob', 'partner_tob',
                  'partner_pob', 'match_score', 'match_details', 'ai_analysis', 'created_at']
        read_only_fields = ['id', 'match_score', 'match_details', 'ai_analysis', 'created_at']


class PlanetaryTransitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanetaryTransit
        fields = ['id', 'planet', 'from_sign', 'to_sign', 'transit_date',
                  'description', 'impact']
