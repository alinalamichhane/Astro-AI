import logging
from datetime import date, time as dt_time
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import BirthChart, Horoscope, KundaliMatch, PlanetaryTransit
from .serializers import (BirthChartSerializer, HoroscopeSerializer,
                           KundaliMatchSerializer, PlanetaryTransitSerializer)
from .services import AstrologyService

logger = logging.getLogger(__name__)

VALID_PERIODS = ('daily', 'weekly', 'monthly')
VALID_SIGNS = {
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
}


def _recalculate_all_kundali_matches(user):
    """
    Recalculate all existing Kundali matches for a user after their birth chart changes.
    Called whenever the user regenerates their birth chart.
    """
    from .ashtakoot import calculate_ashtakoot

    if not hasattr(user, 'birth_chart'):
        return

    user_chart = user.birth_chart.chart_data
    matches = KundaliMatch.objects.filter(user=user)
    updated = 0

    for match in matches:
        try:
            partner_tob = match.partner_tob or dt_time(6, 0)
            partner_chart = AstrologyService.calculate_birth_chart(
                match.partner_dob, partner_tob, 27.7, 85.3
            )
            ashtakoot = calculate_ashtakoot(user_chart, partner_chart)
            match.match_score = ashtakoot['total']
            match.match_details = {
                'partner_chart': partner_chart,
                'ashtakoot': ashtakoot,
            }
            match.ai_analysis = (
                f"Total Score: {ashtakoot['total']}/36 ({ashtakoot['percentage']}%) — "
                f"{ashtakoot['verdict']}. "
                f"Your Nakshatra: {ashtakoot['user_nakshatra']}. "
                f"Partner's Nakshatra: {ashtakoot['partner_nakshatra']}."
            )
            match.save()
            updated += 1
        except Exception as e:
            logger.warning('Failed to recalculate match %s for user %s: %s', match.id, user.id, e)

    if updated:
        logger.info('Recalculated %d Kundali matches for user %s', updated, user.id)


class BirthChartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            chart = request.user.birth_chart
            return Response(BirthChartSerializer(chart).data)
        except BirthChart.DoesNotExist:
            return Response(
                {'error': 'Birth chart not generated yet. Please complete your profile first.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def post(self, request):
        user = request.user
        missing = [f for f in ['date_of_birth', 'time_of_birth', 'latitude', 'longitude']
                   if not getattr(user, f)]
        if missing:
            return Response(
                {'error': f'Missing profile fields: {", ".join(missing)}. '
                          'Please complete your profile before generating a birth chart.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            chart_data = AstrologyService.calculate_birth_chart(
                user.date_of_birth, user.time_of_birth,
                float(user.latitude), float(user.longitude),
            )
            chart, _ = BirthChart.objects.update_or_create(
                user=user,
                defaults={
                    'chart_data': chart_data,
                    'ascendant': chart_data.get('Ascendant', {}).get('sign', ''),
                    'moon_sign': chart_data.get('Moon', {}).get('sign', ''),
                    'sun_sign': chart_data.get('Sun', {}).get('sign', ''),
                },
            )
            # Recalculate all existing Kundali matches with the new chart
            _recalculate_all_kundali_matches(user)
            return Response(BirthChartSerializer(chart).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': f'Invalid birth data: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception('Birth chart generation failed for user %s', user.id)
            return Response(
                {'error': 'Failed to generate birth chart. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HoroscopeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        zodiac = request.query_params.get('sign', '').lower().strip()
        period = request.query_params.get('period', 'daily').lower().strip()
        today = date.today()

        if period not in VALID_PERIODS:
            return Response(
                {'error': f'Invalid period "{period}". Choose from: {", ".join(VALID_PERIODS)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not zodiac:
            horoscopes = Horoscope.objects.filter(period=period, date=today)
            return Response(HoroscopeSerializer(horoscopes, many=True).data)

        if zodiac not in VALID_SIGNS:
            return Response(
                {'error': f'Invalid zodiac sign "{zodiac}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            horoscope = Horoscope.objects.get(zodiac_sign=zodiac, period=period, date=today)
            return Response(HoroscopeSerializer(horoscope).data)
        except Horoscope.DoesNotExist:
            return Response(
                {'error': f'No {period} horoscope available for {zodiac} today. Check back soon.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class PersonalizedHoroscopeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'daily').lower().strip()
        today = date.today()

        if period not in VALID_PERIODS:
            return Response(
                {'error': f'Invalid period. Choose from: {", ".join(VALID_PERIODS)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sun_sign = None
        try:
            sun_sign = user.birth_chart.sun_sign.lower()
        except BirthChart.DoesNotExist:
            if user.date_of_birth:
                try:
                    sun_sign = AstrologyService.get_sun_sign(user.date_of_birth)
                except Exception:
                    logger.warning('Could not determine sun sign for user %s', user.id)

        if not sun_sign:
            return Response(
                {'error': 'Could not determine your sun sign. '
                          'Please complete your profile with your date of birth.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            horoscope = Horoscope.objects.get(zodiac_sign=sun_sign, period=period, date=today)
            return Response(HoroscopeSerializer(horoscope).data)
        except Horoscope.DoesNotExist:
            return Response(
                {'error': f'Your personalized {period} horoscope is not available yet. Check back soon.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class KundaliMatchView(generics.ListCreateAPIView):
    serializer_class = KundaliMatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KundaliMatch.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        from .ashtakoot import calculate_ashtakoot, get_nakshatra_name
        user = self.request.user
        partner_dob = serializer.validated_data['partner_dob']
        partner_tob = serializer.validated_data.get('partner_tob')

        match_score = 18
        match_details = {}
        ai_analysis = ''

        try:
            # Use default Nepal coords if partner location not provided
            partner_lat, partner_lon = 27.7, 85.3
            partner_tob_actual = partner_tob or __import__('datetime').time(6, 0)

            partner_chart = AstrologyService.calculate_birth_chart(
                partner_dob, partner_tob_actual, partner_lat, partner_lon
            )

            if hasattr(user, 'birth_chart'):
                user_chart = user.birth_chart.chart_data
                ashtakoot = calculate_ashtakoot(user_chart, partner_chart)
                match_score = ashtakoot['total']
                match_details = {
                    'partner_chart': partner_chart,
                    'ashtakoot': ashtakoot,
                }
                ai_analysis = (
                    f"Total Score: {ashtakoot['total']}/36 ({ashtakoot['percentage']}%) — "
                    f"{ashtakoot['verdict']}. "
                    f"Your Nakshatra: {ashtakoot['user_nakshatra']}. "
                    f"Partner's Nakshatra: {ashtakoot['partner_nakshatra']}."
                )
            else:
                match_details = {'partner_chart': partner_chart}
                ai_analysis = 'Complete your profile with birth details to get a full Ashtakoot analysis.'

        except Exception as e:
            logger.warning('Kundali match calculation failed for user %s: %s', user.id, e)
            ai_analysis = 'Could not calculate match. Please ensure birth details are complete.'

        serializer.save(
            user=user,
            match_score=match_score,
            match_details=match_details,
            ai_analysis=ai_analysis,
        )


class PlanetaryTransitListView(generics.ListAPIView):
    serializer_class = PlanetaryTransitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PlanetaryTransit.objects.filter(
            transit_date__gte=date.today()
        ).order_by('transit_date')[:10]



class KundaliMatchDetailView(APIView):
    """
    GET    /api/v1/astrology/kundali-match/<pk>/  — retrieve one match
    PATCH  /api/v1/astrology/kundali-match/<pk>/  — update partner details & recalculate
    DELETE /api/v1/astrology/kundali-match/<pk>/  — delete
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_match(self, request, pk):
        try:
            return KundaliMatch.objects.get(id=pk, user=request.user)
        except KundaliMatch.DoesNotExist:
            return None

    def get(self, request, pk):
        match = self._get_match(request, pk)
        if not match:
            return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(KundaliMatchSerializer(match).data)

    def patch(self, request, pk):
        match = self._get_match(request, pk)
        if not match:
            return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Update editable fields
        editable = ['partner_name', 'partner_dob', 'partner_tob', 'partner_pob']
        for field in editable:
            if field in request.data:
                setattr(match, field, request.data[field])

        # Recalculate with updated partner data
        try:
            from .ashtakoot import calculate_ashtakoot
            partner_tob = match.partner_tob or dt_time(6, 0)
            partner_chart = AstrologyService.calculate_birth_chart(
                match.partner_dob, partner_tob, 27.7, 85.3
            )
            if hasattr(request.user, 'birth_chart'):
                user_chart = request.user.birth_chart.chart_data
                ashtakoot = calculate_ashtakoot(user_chart, partner_chart)
                match.match_score = ashtakoot['total']
                match.match_details = {
                    'partner_chart': partner_chart,
                    'ashtakoot': ashtakoot,
                }
                match.ai_analysis = (
                    f"Total Score: {ashtakoot['total']}/36 ({ashtakoot['percentage']}%) — "
                    f"{ashtakoot['verdict']}. "
                    f"Your Nakshatra: {ashtakoot['user_nakshatra']}. "
                    f"Partner's Nakshatra: {ashtakoot['partner_nakshatra']}."
                )
        except Exception as e:
            logger.warning('Kundali recalculation failed: %s', e)

        match.save()
        return Response(KundaliMatchSerializer(match).data)

    def delete(self, request, pk):
        match = self._get_match(request, pk)
        if not match:
            return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
        match.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class KundaliMatchRecalculateView(APIView):
    """
    POST /api/v1/astrology/kundali-match/recalculate/
    Recalculates ALL of the user's Kundali matches using their current birth chart.
    Returns the count of matches updated.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if not hasattr(user, 'birth_chart'):
            return Response(
                {'error': 'Please generate your birth chart first before recalculating matches.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matches = KundaliMatch.objects.filter(user=user)
        if not matches.exists():
            return Response({'message': 'No matches to recalculate.', 'updated': 0})

        _recalculate_all_kundali_matches(user)

        return Response({
            'message': f'Successfully recalculated {matches.count()} Kundali match(es).',
            'updated': matches.count(),
        })
