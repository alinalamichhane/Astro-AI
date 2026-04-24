"""
Ashtakoot (8-factor) Kundali Matching Engine
Based on traditional Vedic astrology Nakshatra-based compatibility.

The 8 Kootas and their max points:
  1. Varna    — 1 pt  — Spiritual/ego compatibility
  2. Vashya   — 2 pts — Dominance/attraction
  3. Tara     — 3 pts — Destiny/health
  4. Yoni     — 4 pts — Physical/sexual compatibility
  5. Graha Maitri — 5 pts — Mental/intellectual compatibility
  6. Gana     — 6 pts — Temperament/nature
  7. Bhakoot  — 7 pts — Love/prosperity/health
  8. Nadi     — 8 pts — Health/progeny (most important)
  Total: 36 points
"""

# 27 Nakshatras in order
NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

# Each Nakshatra spans 13°20' (800 arcminutes). 360° / 27 = 13.333°
NAKSHATRA_SPAN = 360 / 27  # 13.333...

# Nakshatra lords (ruling planets) in order
NAKSHATRA_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',  # 1-9
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',  # 10-18
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',  # 19-27
]

# Varna (caste/spiritual level) for each Nakshatra (0=Brahmin,1=Kshatriya,2=Vaishya,3=Shudra)
NAKSHATRA_VARNA = [
    1, 3, 1, 0, 2, 3, 0, 0, 3, 1, 2, 2,
    2, 1, 2, 1, 1, 3, 1, 2, 2, 0, 1, 3,
    0, 0, 0,
]
VARNA_NAMES = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra']

# Gana (temperament) for each Nakshatra (0=Deva/Divine, 1=Manushya/Human, 2=Rakshasa/Demon)
NAKSHATRA_GANA = [
    0, 2, 2, 0, 1, 2, 0, 0, 2, 2, 1, 0,
    0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2,
    1, 0, 0,
]
GANA_NAMES = ['Deva (Divine)', 'Manushya (Human)', 'Rakshasa (Demon)']

# Nadi (energy channel) for each Nakshatra (0=Aadi/Vata, 1=Madhya/Pitta, 2=Antya/Kapha)
NAKSHATRA_NADI = [
    0, 0, 0, 1, 1, 1, 2, 2, 2,
    0, 0, 0, 1, 1, 1, 2, 2, 2,
    0, 0, 0, 1, 1, 1, 2, 2, 2,
]
NADI_NAMES = ['Aadi (Vata)', 'Madhya (Pitta)', 'Antya (Kapha)']

# Yoni (animal symbol) for each Nakshatra
NAKSHATRA_YONI = [
    'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog',
    'Cat', 'Sheep', 'Cat', 'Rat', 'Rat', 'Cow',
    'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
    'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse',
    'Lion', 'Cow', 'Elephant',
]

# Friendly Yoni pairs (score 4), neutral (2), enemy (0)
YONI_FRIENDLY = {
    ('Horse', 'Horse'), ('Elephant', 'Elephant'), ('Sheep', 'Sheep'),
    ('Serpent', 'Serpent'), ('Dog', 'Dog'), ('Cat', 'Cat'),
    ('Rat', 'Rat'), ('Cow', 'Cow'), ('Buffalo', 'Buffalo'),
    ('Tiger', 'Tiger'), ('Deer', 'Deer'), ('Monkey', 'Monkey'),
    ('Lion', 'Lion'), ('Mongoose', 'Mongoose'),
}
YONI_ENEMY = {
    frozenset({'Horse', 'Buffalo'}), frozenset({'Elephant', 'Lion'}),
    frozenset({'Sheep', 'Monkey'}), frozenset({'Serpent', 'Mongoose'}),
    frozenset({'Dog', 'Deer'}), frozenset({'Cat', 'Rat'}),
    frozenset({'Cow', 'Tiger'}),
}

# Graha Maitri — planetary friendship table
PLANET_FRIENDS = {
    'Sun':     ['Moon', 'Mars', 'Jupiter'],
    'Moon':    ['Sun', 'Mercury'],
    'Mars':    ['Sun', 'Moon', 'Jupiter'],
    'Mercury': ['Sun', 'Venus'],
    'Jupiter': ['Sun', 'Moon', 'Mars'],
    'Venus':   ['Mercury', 'Saturn'],
    'Saturn':  ['Mercury', 'Venus'],
    'Rahu':    ['Venus', 'Saturn'],
    'Ketu':    ['Mars', 'Venus', 'Saturn'],
}
PLANET_ENEMIES = {
    'Sun':     ['Venus', 'Saturn'],
    'Moon':    ['Rahu', 'Ketu'],
    'Mars':    ['Mercury'],
    'Mercury': ['Moon'],
    'Jupiter': ['Mercury', 'Venus'],
    'Venus':   ['Sun', 'Moon'],
    'Saturn':  ['Sun', 'Moon', 'Mars'],
    'Rahu':    ['Sun', 'Moon', 'Mars'],
    'Ketu':    ['Sun', 'Moon', 'Mercury'],
}


def get_nakshatra(moon_longitude: float) -> int:
    """Return 0-based Nakshatra index from Moon's longitude."""
    return int(moon_longitude / NAKSHATRA_SPAN) % 27


def get_nakshatra_name(moon_longitude: float) -> str:
    return NAKSHATRAS[get_nakshatra(moon_longitude)]


def _planet_relation(p1: str, p2: str) -> str:
    """Returns 'friend', 'neutral', or 'enemy'."""
    if p2 in PLANET_FRIENDS.get(p1, []):
        return 'friend'
    if p2 in PLANET_ENEMIES.get(p1, []):
        return 'enemy'
    return 'neutral'


def calculate_ashtakoot(user_chart: dict, partner_chart: dict) -> dict:
    """
    Calculate all 8 Ashtakoot factors.
    Returns a dict with per-factor scores, descriptions, and total.
    """
    user_moon_lon = user_chart.get('Moon', {}).get('longitude', 0)
    partner_moon_lon = partner_chart.get('Moon', {}).get('longitude', 0)

    u_nak = get_nakshatra(user_moon_lon)
    p_nak = get_nakshatra(partner_moon_lon)

    u_moon_sign_idx = int(user_moon_lon / 30) % 12
    p_moon_sign_idx = int(partner_moon_lon / 30) % 12

    SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
             'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

    results = {}

    # ── 1. Varna (max 1) ──────────────────────────────────────────────────
    u_varna = NAKSHATRA_VARNA[u_nak]
    p_varna = NAKSHATRA_VARNA[p_nak]
    varna_score = 1 if u_varna <= p_varna else 0
    results['Varna'] = {
        'max': 1, 'score': varna_score,
        'user_value': VARNA_NAMES[u_varna],
        'partner_value': VARNA_NAMES[p_varna],
        'description': 'Spiritual compatibility and ego alignment.',
        'interpretation': 'Compatible' if varna_score == 1 else 'Mismatch in spiritual levels',
    }

    # ── 2. Vashya (max 2) ─────────────────────────────────────────────────
    # Simplified: same sign group = 2, adjacent = 1, else 0
    VASHYA_GROUPS = {
        'Manav': ['Gemini', 'Virgo', 'Libra', 'Aquarius', 'Capricorn'],
        'Vanchar': ['Aries', 'Sagittarius'],
        'Chatushpad': ['Taurus', 'Leo', 'Capricorn'],
        'Jalchar': ['Cancer', 'Pisces', 'Capricorn'],
        'Keeta': ['Scorpio'],
    }
    u_sign = SIGNS[u_moon_sign_idx]
    p_sign = SIGNS[p_moon_sign_idx]
    u_group = next((g for g, signs in VASHYA_GROUPS.items() if u_sign in signs), 'Manav')
    p_group = next((g for g, signs in VASHYA_GROUPS.items() if p_sign in signs), 'Manav')
    vashya_score = 2 if u_group == p_group else 1 if u_sign == p_sign else 0
    results['Vashya'] = {
        'max': 2, 'score': vashya_score,
        'user_value': f'{u_sign} ({u_group})',
        'partner_value': f'{p_sign} ({p_group})',
        'description': 'Mutual attraction and dominance in the relationship.',
        'interpretation': 'Strong attraction' if vashya_score == 2 else 'Moderate' if vashya_score == 1 else 'Low attraction',
    }

    # ── 3. Tara (max 3) ───────────────────────────────────────────────────
    tara = ((p_nak - u_nak + 27) % 27) % 9
    tara_score = 3 if tara in (1, 3, 5, 7) else 1.5 if tara in (2, 6) else 0
    tara_score = int(tara_score)
    TARA_NAMES = {0:'Janma',1:'Sampat',2:'Vipat',3:'Kshema',4:'Pratyak',
                  5:'Sadhana',6:'Naidhana',7:'Mitra',8:'Parama Mitra'}
    results['Tara'] = {
        'max': 3, 'score': tara_score,
        'user_value': NAKSHATRAS[u_nak],
        'partner_value': NAKSHATRAS[p_nak],
        'description': 'Destiny, health, and well-being compatibility.',
        'interpretation': TARA_NAMES.get(tara, 'Unknown'),
    }

    # ── 4. Yoni (max 4) ───────────────────────────────────────────────────
    u_yoni = NAKSHATRA_YONI[u_nak]
    p_yoni = NAKSHATRA_YONI[p_nak]
    if (u_yoni, p_yoni) in YONI_FRIENDLY or (p_yoni, u_yoni) in YONI_FRIENDLY:
        yoni_score = 4
    elif frozenset({u_yoni, p_yoni}) in YONI_ENEMY:
        yoni_score = 0
    else:
        yoni_score = 2
    results['Yoni'] = {
        'max': 4, 'score': yoni_score,
        'user_value': u_yoni,
        'partner_value': p_yoni,
        'description': 'Physical and sexual compatibility.',
        'interpretation': 'Excellent' if yoni_score == 4 else 'Good' if yoni_score == 2 else 'Incompatible',
    }

    # ── 5. Graha Maitri (max 5) ───────────────────────────────────────────
    u_lord = NAKSHATRA_LORDS[u_nak]
    p_lord = NAKSHATRA_LORDS[p_nak]
    u_rel = _planet_relation(u_lord, p_lord)
    p_rel = _planet_relation(p_lord, u_lord)
    if u_rel == 'friend' and p_rel == 'friend':
        gm_score = 5
    elif u_rel == 'friend' or p_rel == 'friend':
        gm_score = 4
    elif u_rel == 'neutral' and p_rel == 'neutral':
        gm_score = 3
    elif u_rel == 'enemy' and p_rel == 'enemy':
        gm_score = 0
    else:
        gm_score = 1
    results['Graha Maitri'] = {
        'max': 5, 'score': gm_score,
        'user_value': f'{u_lord} (lord of {NAKSHATRAS[u_nak]})',
        'partner_value': f'{p_lord} (lord of {NAKSHATRAS[p_nak]})',
        'description': 'Mental compatibility and intellectual harmony.',
        'interpretation': f'{u_lord} & {p_lord}: {u_rel}/{p_rel}',
    }

    # ── 6. Gana (max 6) ───────────────────────────────────────────────────
    u_gana = NAKSHATRA_GANA[u_nak]
    p_gana = NAKSHATRA_GANA[p_nak]
    if u_gana == p_gana:
        gana_score = 6
    elif (u_gana == 0 and p_gana == 1) or (u_gana == 1 and p_gana == 0):
        gana_score = 5
    elif (u_gana == 0 and p_gana == 2) or (u_gana == 2 and p_gana == 0):
        gana_score = 1
    else:
        gana_score = 0
    results['Gana'] = {
        'max': 6, 'score': gana_score,
        'user_value': GANA_NAMES[u_gana],
        'partner_value': GANA_NAMES[p_gana],
        'description': 'Temperament and nature compatibility.',
        'interpretation': 'Same temperament' if u_gana == p_gana else 'Different temperaments',
    }

    # ── 7. Bhakoot (max 7) ────────────────────────────────────────────────
    diff = abs(u_moon_sign_idx - p_moon_sign_idx) + 1
    if diff > 12:
        diff = 25 - diff
    BHAKOOT_GOOD = {1, 3, 5, 7, 9, 11}
    bhakoot_score = 7 if diff in BHAKOOT_GOOD else 0
    results['Bhakoot'] = {
        'max': 7, 'score': bhakoot_score,
        'user_value': u_sign,
        'partner_value': p_sign,
        'description': 'Love, prosperity, and family well-being.',
        'interpretation': f'Moon signs {diff} apart — {"Favorable" if bhakoot_score == 7 else "Unfavorable (Bhakoot Dosha)"}',
    }

    # ── 8. Nadi (max 8) ───────────────────────────────────────────────────
    u_nadi = NAKSHATRA_NADI[u_nak]
    p_nadi = NAKSHATRA_NADI[p_nak]
    nadi_score = 0 if u_nadi == p_nadi else 8
    results['Nadi'] = {
        'max': 8, 'score': nadi_score,
        'user_value': NADI_NAMES[u_nadi],
        'partner_value': NADI_NAMES[p_nadi],
        'description': 'Health, genes, and progeny compatibility. Most important factor.',
        'interpretation': 'Nadi Dosha present — health concerns' if nadi_score == 0 else 'No Nadi Dosha — excellent',
    }

    total = sum(v['score'] for v in results.values())
    pct = round((total / 36) * 100)

    if pct >= 75:
        verdict = 'Excellent Match'
        verdict_color = 'green'
    elif pct >= 60:
        verdict = 'Good Match'
        verdict_color = 'blue'
    elif pct >= 50:
        verdict = 'Average Match'
        verdict_color = 'yellow'
    else:
        verdict = 'Below Average'
        verdict_color = 'red'

    return {
        'total': total,
        'max': 36,
        'percentage': pct,
        'verdict': verdict,
        'verdict_color': verdict_color,
        'user_nakshatra': NAKSHATRAS[u_nak],
        'partner_nakshatra': NAKSHATRAS[p_nak],
        'factors': results,
    }
