import swisseph as swe
from datetime import datetime, date
from django.utils import timezone


class AstrologyService:
    ZODIAC_SIGNS = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ]

    PLANETS = {
        swe.SUN: 'Sun', swe.MOON: 'Moon', swe.MERCURY: 'Mercury',
        swe.VENUS: 'Venus', swe.MARS: 'Mars', swe.JUPITER: 'Jupiter',
        swe.SATURN: 'Saturn', swe.URANUS: 'Uranus', swe.NEPTUNE: 'Neptune',
        swe.PLUTO: 'Pluto',
    }

    @staticmethod
    def get_julian_day(dt, lat, lon):
        year, month, day = dt.year, dt.month, dt.day
        hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
        jd = swe.julday(year, month, day, hour)
        return jd

    @classmethod
    def calculate_birth_chart(cls, dob, tob, lat, lon):
        dt = datetime.combine(dob, tob)
        jd = cls.get_julian_day(dt, lat, lon)
        chart_data = {}
        for planet_id, planet_name in cls.PLANETS.items():
            result = swe.calc_ut(jd, planet_id)
            longitude = result[0][0]
            sign_index = int(longitude / 30)
            degree_in_sign = longitude % 30
            chart_data[planet_name] = {
                'longitude': longitude,
                'sign': cls.ZODIAC_SIGNS[sign_index],
                'degree': round(degree_in_sign, 2),
            }
        # Ascendant
        houses = swe.houses(jd, lat, lon, b'P')  # Placidus
        asc_longitude = houses[1][0]
        asc_sign_index = int(asc_longitude / 30)
        chart_data['Ascendant'] = {
            'longitude': asc_longitude,
            'sign': cls.ZODIAC_SIGNS[asc_sign_index],
            'degree': round(asc_longitude % 30, 2),
        }
        return chart_data

    @classmethod
    def get_sun_sign(cls, dob):
        dt = datetime.combine(dob, datetime.min.time())
        jd = cls.get_julian_day(dt, 0, 0)
        result = swe.calc_ut(jd, swe.SUN)
        longitude = result[0][0]
        sign_index = int(longitude / 30)
        return cls.ZODIAC_SIGNS[sign_index].lower()

    @classmethod
    def calculate_kundali_match(cls, user_chart, partner_chart):
        # Simplified Ashtakoot matching (8 factors)
        score = 0
        # Varna (1 point), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5),
        # Gana (6), Bhakoot (7), Nadi (8)
        # This is a placeholder — real implementation requires complex rules
        user_moon = user_chart.get('Moon', {}).get('sign', '')
        partner_moon = partner_chart.get('Moon', {}).get('sign', '')
        if user_moon == partner_moon:
            score += 6
        else:
            score += 18  # simplified
        return min(score, 36)
