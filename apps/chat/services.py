"""
AI Chat Service for AstroAI.

Priority order:
  1. OpenAI GPT-4o-mini  (if OPENAI_API_KEY is set and has quota)
  2. Built-in Vedic astrology fallback engine  (always works, no API key needed)

The fallback engine gives meaningful, contextual Vedic astrology responses
based on keyword matching — so the chat feature is never completely broken.
"""
import logging
import random
from django.conf import settings

logger = logging.getLogger(__name__)

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are AstroAI, an expert Vedic astrologer and spiritual guide.
You have deep knowledge of:
- Vedic astrology (Jyotish), birth charts, planetary positions
- Kundali analysis, Nakshatra, Dasha periods
- Gemstone recommendations based on planetary positions
- Pooja rituals and remedies
- Compatibility analysis (Kundali matching)
- Life guidance for love, marriage, career, health, and finance

Always provide thoughtful, personalized guidance based on Vedic principles.
Be compassionate, insightful, and practical. When you don't have birth chart data,
ask for the user's date, time, and place of birth to give more accurate readings.
Keep responses concise but meaningful. Respond in the same language the user writes in."""

# ── Fallback response engine ──────────────────────────────────────────────────

FALLBACK_RESPONSES = {
    'career': [
        "Based on Vedic astrology principles, your career path is deeply influenced by the 10th house (Karma Bhava) and its lord. Saturn, the planet of discipline and hard work, plays a crucial role in professional success. To strengthen your career prospects:\n\n• Perform Saturn remedies on Saturdays — light a sesame oil lamp\n• Wear a Blue Sapphire (Neelam) if Saturn is your ruling planet\n• Chant the Shani mantra: *Om Sham Shanicharaya Namah*\n\nFor a precise career reading, please share your date, time, and place of birth so I can analyze your specific planetary positions.",
        "In Vedic astrology, career success is governed by the 10th house, its lord, and planets like Sun (authority), Mercury (communication), and Jupiter (wisdom). The current planetary transits suggest a period of growth and new opportunities. Focus on your natural strengths and remain patient — Saturn rewards consistent effort. Would you like to share your birth details for a personalized career analysis?",
    ],
    'love': [
        "Love and relationships in Vedic astrology are governed by Venus (Shukra) and the 7th house (Kalatra Bhava). Venus represents beauty, harmony, and romantic connection. To attract love and strengthen relationships:\n\n• Worship Goddess Lakshmi on Fridays\n• Wear a Diamond or White Sapphire to strengthen Venus\n• Chant: *Om Shum Shukraya Namah*\n\nFor a detailed compatibility analysis or relationship reading, please share your birth details.",
        "The 5th house governs romance and the 7th house governs marriage in Vedic astrology. Venus and Jupiter are the key planets for love. If you're seeking a partner, this is a favorable time to open your heart. Trust the cosmic timing — the right connection comes when the planets align. Share your birth chart details for a personalized love reading.",
    ],
    'marriage': [
        "Marriage in Vedic astrology is analyzed through the 7th house, its lord, and Venus. Kundali matching (Ashtakoot) considers 8 factors including Guna Milan, Mangal Dosha, and Navamsa chart compatibility. A score of 18+ out of 36 is considered good for marriage.\n\nKey remedies for a harmonious marriage:\n• Perform Navgraha puja\n• Recite Vivah Sukta from the Rigveda\n• Offer white flowers to Venus on Fridays\n\nWould you like me to perform a Kundali match? Please share both birth details.",
    ],
    'health': [
        "In Vedic astrology, health is governed by the 1st house (Lagna), 6th house (disease), and the Sun (vitality). Each planet rules specific body parts — Mars rules blood and muscles, Moon rules mind and emotions, Mercury rules the nervous system.\n\nGeneral health remedies:\n• Sun salutation (Surya Namaskar) at sunrise\n• Wear Ruby (Manik) to strengthen the Sun\n• Chant the Mahamrityunjaya mantra for overall wellbeing\n\nFor specific health concerns, share your birth details for a precise analysis.",
    ],
    'finance': [
        "Financial prosperity in Vedic astrology is governed by the 2nd house (wealth), 11th house (gains), and Jupiter (abundance). The current Jupiter transit is generally favorable for financial growth.\n\nRemedies to attract wealth:\n• Worship Lord Kubera and Goddess Lakshmi\n• Keep a Shree Yantra in your home or office\n• Donate yellow items on Thursdays\n• Chant: *Om Shreem Hreem Kleem Mahalakshmyai Namah*\n\nFor a detailed financial forecast, please share your birth chart details.",
    ],
    'birth_chart': [
        "A Vedic birth chart (Kundali) is a cosmic map of the sky at the exact moment of your birth. It contains:\n\n• **Lagna (Ascendant)** — your personality and physical self\n• **Sun sign** — your soul and ego\n• **Moon sign** — your mind and emotions\n• **9 Planets** — each influencing different life areas\n• **12 Houses** — representing different life domains\n• **27 Nakshatras** — lunar mansions for precise predictions\n\nTo generate your birth chart, please go to your **Profile page** and enter your date of birth, time of birth, and place of birth. Then click 'Generate Chart'.",
    ],
    'gemstone': [
        "Gemstone recommendations in Vedic astrology are based on your birth chart's planetary positions. Each planet has a corresponding gemstone:\n\n• **Sun** → Ruby (Manik)\n• **Moon** → Pearl (Moti)\n• **Mars** → Red Coral (Moonga)\n• **Mercury** → Emerald (Panna)\n• **Jupiter** → Yellow Sapphire (Pukhraj)\n• **Venus** → Diamond or White Sapphire\n• **Saturn** → Blue Sapphire (Neelam)\n• **Rahu** → Hessonite (Gomed)\n• **Ketu** → Cat's Eye (Lehsunia)\n\nAlways consult your birth chart before wearing a gemstone — the wrong stone can have adverse effects. Share your birth details for a personalized recommendation.",
    ],
    'nakshatra': [
        "Nakshatras are the 27 lunar mansions in Vedic astrology, each spanning 13°20' of the zodiac. Your birth Nakshatra (Janma Nakshatra) is determined by the Moon's position at birth and reveals your:\n\n• Core personality traits\n• Favorable and unfavorable periods\n• Compatible partners\n• Suitable career paths\n• Spiritual path and purpose\n\nTo find your Nakshatra, I need your exact birth date, time, and place. Please complete your profile to generate your birth chart.",
    ],
    'dasha': [
        "Dasha periods are planetary time cycles in Vedic astrology that govern different phases of your life. The Vimshottari Dasha system spans 120 years across 9 planets:\n\n• **Sun Mahadasha** — 6 years (authority, career)\n• **Moon Mahadasha** — 10 years (emotions, home)\n• **Mars Mahadasha** — 7 years (energy, ambition)\n• **Rahu Mahadasha** — 18 years (transformation)\n• **Jupiter Mahadasha** — 16 years (wisdom, growth)\n• **Saturn Mahadasha** — 19 years (discipline, karma)\n• **Mercury Mahadasha** — 17 years (intellect, business)\n• **Ketu Mahadasha** — 7 years (spirituality)\n• **Venus Mahadasha** — 20 years (love, luxury)\n\nShare your birth details to find your current Dasha period.",
    ],
    'remedy': [
        "Vedic astrology offers powerful remedies (Upayas) to balance planetary energies:\n\n**Mantras** — Chanting specific planetary mantras\n**Gemstones** — Wearing planetary gemstones\n**Yantras** — Sacred geometric diagrams\n**Puja** — Ritual worship and offerings\n**Charity** — Donating items associated with afflicted planets\n**Fasting** — On specific days for each planet\n\nThe most effective remedy depends on your specific planetary afflictions. Please share your birth details or consult one of our expert astrologers for personalized remedies.",
    ],
    'default': [
        "Namaste! I'm AstroAI, your Vedic astrology guide. I can help you with:\n\n🌟 **Birth Chart Analysis** — Understand your planetary positions\n💕 **Love & Relationships** — Compatibility and Kundali matching\n💼 **Career Guidance** — Find your dharmic path\n💰 **Financial Forecast** — Wealth and prosperity insights\n🏥 **Health Guidance** — Planetary health remedies\n💎 **Gemstone Recommendations** — Based on your chart\n🔮 **Dasha Periods** — Current planetary cycles\n\nFor the most accurate and personalized readings, please share your **date of birth, time of birth, and place of birth**.\n\nWhat would you like to explore today?",
        "I'm here to guide you through the wisdom of Vedic astrology. The stars hold profound insights about your life's journey. To give you the most accurate guidance, could you share your birth details (date, time, and place of birth)? This allows me to analyze your specific planetary positions and provide personalized insights.",
    ],
}


def _get_fallback_response(messages: list, user_context: dict) -> tuple[str, int]:
    """
    Rule-based Vedic astrology response engine.
    Matches keywords in the last user message to relevant responses.
    """
    last_message = ''
    for msg in reversed(messages):
        if msg.get('role') == 'user':
            last_message = msg.get('content', '').lower()
            break

    # Build context prefix if we have birth chart data
    context_prefix = ''
    if user_context.get('sun_sign'):
        context_prefix = (
            f"I can see from your birth chart that your Sun is in **{user_context['sun_sign'].capitalize()}**, "
            f"Moon in **{user_context.get('moon_sign', '').capitalize() or 'unknown'}**, "
            f"and Ascendant in **{user_context.get('ascendant', '').capitalize() or 'unknown'}**.\n\n"
        )

    # Keyword matching
    keyword_map = [
        (['career', 'job', 'work', 'profession', 'business', 'success'], 'career'),
        (['love', 'romance', 'relationship', 'partner', 'boyfriend', 'girlfriend', 'crush'], 'love'),
        (['marriage', 'wedding', 'husband', 'wife', 'spouse', 'kundali match', 'compatibility'], 'marriage'),
        (['health', 'disease', 'illness', 'sick', 'body', 'medical'], 'health'),
        (['money', 'finance', 'wealth', 'income', 'investment', 'financial', 'rich'], 'finance'),
        (['birth chart', 'kundali', 'horoscope chart', 'natal chart', 'lagna'], 'birth_chart'),
        (['gemstone', 'gem', 'stone', 'crystal', 'ruby', 'sapphire', 'emerald', 'pearl'], 'gemstone'),
        (['nakshatra', 'lunar mansion', 'star'], 'nakshatra'),
        (['dasha', 'mahadasha', 'antardasha', 'period', 'cycle'], 'dasha'),
        (['remedy', 'remedies', 'mantra', 'puja', 'worship', 'yantra', 'upaya'], 'remedy'),
    ]

    category = 'default'
    for keywords, cat in keyword_map:
        if any(kw in last_message for kw in keywords):
            category = cat
            break

    responses = FALLBACK_RESPONSES.get(category, FALLBACK_RESPONSES['default'])
    response_text = random.choice(responses)

    if context_prefix and category != 'default':
        response_text = context_prefix + response_text

    return response_text, 1  # costs 1 token


# ── OpenAI integration ────────────────────────────────────────────────────────

def _get_openai_response(messages: list, user_context: dict) -> tuple[str, int]:
    """Call OpenAI. Raises exception on any failure."""
    from openai import OpenAI

    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        raise ValueError('OPENAI_API_KEY not configured')

    client = OpenAI(api_key=api_key)

    system_content = SYSTEM_PROMPT
    if user_context:
        if user_context.get('sun_sign'):
            system_content += f"\n\nUser's Sun Sign: {user_context['sun_sign'].capitalize()}"
        if user_context.get('moon_sign'):
            system_content += f"\nUser's Moon Sign: {user_context['moon_sign'].capitalize()}"
        if user_context.get('ascendant'):
            system_content += f"\nUser's Ascendant: {user_context['ascendant'].capitalize()}"

    full_messages = [{'role': 'system', 'content': system_content}] + messages

    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=full_messages,
        max_tokens=800,
        temperature=0.7,
    )
    text = response.choices[0].message.content
    tokens = max(1, response.usage.total_tokens // 100)
    return text, tokens


# ── Public interface ──────────────────────────────────────────────────────────

def get_ai_response(messages: list, user_context: dict = None) -> tuple[str, int]:
    """
    Returns (response_text, tokens_used).

    Tries OpenAI first. Falls back to the built-in engine on any error
    (no API key, quota exceeded, network issue, etc.).
    """
    ctx = user_context or {}

    # Try OpenAI
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if api_key:
        try:
            return _get_openai_response(messages, ctx)
        except Exception as e:
            logger.warning('OpenAI unavailable (%s: %s), using fallback engine', type(e).__name__, e)

    # Fallback — always works
    return _get_fallback_response(messages, ctx)
