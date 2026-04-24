"""
Celery tasks for automatic horoscope generation.

Scheduled via CELERY_BEAT_SCHEDULE in settings.py:
  - Daily:   every day at 00:05 UTC
  - Weekly:  every Monday at 00:10 UTC
  - Monthly: 1st of month at 00:15 UTC
"""
import logging
from datetime import date, timedelta
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)

ZODIAC_SIGNS = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]


def _get_fallback(sign: str, period: str) -> dict:
    """Import period-specific fallback from the management command."""
    from apps.horoscope.management.commands.generate_horoscopes import FALLBACK
    return FALLBACK[sign][period].copy()


def _generate_with_ai(sign: str, period: str, target_date: date) -> dict | None:
    """Try OpenAI with a strict timeout. Returns None on any failure."""
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key or api_key.startswith('your-'):
        return None
    try:
        from openai import OpenAI
        import json
        client = OpenAI(api_key=api_key, timeout=10.0)  # 10s hard timeout
        period_desc = {
            'daily': f'for {target_date.strftime("%B %d, %Y")}',
            'weekly': f'for the week of {target_date.strftime("%B %d, %Y")}',
            'monthly': f'for {target_date.strftime("%B %Y")}',
        }[period]
        prompt = (
            f'Write a Vedic astrology {period} horoscope for {sign.capitalize()} {period_desc}. '
            f'Make it specific to {"today" if period=="daily" else "this week" if period=="weekly" else "this month"}. '
            'Return JSON: content, love, career, health, finance, '
            'lucky_number (int 1-9), lucky_color, compatibility (zodiac sign), rating (int 1-10).'
        )
        resp = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            response_format={'type': 'json_object'},
            max_tokens=600,
            temperature=0.85,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        logger.warning('OpenAI horoscope failed for %s/%s: %s', sign, period, type(e).__name__)
        return None
    'aries':       {'content': 'The stars align in your favor today, Aries. Your natural leadership shines bright, drawing opportunities toward you. Trust your instincts and take bold action — the universe supports your ambitions.', 'love': 'Venus energizes your relationships. Single Aries may encounter an intriguing connection. Couples find renewed passion and deeper understanding.', 'career': 'Mars fuels your professional drive. A project you have been working on gains momentum. Your initiative impresses those in authority.', 'health': 'Your energy levels are high. Channel this vitality into physical activity. Avoid overexertion — balance is key to sustained wellness.', 'finance': 'A financial opportunity presents itself. Review it carefully before committing. Your instincts about money are sharp today.', 'lucky_number': 9, 'lucky_color': 'Red', 'compatibility': 'Leo', 'rating': 8},


def _save_horoscope(sign: str, period: str, target_date: date, force: bool = False) -> bool:
    """Generate and save one horoscope. Returns True if saved."""
    from apps.horoscope.models import Horoscope

    if not force and Horoscope.objects.filter(
        zodiac_sign=sign, period=period, date=target_date
    ).exists():
        return False

    # Try AI first (with timeout), fall back to period-specific content
    content = _generate_with_ai(sign, period, target_date) or _get_fallback(sign, period)

    Horoscope.objects.update_or_create(
        zodiac_sign=sign,
        period=period,
        date=target_date,
        defaults={
            'content':       content.get('content', ''),
            'love':          content.get('love', ''),
            'career':        content.get('career', ''),
            'health':        content.get('health', ''),
            'finance':       content.get('finance', ''),
            'lucky_number':  content.get('lucky_number'),
            'lucky_color':   content.get('lucky_color', ''),
            'compatibility': content.get('compatibility', ''),
            'rating':        content.get('rating', 7),
            'is_ai_generated': content is not _get_fallback(sign, period),
        },
    )
    return True


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def generate_horoscopes_task(self, period: str = 'daily'):
    """
    Celery task — generate horoscopes for all 12 signs for the given period.
    Retries up to 3 times with a 5-minute delay on failure.
    """
    today = date.today()

    if period == 'weekly':
        target_date = today - timedelta(days=today.weekday())
    elif period == 'monthly':
        target_date = today.replace(day=1)
    else:
        target_date = today

    logger.info('Generating %s horoscopes for %s', period, target_date)
    saved = 0

    try:
        for sign in ZODIAC_SIGNS:
            if _save_horoscope(sign, period, target_date):
                saved += 1
        logger.info('Generated %d/%d %s horoscopes for %s', saved, len(ZODIAC_SIGNS), period, target_date)
        return {'period': period, 'date': str(target_date), 'saved': saved}
    except Exception as exc:
        logger.exception('Horoscope task failed for period=%s', period)
        raise self.retry(exc=exc)
