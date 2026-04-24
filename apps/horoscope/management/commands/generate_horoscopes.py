"""
Management command to generate horoscopes for all 12 zodiac signs.
Uses OpenAI if API key has credits, otherwise uses period-specific fallback content.

Usage:
    python manage.py generate_horoscopes              # today, daily
    python manage.py generate_horoscopes --all-periods
    python manage.py generate_horoscopes --period weekly
    python manage.py generate_horoscopes --force      # overwrite existing
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from datetime import date, timedelta
from apps.horoscope.models import Horoscope

ZODIAC_SIGNS = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]

# Period-specific fallback content — daily/weekly/monthly are DIFFERENT
FALLBACK = {
    'aries': {
        'daily': {
            'content': 'Today Mars energizes your spirit, Aries. A bold decision made now sets the tone for the week. Trust your instincts and act with confidence.',
            'love': 'A spontaneous gesture wins hearts today. Be direct about your feelings.',
            'career': 'Your initiative stands out. Take the lead on a task others are hesitating over.',
            'health': 'High energy today — channel it into a morning workout or brisk walk.',
            'finance': 'A small financial win is possible. Keep an eye on daily expenses.',
            'lucky_number': 9, 'lucky_color': 'Red', 'compatibility': 'Leo', 'rating': 8,
        },
        'weekly': {
            'content': 'This week, Aries, the planets align to reward your courage. Mid-week brings a turning point in a project you have been pushing forward. Stay persistent through Thursday.',
            'love': 'The weekend brings romantic energy. Plan something special for Saturday.',
            'career': 'A proposal or pitch gains traction by Wednesday. Follow up on Monday leads.',
            'health': 'Focus on consistent sleep this week. Your energy peaks Tuesday and Friday.',
            'finance': 'Review your weekly budget. An unexpected expense may arise mid-week.',
            'lucky_number': 3, 'lucky_color': 'Orange', 'compatibility': 'Sagittarius', 'rating': 7,
        },
        'monthly': {
            'content': 'April is a month of bold new beginnings for Aries. The first two weeks favor launching projects, while the final week calls for reflection and consolidation.',
            'love': 'A significant relationship milestone arrives this month. Open communication is key.',
            'career': 'Career advancement is strongly favored. A promotion or new opportunity emerges.',
            'health': 'Build a sustainable fitness routine this month. Consistency over intensity.',
            'finance': 'Financial planning pays off. Consider a long-term investment this month.',
            'lucky_number': 1, 'lucky_color': 'Crimson', 'compatibility': 'Leo', 'rating': 9,
        },
    },
    'taurus': {
        'daily': {
            'content': 'Venus blesses your day with beauty and calm, Taurus. A practical matter resolves smoothly. Enjoy the simple pleasures around you.',
            'love': 'A quiet, intimate moment with someone special is more meaningful than grand gestures.',
            'career': 'Steady, methodical work brings results. Avoid rushing — quality matters today.',
            'health': 'Nourish yourself well today. A healthy meal and time in nature restore balance.',
            'finance': 'Avoid impulse purchases. A small saving today adds up over time.',
            'lucky_number': 6, 'lucky_color': 'Green', 'compatibility': 'Virgo', 'rating': 7,
        },
        'weekly': {
            'content': 'This week, Taurus, patience is your greatest asset. A financial matter that has been pending moves forward by Thursday. Stay grounded through any mid-week turbulence.',
            'love': 'Deepen an existing bond through shared activities. Quality time over quantity.',
            'career': 'A collaborative project gains momentum. Your reliability earns recognition.',
            'health': 'Prioritize rest mid-week. Your body needs recovery as much as activity.',
            'finance': 'A bill or payment resolves favorably. Review subscriptions for savings.',
            'lucky_number': 4, 'lucky_color': 'Emerald', 'compatibility': 'Capricorn', 'rating': 7,
        },
        'monthly': {
            'content': 'This month strengthens your foundations, Taurus. Financial stability improves steadily. The last week brings a pleasant surprise in your personal life.',
            'love': 'A relationship deepens significantly this month. Trust builds through consistency.',
            'career': 'Your expertise is recognized. A raise or new responsibility is possible.',
            'health': 'Establish a wellness routine that you can maintain long-term.',
            'finance': 'Savings and investments show positive movement. Avoid major risks.',
            'lucky_number': 2, 'lucky_color': 'Forest Green', 'compatibility': 'Virgo', 'rating': 8,
        },
    },
    'gemini': {
        'daily': {
            'content': 'Mercury sharpens your wit today, Gemini. A conversation you have been putting off goes better than expected. Your words carry unusual power right now.',
            'love': 'Playful banter leads to deeper connection. Let your curiosity guide the conversation.',
            'career': 'A quick-thinking solution impresses colleagues. Share your ideas freely.',
            'health': 'Your mind is active — give it a break with a short meditation or walk.',
            'finance': 'A small side income opportunity presents itself. Evaluate it carefully.',
            'lucky_number': 5, 'lucky_color': 'Yellow', 'compatibility': 'Libra', 'rating': 8,
        },
        'weekly': {
            'content': 'A week of dynamic communication for Gemini. Monday and Tuesday are ideal for negotiations. By Friday, a creative project reaches an exciting milestone.',
            'love': 'Mid-week brings a meaningful conversation that clarifies a relationship.',
            'career': 'Your networking skills shine. Reach out to a contact you have been meaning to reconnect with.',
            'health': 'Avoid mental overload. Schedule downtime between busy periods.',
            'finance': 'Two income streams are highlighted this week. Diversify where possible.',
            'lucky_number': 7, 'lucky_color': 'Sky Blue', 'compatibility': 'Aquarius', 'rating': 8,
        },
        'monthly': {
            'content': 'This month, Gemini, your communication skills open remarkable doors. A writing, speaking, or teaching opportunity emerges in the second week.',
            'love': 'A new romantic connection or a deepening of an existing one is highlighted.',
            'career': 'A project that showcases your versatility brings career advancement.',
            'health': 'Focus on nervous system health — breathwork and adequate sleep are essential.',
            'finance': 'Multiple income streams become more stable. Budget for a learning investment.',
            'lucky_number': 3, 'lucky_color': 'Bright Yellow', 'compatibility': 'Libra', 'rating': 9,
        },
    },
    'cancer': {
        'daily': {
            'content': 'The Moon heightens your intuition today, Cancer. Trust the quiet voice within — it is guiding you toward the right choice. Home and family bring comfort.',
            'love': 'Emotional honesty strengthens your closest bond today.',
            'career': 'Your empathy makes you invaluable in team dynamics. A colleague needs your support.',
            'health': 'Emotional and physical health are linked today. Rest if you feel drained.',
            'finance': 'A home-related expense may arise. Budget accordingly.',
            'lucky_number': 2, 'lucky_color': 'Silver', 'compatibility': 'Scorpio', 'rating': 7,
        },
        'weekly': {
            'content': 'This week, Cancer, your emotional intelligence guides important decisions. A family matter resolves by Wednesday. The weekend brings nurturing energy.',
            'love': 'A heartfelt conversation mid-week brings you closer to someone you care about.',
            'career': 'Your instincts about a work situation prove correct. Trust your gut on Thursday.',
            'health': 'Prioritize sleep and hydration this week. Your body is processing deeply.',
            'finance': 'A home investment or repair may need attention. Plan for it now.',
            'lucky_number': 6, 'lucky_color': 'Pearl White', 'compatibility': 'Pisces', 'rating': 7,
        },
        'monthly': {
            'content': 'A month of emotional growth and home harmony for Cancer. The full moon mid-month illuminates a relationship truth. Embrace vulnerability.',
            'love': 'Deep emotional bonds are strengthened. A commitment or milestone is possible.',
            'career': 'Your nurturing leadership style earns respect and results this month.',
            'health': 'Focus on gut health and emotional release practices like journaling.',
            'finance': 'Home-related finances stabilize. A family financial matter resolves positively.',
            'lucky_number': 4, 'lucky_color': 'Moonstone', 'compatibility': 'Scorpio', 'rating': 8,
        },
    },
    'leo': {
        'daily': {
            'content': 'The Sun amplifies your natural charisma today, Leo. You are magnetic and inspiring. Step into the spotlight — it belongs to you.',
            'love': 'Your warmth draws people in. A romantic gesture today will be remembered.',
            'career': 'Leadership is called for. Step up and own the room.',
            'health': 'Vitality is high. Celebrate your body with joyful movement.',
            'finance': 'A creative investment idea deserves consideration today.',
            'lucky_number': 1, 'lucky_color': 'Gold', 'compatibility': 'Aries', 'rating': 9,
        },
        'weekly': {
            'content': 'A week where your star shines brightest, Leo. A creative project gets the recognition it deserves by Thursday. The weekend is perfect for celebration.',
            'love': 'Romance is highlighted all week. Plan something memorable for the weekend.',
            'career': 'Your creative vision leads the team. A presentation or pitch succeeds.',
            'health': 'Keep your heart healthy — both literally and emotionally this week.',
            'finance': 'A creative venture shows financial promise. Invest in your talents.',
            'lucky_number': 5, 'lucky_color': 'Amber', 'compatibility': 'Sagittarius', 'rating': 9,
        },
        'monthly': {
            'content': 'This month, Leo, your confidence and creativity reach new heights. A major personal or professional achievement is within reach. Claim it boldly.',
            'love': 'A passionate and fulfilling romantic chapter unfolds this month.',
            'career': 'Recognition and advancement are strongly favored. Your moment has arrived.',
            'health': 'Maintain your energy with consistent rest and joyful activities.',
            'finance': 'Financial growth through creative or entrepreneurial efforts is highlighted.',
            'lucky_number': 8, 'lucky_color': 'Royal Gold', 'compatibility': 'Aries', 'rating': 10,
        },
    },
    'virgo': {
        'daily': {
            'content': 'Mercury sharpens your analytical mind today, Virgo. A problem that seemed complex reveals a simple solution. Your attention to detail saves the day.',
            'love': 'Small, thoughtful acts of service speak louder than words today.',
            'career': 'Your precision and thoroughness impress. A task you complete today sets a standard.',
            'health': 'Digestive health deserves attention. Eat mindfully and avoid stress eating.',
            'finance': 'Review a recent expense — you may find a way to optimize it.',
            'lucky_number': 5, 'lucky_color': 'Navy Blue', 'compatibility': 'Taurus', 'rating': 7,
        },
        'weekly': {
            'content': 'A productive week for Virgo. Monday through Wednesday are ideal for detailed work. A health or wellness goal gains traction by Friday.',
            'love': 'Practical acts of love — helping, organizing, supporting — deepen bonds this week.',
            'career': 'A complex project benefits from your systematic approach. Delegate wisely.',
            'health': 'Establish a consistent daily routine this week. Small habits compound.',
            'finance': 'Budget review mid-week reveals savings opportunities. Act on them.',
            'lucky_number': 3, 'lucky_color': 'Sage Green', 'compatibility': 'Capricorn', 'rating': 7,
        },
        'monthly': {
            'content': 'This month brings significant improvements to your daily life, Virgo. A health or work system you implement now will benefit you for months to come.',
            'love': 'A relationship improves through honest, practical communication this month.',
            'career': 'Your expertise is in high demand. A specialized skill opens new doors.',
            'health': 'A new health routine started this month will show results within weeks.',
            'finance': 'Careful financial planning this month creates long-term stability.',
            'lucky_number': 6, 'lucky_color': 'Olive', 'compatibility': 'Taurus', 'rating': 8,
        },
    },
    'libra': {
        'daily': {
            'content': 'Venus graces your day with harmony and beauty, Libra. A decision you have been weighing becomes clearer. Balance is restored in an important area.',
            'love': 'Compromise and mutual respect create a beautiful moment in your relationship.',
            'career': 'Your diplomatic skills resolve a workplace tension. Others look to you for fairness.',
            'health': 'Balance work and rest equally today. Your body craves equilibrium.',
            'finance': 'A joint financial matter moves toward resolution. Seek fair terms.',
            'lucky_number': 6, 'lucky_color': 'Pink', 'compatibility': 'Gemini', 'rating': 8,
        },
        'weekly': {
            'content': 'A week of meaningful connections for Libra. A partnership — romantic or professional — reaches a new level of understanding by Thursday.',
            'love': 'A relationship conversation mid-week brings clarity and closeness.',
            'career': 'Collaboration is your strength this week. A team effort produces excellent results.',
            'health': 'Social activities boost your mood. Balance them with quiet time.',
            'finance': 'A shared financial decision benefits from careful discussion this week.',
            'lucky_number': 2, 'lucky_color': 'Rose Gold', 'compatibility': 'Aquarius', 'rating': 8,
        },
        'monthly': {
            'content': 'This month, Libra, relationships of all kinds flourish. A partnership reaches a significant milestone. Your charm and grace open important doors.',
            'love': 'A deeply fulfilling romantic development unfolds this month.',
            'career': 'Partnerships and collaborations bring your biggest wins this month.',
            'health': 'Focus on kidney health and lower back care. Gentle yoga is beneficial.',
            'finance': 'Joint ventures and shared investments show positive returns.',
            'lucky_number': 7, 'lucky_color': 'Lavender', 'compatibility': 'Gemini', 'rating': 9,
        },
    },
    'scorpio': {
        'daily': {
            'content': 'Pluto deepens your perception today, Scorpio. You see through surface appearances to the truth beneath. Use this insight wisely and compassionately.',
            'love': 'Intensity and depth define your romantic energy today. Vulnerability builds trust.',
            'career': 'Your investigative instincts uncover a hidden opportunity. Research pays off.',
            'health': 'Emotional detox is as important as physical health today. Release what no longer serves.',
            'finance': 'A hidden financial opportunity emerges. Investigate before committing.',
            'lucky_number': 8, 'lucky_color': 'Maroon', 'compatibility': 'Cancer', 'rating': 8,
        },
        'weekly': {
            'content': 'A week of powerful transformation for Scorpio. A secret or hidden matter comes to light by Wednesday, ultimately working in your favor.',
            'love': 'Deep emotional honesty mid-week transforms a relationship for the better.',
            'career': 'Research and strategy are your tools this week. A competitor reveals their hand.',
            'health': 'Detox and cleansing practices support your wellbeing this week.',
            'finance': 'A financial investigation reveals something valuable. Follow the trail.',
            'lucky_number': 4, 'lucky_color': 'Deep Purple', 'compatibility': 'Pisces', 'rating': 8,
        },
        'monthly': {
            'content': 'This month, Scorpio, a profound transformation reshapes an important area of your life. Embrace the change — what ends makes room for something far better.',
            'love': 'A relationship undergoes a powerful, positive transformation this month.',
            'career': 'A career reinvention or major shift brings exciting new possibilities.',
            'health': 'Focus on regenerative practices — sleep, nutrition, and emotional release.',
            'finance': 'Hidden financial assets or opportunities surface this month.',
            'lucky_number': 9, 'lucky_color': 'Black', 'compatibility': 'Cancer', 'rating': 9,
        },
    },
    'sagittarius': {
        'daily': {
            'content': 'Jupiter expands your horizons today, Sagittarius. An unexpected opportunity to learn or travel presents itself. Say yes to the adventure.',
            'love': 'Freedom and honesty are your love languages today. An adventurous date sparks joy.',
            'career': 'Big-picture thinking sets you apart. Share your vision with confidence.',
            'health': 'Outdoor activity and fresh air are your best medicine today.',
            'finance': 'An optimistic financial outlook is warranted — but stay grounded in facts.',
            'lucky_number': 3, 'lucky_color': 'Purple', 'compatibility': 'Aries', 'rating': 9,
        },
        'weekly': {
            'content': 'An expansive week for Sagittarius. A learning opportunity or travel plan takes shape by Wednesday. The weekend brings philosophical conversations that inspire.',
            'love': 'A shared adventure or intellectual discussion deepens a romantic bond.',
            'career': 'Your enthusiasm for a new idea is contagious. Pitch it boldly this week.',
            'health': 'Explore a new form of exercise or outdoor activity this week.',
            'finance': 'An investment in education or travel pays dividends long-term.',
            'lucky_number': 9, 'lucky_color': 'Turquoise', 'compatibility': 'Leo', 'rating': 9,
        },
        'monthly': {
            'content': 'This month, Sagittarius, your world expands in exciting ways. A journey — physical or intellectual — transforms your perspective and opens new doors.',
            'love': 'A relationship grows through shared adventures and honest conversations.',
            'career': 'International or cross-cultural opportunities bring career growth.',
            'health': 'Focus on hips and thighs — your Sagittarian body zones. Stay active.',
            'finance': 'Investments in education, travel, or publishing show strong returns.',
            'lucky_number': 6, 'lucky_color': 'Royal Blue', 'compatibility': 'Aries', 'rating': 10,
        },
    },
    'capricorn': {
        'daily': {
            'content': 'Saturn rewards your discipline today, Capricorn. A long-term effort shows its first tangible results. Keep climbing — the summit is closer than it appears.',
            'love': 'Reliability and commitment are your most attractive qualities today.',
            'career': 'A senior figure notices your work ethic. Your reputation is building.',
            'health': 'Structured exercise and adequate sleep are your health priorities today.',
            'finance': 'A conservative financial decision proves wise. Patience pays.',
            'lucky_number': 8, 'lucky_color': 'Brown', 'compatibility': 'Taurus', 'rating': 7,
        },
        'weekly': {
            'content': 'A week of steady advancement for Capricorn. A professional goal moves measurably forward by Thursday. The weekend rewards your hard work with well-earned rest.',
            'love': 'Show your softer side this week. Vulnerability strengthens your most important bond.',
            'career': 'A long-term project reaches a significant milestone. Document your progress.',
            'health': 'Bone and joint health deserve attention. Stretching and calcium are key.',
            'finance': 'A conservative investment strategy shows steady gains this week.',
            'lucky_number': 4, 'lucky_color': 'Charcoal', 'compatibility': 'Virgo', 'rating': 7,
        },
        'monthly': {
            'content': 'This month, Capricorn, your ambition and discipline produce remarkable results. A career milestone you have been working toward for months finally arrives.',
            'love': 'A relationship deepens through shared goals and mutual respect this month.',
            'career': 'A promotion, award, or major achievement marks this month as significant.',
            'health': 'Build sustainable health habits this month. Consistency is your strength.',
            'finance': 'Long-term financial strategies show their value. Real estate looks favorable.',
            'lucky_number': 1, 'lucky_color': 'Dark Green', 'compatibility': 'Taurus', 'rating': 8,
        },
    },
    'aquarius': {
        'daily': {
            'content': 'Uranus sparks your originality today, Aquarius. An unconventional idea you have been sitting on deserves to be shared. The world needs your unique perspective.',
            'love': 'Intellectual connection is your romantic foundation today. Surprise your partner.',
            'career': 'Innovation is your superpower today. Challenge the status quo respectfully.',
            'health': 'Mental health is paramount. Connect with a community that energizes you.',
            'finance': 'An unconventional investment idea deserves careful research today.',
            'lucky_number': 4, 'lucky_color': 'Electric Blue', 'compatibility': 'Gemini', 'rating': 8,
        },
        'weekly': {
            'content': 'A week of breakthroughs for Aquarius. A technology or innovation project leaps forward by Wednesday. Your network proves invaluable by Friday.',
            'love': 'A friendship evolves into something deeper mid-week. Stay open to it.',
            'career': 'Your forward-thinking approach solves a problem others have been stuck on.',
            'health': 'Circulation and nervous system health benefit from movement and breathwork.',
            'finance': 'A tech or innovation investment shows promising early returns.',
            'lucky_number': 11, 'lucky_color': 'Cobalt', 'compatibility': 'Libra', 'rating': 8,
        },
        'monthly': {
            'content': 'This month, Aquarius, your vision for the future becomes reality. A humanitarian or community project you champion gains significant momentum.',
            'love': 'A relationship built on friendship and shared values reaches a beautiful milestone.',
            'career': 'Your innovative ideas attract attention from influential people this month.',
            'health': 'Focus on ankle health and circulation. Regular movement is essential.',
            'finance': 'Investments in technology or social impact ventures show strong potential.',
            'lucky_number': 7, 'lucky_color': 'Indigo', 'compatibility': 'Gemini', 'rating': 9,
        },
    },
    'pisces': {
        'daily': {
            'content': 'Neptune deepens your spiritual awareness today, Pisces. A dream or intuitive flash carries an important message. Trust the invisible guidance around you.',
            'love': 'Romantic and spiritual connection merge beautifully today. Be fully present.',
            'career': 'Creative and artistic work flows effortlessly. Your imagination is your greatest tool.',
            'health': 'Rest and spiritual practices restore your energy. Water is healing for you.',
            'finance': 'Intuitive financial decisions prove wise today. Trust your gut.',
            'lucky_number': 7, 'lucky_color': 'Sea Green', 'compatibility': 'Scorpio', 'rating': 8,
        },
        'weekly': {
            'content': 'A spiritually rich week for Pisces. A creative project reaches a beautiful completion by Thursday. The weekend brings a deeply meaningful personal experience.',
            'love': 'A soulful connection deepens significantly mid-week. Be open and vulnerable.',
            'career': 'Creative work is your strength this week. A project showcases your unique gifts.',
            'health': 'Prioritize sleep and dream journaling this week. Your subconscious is active.',
            'finance': 'A charitable or creative financial decision brings unexpected returns.',
            'lucky_number': 3, 'lucky_color': 'Aquamarine', 'compatibility': 'Cancer', 'rating': 8,
        },
        'monthly': {
            'content': 'This month, Pisces, your creativity and spiritual depth reach their fullest expression. A creative work or spiritual practice transforms your life in beautiful ways.',
            'love': 'A deeply soulful romantic connection or spiritual partnership blossoms.',
            'career': 'Creative, healing, or spiritual work brings your greatest professional success.',
            'health': 'Focus on feet health and lymphatic system. Swimming is ideal exercise.',
            'finance': 'Investments in creative or healing arts show meaningful returns.',
            'lucky_number': 9, 'lucky_color': 'Seafoam', 'compatibility': 'Scorpio', 'rating': 9,
        },
    },
}


def generate_with_ai(sign: str, period: str, target_date) -> dict | None:
    """Try OpenAI, return None on any failure."""
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key or api_key.startswith('your-'):
        return None
    try:
        from openai import OpenAI
        import json
        client = OpenAI(api_key=api_key)
        period_desc = {
            'daily': f'for {target_date.strftime("%B %d, %Y")}',
            'weekly': f'for the week of {target_date.strftime("%B %d, %Y")}',
            'monthly': f'for {target_date.strftime("%B %Y")}',
        }[period]
        prompt = (
            f'Write a Vedic astrology {period} horoscope for {sign.capitalize()} {period_desc}. '
            f'Make it specific to the {period} timeframe — {"today" if period=="daily" else "this week" if period=="weekly" else "this month"}. '
            'Return JSON with keys: content, love, career, health, finance, '
            'lucky_number (int 1-9), lucky_color (string), compatibility (zodiac sign), rating (int 1-10).'
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
        return None


class Command(BaseCommand):
    help = 'Generate horoscopes for all 12 zodiac signs (daily/weekly/monthly)'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Target date YYYY-MM-DD (default: today)')
        parser.add_argument('--period', type=str, default='daily',
                            choices=['daily', 'weekly', 'monthly'])
        parser.add_argument('--all-periods', action='store_true')
        parser.add_argument('--days', type=int, default=1)
        parser.add_argument('--force', action='store_true', help='Overwrite existing')

    def handle(self, *args, **options):
        target_date = date.today()
        if options['date']:
            target_date = date.fromisoformat(options['date'])

        periods = ['daily', 'weekly', 'monthly'] if options['all_periods'] else [options['period']]
        days = options['days'] if not options['all_periods'] else 1
        use_ai = bool(getattr(settings, 'OPENAI_API_KEY', ''))

        if use_ai:
            self.stdout.write('AI mode: OpenAI key detected')
        else:
            self.stdout.write('Fallback mode: using period-specific built-in content')

        total = 0
        for day_offset in range(days):
            current_date = target_date + timedelta(days=day_offset)
            for period in periods:
                for sign in ZODIAC_SIGNS:
                    exists = Horoscope.objects.filter(
                        zodiac_sign=sign, period=period, date=current_date
                    ).exists()

                    if exists and not options['force']:
                        self.stdout.write(f'  skip  {sign} {period} {current_date}')
                        continue

                    # Try AI first
                    content = None
                    if use_ai:
                        content = generate_with_ai(sign, period, current_date)
                        if not content:
                            self.stdout.write(
                                self.style.WARNING(f'  AI failed for {sign}/{period}, using fallback')
                            )

                    # Use period-specific fallback
                    if not content:
                        content = FALLBACK[sign][period].copy()

                    Horoscope.objects.update_or_create(
                        zodiac_sign=sign,
                        period=period,
                        date=current_date,
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
                            'is_ai_generated': use_ai and content is not None,
                        },
                    )
                    total += 1
                    self.stdout.write(f'  OK  {sign:15} {period:8} {current_date}')

        self.stdout.write(self.style.SUCCESS(f'\nGenerated {total} horoscopes.'))
