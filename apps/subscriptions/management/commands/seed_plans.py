from django.core.management.base import BaseCommand
from apps.subscriptions.models import Plan


class Command(BaseCommand):
    help = 'Seed subscription plans'

    def handle(self, *args, **kwargs):
        plans = [
            {
                'name': 'Token Pack - Starter',
                'plan_type': 'token',
                'description': 'Get 50 AI tokens to ask astrology questions',
                'price_npr': 499,
                'price_usd': 5,
                'ai_tokens': 50,
                'duration_days': 365,
                'features': ['50 AI chat tokens', 'Basic horoscope', 'Birth chart'],
            },
            {
                'name': 'Basic Plan',
                'plan_type': 'basic',
                'description': 'Monthly plan with 200 AI tokens and basic features',
                'price_npr': 499,
                'price_usd': 10,
                'ai_tokens': 200,
                'duration_days': 30,
                'features': [
                    '200 AI tokens/month', 'Daily horoscope', 'Birth chart',
                    'Kundali matching', 'Ad-free experience',
                ],
            },
            {
                'name': 'Premium Plan',
                'plan_type': 'premium',
                'description': 'Full access with 500 AI tokens and premium features',
                'price_npr': 1199,
                'price_usd': 20,
                'ai_tokens': 500,
                'duration_days': 30,
                'features': [
                    '500 AI tokens/month', 'All horoscopes (daily/weekly/monthly)',
                    'Birth chart & Kundali', 'Gemstone recommendations',
                    '1 free astrologer consultation (30 min)', 'Course discounts',
                ],
            },
            {
                'name': 'VIP Plan',
                'plan_type': 'vip',
                'description': 'Ultimate plan with unlimited AI and priority access',
                'price_npr': 3125,
                'price_usd': 50,
                'ai_tokens': 2000,
                'duration_days': 30,
                'features': [
                    '2000 AI tokens/month', 'All Premium features',
                    '3 free astrologer consultations', 'Priority booking',
                    'Free course enrollment (1/month)', 'Marketplace discounts 10%',
                    'Dedicated support',
                ],
            },
        ]

        for plan_data in plans:
            plan, created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"{status}: {plan.name}")

        self.stdout.write(self.style.SUCCESS('Plans seeded successfully!'))
