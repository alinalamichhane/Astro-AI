from django.db import models
from django.conf import settings


class BirthChart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='birth_chart')
    chart_data = models.JSONField(default=dict)  # planetary positions
    ascendant = models.CharField(max_length=50, blank=True)
    moon_sign = models.CharField(max_length=50, blank=True)
    sun_sign = models.CharField(max_length=50, blank=True)
    nakshatra = models.CharField(max_length=100, blank=True)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'birth_charts'

    def __str__(self):
        return f"Chart for {self.user.email}"


class Horoscope(models.Model):
    PERIOD_CHOICES = [('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')]
    ZODIAC_SIGNS = [
        ('aries', 'Aries'), ('taurus', 'Taurus'), ('gemini', 'Gemini'),
        ('cancer', 'Cancer'), ('leo', 'Leo'), ('virgo', 'Virgo'),
        ('libra', 'Libra'), ('scorpio', 'Scorpio'), ('sagittarius', 'Sagittarius'),
        ('capricorn', 'Capricorn'), ('aquarius', 'Aquarius'), ('pisces', 'Pisces'),
    ]

    zodiac_sign = models.CharField(max_length=20, choices=ZODIAC_SIGNS)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    date = models.DateField()
    content = models.TextField()
    love = models.TextField(blank=True)
    career = models.TextField(blank=True)
    health = models.TextField(blank=True)
    finance = models.TextField(blank=True)
    lucky_number = models.PositiveIntegerField(null=True, blank=True)
    lucky_color = models.CharField(max_length=50, blank=True)
    compatibility = models.CharField(max_length=50, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)  # 1-10
    is_ai_generated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'horoscopes'
        unique_together = ['zodiac_sign', 'period', 'date']

    def __str__(self):
        return f"{self.zodiac_sign} - {self.period} - {self.date}"


class KundaliMatch(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name='kundali_matches')
    partner_name = models.CharField(max_length=100)
    partner_dob = models.DateField()
    partner_tob = models.TimeField(null=True, blank=True)
    partner_pob = models.CharField(max_length=200, blank=True)
    match_score = models.PositiveSmallIntegerField(default=0)  # out of 36
    match_details = models.JSONField(default=dict)
    ai_analysis = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'kundali_matches'

    def __str__(self):
        return f"{self.user.email} x {self.partner_name}"


class PlanetaryTransit(models.Model):
    planet = models.CharField(max_length=50)
    from_sign = models.CharField(max_length=50)
    to_sign = models.CharField(max_length=50)
    transit_date = models.DateField()
    description = models.TextField()
    impact = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'planetary_transits'
