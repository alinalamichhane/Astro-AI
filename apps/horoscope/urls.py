from django.urls import path
from .views import (BirthChartView, HoroscopeView, PersonalizedHoroscopeView,
                    KundaliMatchView, KundaliMatchDetailView, KundaliMatchRecalculateView,
                    PlanetaryTransitListView)

urlpatterns = [
    path('birth-chart/', BirthChartView.as_view(), name='birth_chart'),
    path('horoscope/', HoroscopeView.as_view(), name='horoscope'),
    path('horoscope/personalized/', PersonalizedHoroscopeView.as_view(), name='personalized_horoscope'),
    path('kundali-match/', KundaliMatchView.as_view(), name='kundali_match'),
    path('kundali-match/recalculate/', KundaliMatchRecalculateView.as_view(), name='kundali_match_recalculate'),
    path('kundali-match/<int:pk>/', KundaliMatchDetailView.as_view(), name='kundali_match_detail'),
    path('transits/', PlanetaryTransitListView.as_view(), name='planetary_transits'),
]
