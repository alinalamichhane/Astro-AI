# AstroAI - The All-in-One Astrology Platform

**AstroAI** is a comprehensive astrology platform that combines AI-powered insights, professional astrologer consultations, e-learning, and a marketplace for spiritual products. Built with Django REST Framework and powered by OpenAI GPT-4.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

### 🔮 Core Astrology Features
- **Birth Chart Generation** - Vedic astrology charts using Swiss Ephemeris
- **Daily/Weekly/Monthly Horoscopes** - Personalized predictions for all zodiac signs
- **Kundali Matching** - Compatibility analysis for relationships
- **Planetary Transits** - Track major astrological events

### 🤖 AI-Powered Chat
- GPT-4o-mini powered astrology assistant
- Token-based usage system
- Personalized responses based on user's birth chart
- Session management with conversation history

### 👨‍🏫 Astrologer Consultations
- Browse verified astrologers by specialization
- Book chat/video/phone consultations
- Rating and review system
- Flexible availability scheduling

### 🛒 Marketplace
- Gemstones, crystals, and spiritual products
- Zodiac-based product recommendations
- Order management system
- Multi-currency support (NPR/USD)

### 📚 E-Learning Platform
- Astrology courses with video lessons
- Progress tracking and certificates
- Free preview lessons
- Enrollment management

### 💳 Subscription Plans
- 4 tiers: Token Pack, Basic, Premium, VIP
- Stripe payment integration
- AI token allocation
- Recurring billing support

---

## 🛠 Tech Stack

**Backend:**
- Django 6.0
- Django REST Framework 3.17
- PostgreSQL 18
- JWT Authentication (Simple JWT)

**Astrology Engine:**
- PySwisseph (Swiss Ephemeris)

**AI:**
- OpenAI GPT-4o-mini

**Payments:**
- Stripe

**Optional:**
- Redis (caching, Celery, Channels)
- Celery (background tasks)
- Channels (WebSocket support)

---

## 📁 Project Structure

```
Astro-AI/
├── apps/
│   ├── users/              # User authentication & profiles
│   ├── horoscope/          # Birth charts, horoscopes, Kundali
│   ├── astrologers/        # Astrologer profiles & consultations
│   ├── chat/               # AI chat sessions
│   ├── subscriptions/      # Plans, payments, Stripe
│   ├── marketplace/        # Products, orders, categories
│   └── courses/            # E-learning, lessons, enrollments
├── config/
│   ├── settings.py         # Django settings
│   ├── urls.py             # URL routing
│   ├── wsgi.py             # WSGI config
│   └── asgi.py             # ASGI config (WebSocket)
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
├── manage.py               # Django management script
└── README.md               # This file
```

---

## 🚀 Installation

### Prerequisites

- Python 3.12+
- pip
- Virtual environment (recommended)
- PostgreSQL 14+

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Astro-AI
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up PostgreSQL Database

Make sure PostgreSQL is installed and running:
```bash
pg_isready   # should say "accepting connections"
```

Set the postgres user password and create the database:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'alina';"
sudo -u postgres psql -c "CREATE DATABASE astro_ai;"
```

The `.env` is already configured to connect with:
```
DATABASE_URL=postgresql://postgres:alina@localhost:5432/astro_ai
```

### Step 5: Configure Environment Variables

Edit `.env` with your actual API keys (see [Configuration](#configuration) section).

### Step 6: Run Migrations

```bash
python manage.py migrate
```

### Step 7: Create Superuser

```bash
python manage.py createsuperuser
```

### Step 8: Seed Initial Data

```bash
python manage.py seed_plans              # Creates the 4 subscription plans
python manage.py generate_horoscopes --all-periods   # Seeds today's horoscopes for all 12 signs
```

### Step 9: Start the Task Scheduler (Celery)

Horoscopes auto-generate daily, weekly, and monthly via Celery Beat.

Make sure Redis is running:
```bash
sudo systemctl start redis-server
redis-cli ping   # should return PONG
```

Open two extra terminals and run:

**Terminal 3 — Celery worker:**
```bash
celery -A config worker --loglevel=info
```

**Terminal 4 — Celery beat (scheduler):**
```bash
celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Schedule summary:
- Daily horoscopes → every day at 00:05 UTC
- Weekly horoscopes → every Monday at 00:10 UTC
- Monthly horoscopes → 1st of every month at 00:15 UTC

### Step 9: Set Up Frontend

```bash
cd frontend
npm install
```

To run the frontend dev server:
```bash
npm run dev   # runs on http://localhost:3000
```

To build for production:
```bash
npm run build
```

---

## ⚙️ Configuration

### Required Environment Variables

Edit `.env` file with the following:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database - PostgreSQL
DATABASE_URL=postgresql://postgres:alina@localhost:5432/astro_ai

# OpenAI (REQUIRED for AI chat)
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=AstroAI <noreply@astroai.com>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: Redis (for caching, Celery, Channels)
REDIS_URL=redis://localhost:6379/0
```

### Getting API Keys

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and navigate to API Keys
3. Generate a new secret key

**Khalti (Nepal - recommended):**
1. Register as merchant at [test-admin.khalti.com](https://test-admin.khalti.com) (sandbox)
2. Get your `live_secret_key` from the dashboard
3. For production: [admin.khalti.com](https://admin.khalti.com)
4. Set `KHALTI_IS_LIVE=True` in `.env` for production

**eSewa (Nepal):**
1. Register at [developer.esewa.com.np](https://developer.esewa.com.np)
2. Sandbox defaults are already set in `.env` (`EPAYTEST` / `8gBm/:&EnhH.1/q`)
3. For production: get your `ESEWA_SECRET_KEY` and `ESEWA_PRODUCT_CODE` from eSewa merchant portal
4. Set `ESEWA_IS_LIVE=True` in `.env` for production

**Stripe (International/USD):**
1. Go to [stripe.com](https://stripe.com)
2. Create an account
3. Get test keys from Dashboard → Developers → API Keys

---

## 🏃 Running the Project

### Running the Project

**Backend (Terminal 1):**
```bash
python manage.py runserver
# API available at http://localhost:8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# UI available at http://localhost:3000
```

### Access Points

- **Admin Panel:** `http://localhost:8000/admin/`
- **API Docs (Swagger):** `http://localhost:8000/api/docs/`
- **API Docs (ReDoc):** `http://localhost:8000/api/redoc/`
- **API Schema:** `http://localhost:8000/api/schema/`

### Running with Gunicorn (Production)

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

---

## 📚 API Documentation

### Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

### Main API Endpoints

#### Authentication (`/api/v1/auth/`)
- `POST /register/` - Register new user
- `POST /login/` - Login (get JWT tokens)
- `POST /token/refresh/` - Refresh access token
- `POST /logout/` - Logout (blacklist token)
- `GET /profile/` - Get user profile
- `PUT /profile/` - Update user profile
- `POST /change-password/` - Change password

#### Astrology (`/api/v1/astrology/`)
- `GET /birth-chart/` - Get user's birth chart
- `POST /birth-chart/` - Generate birth chart
- `GET /horoscope/?sign=aries&period=daily` - Get horoscope
- `GET /horoscope/personalized/` - Get personalized horoscope
- `GET /kundali-match/` - List Kundali matches
- `POST /kundali-match/` - Create Kundali match
- `GET /transits/` - Get planetary transits

#### AI Chat (`/api/v1/chat/`)
- `GET /sessions/` - List chat sessions
- `GET /sessions/{id}/` - Get session details
- `POST /send/` - Send message to AI
- `DELETE /sessions/{id}/delete/` - Delete session

#### Astrologers (`/api/v1/astrologers/`)
- `GET /` - List astrologers
- `GET /{id}/` - Get astrologer details
- `POST /book/` - Book consultation
- `GET /consultations/` - My consultations
- `POST /consultations/{id}/review/` - Review consultation

#### Subscriptions & Payments (`/api/v1/subscriptions/`)
- `GET /plans/` - List subscription plans (with NPR + USD prices)
- `POST /initiate/` - Initiate payment (choose gateway: `khalti`, `esewa`, `stripe`)
- `GET /callback/khalti/` - Khalti payment callback (Khalti redirects here)
- `GET /callback/esewa/` - eSewa payment callback (eSewa redirects here)
- `POST /callback/stripe/` - Stripe confirmation (frontend calls after Stripe.js)
- `GET /my/` - My subscriptions
- `GET /payments/` - Payment history

### Payment Gateway Flow

#### Khalti (NPR)
```
1. POST /initiate/  { plan_id, gateway: "khalti" }
   → Returns: { payment_url, pidx }
2. Redirect user to payment_url
3. User pays on Khalti portal
4. Khalti redirects to: /callback/khalti/?pidx=...&purchase_order_id=...
5. Backend verifies with Khalti server → activates subscription
```

#### eSewa (NPR)
```
1. POST /initiate/  { plan_id, gateway: "esewa" }
   → Returns: { payment_url, form_fields }
2. Frontend renders a form and auto-submits to payment_url
3. User pays on eSewa portal
4. eSewa redirects to: /callback/esewa/?data=<base64>
5. Backend decodes + verifies HMAC signature → activates subscription
```

#### Stripe (USD - International)
```
1. POST /initiate/  { plan_id, gateway: "stripe" }
   → Returns: { client_secret, publishable_key }
2. Frontend uses Stripe.js to collect card and confirm payment
3. POST /callback/stripe/  { transaction_uuid, payment_intent_id }
4. Backend verifies with Stripe → activates subscription
```

#### Marketplace (`/api/v1/marketplace/`)
- `GET /categories/` - List categories
- `GET /products/` - List products
- `GET /products/{slug}/` - Product details
- `POST /orders/` - Create order
- `GET /orders/my/` - My orders

#### Courses (`/api/v1/courses/`)
- `GET /` - List courses
- `GET /{slug}/` - Course details
- `POST /{slug}/enroll/` - Enroll in course
- `GET /my/enrollments/` - My enrollments
- `POST /{slug}/progress/` - Update progress

### Example API Calls

**Register:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Horoscope:**
```bash
curl http://localhost:8000/api/v1/astrology/horoscope/?sign=aries&period=daily
```

---

## 🗄 Database Schema

### Key Models

**User** (`apps.users`)
- Custom user model with birth data (date, time, place, coordinates)
- AI token balance
- Profile fields (avatar, bio, phone, etc.)

**BirthChart** (`apps.horoscope`)
- One-to-one with User
- Stores planetary positions, ascendant, moon sign, sun sign

**Horoscope** (`apps.horoscope`)
- Daily/weekly/monthly predictions
- Zodiac-specific content (love, career, health, finance)

**Astrologer** (`apps.astrologers`)
- Profile, specializations, rates, availability
- Rating system

**Consultation** (`apps.astrologers`)
- Booking system with status tracking
- User reviews

**ChatSession & ChatMessage** (`apps.chat`)
- AI conversation history
- Token usage tracking

**Plan & UserSubscription** (`apps.subscriptions`)
- Subscription tiers
- Stripe integration

**Product & Order** (`apps.marketplace`)
- E-commerce for spiritual products
- Multi-currency support

**Course, Lesson, Enrollment** (`apps.courses`)
- E-learning platform
- Progress tracking

---

## 🚢 Deployment

### Production Checklist

1. **Environment Variables:**
   - Set `DEBUG=False`
   - Generate new `SECRET_KEY`
   - Configure production database (PostgreSQL)
   - Add production domain to `ALLOWED_HOSTS`

2. **Database:**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   python manage.py seed_plans
   ```

3. **Web Server:**
   - Use Gunicorn + Nginx
   - Configure SSL/TLS certificates
   - Set up static/media file serving

4. **Optional Services:**
   - Redis for caching and Celery
   - Celery for background tasks
   - Channels for WebSocket support

### Example Gunicorn + Nginx Setup

**Gunicorn:**
```bash
gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /var/www/Astro-AI/staticfiles/;
    }

    location /media/ {
        alias /var/www/Astro-AI/media/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🧪 Testing

Run tests:
```bash
python manage.py test
```

Check code:
```bash
python manage.py check
```

---

## 📝 Admin Panel Usage

### Adding Content

1. **Astrologers:**
   - Go to Admin → Astrologers → Add Astrologer
   - Link to a user account
   - Set rates, specializations, availability

2. **Products:**
   - Go to Admin → Products → Add Product
   - Set prices in both NPR and USD
   - Add zodiac benefits and healing properties

3. **Courses:**
   - Go to Admin → Courses → Add Course
   - Add lessons with video URLs
   - Mark lessons as preview for free access

4. **Horoscopes:**
   - Go to Admin → Horoscopes → Add Horoscope
   - Generate daily content for all 12 signs
   - Can be automated with Celery tasks

---

## 🔧 Troubleshooting

### Common Issues

**1. Module not found errors:**
```bash
pip install -r requirements.txt --break-system-packages
```

**2. Database errors:**
```bash
python manage.py migrate --run-syncdb
```

**3. Static files not loading:**
```bash
python manage.py collectstatic --clear --noinput
```

**4. OpenAI API errors:**
- Check `OPENAI_API_KEY` in `.env`
- Verify API key is active and has credits

**5. Stripe webhook errors:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook/`

---

## 📞 Support

For issues or questions:
- Check API docs at `/api/docs/`
- Review Django logs
- Check `.env` configuration

---

## 📄 License

This project is proprietary. All rights reserved.

---

## Test eSewa payment:

Select Basic Plan → choose eSewa → Pay
Use test credentials: eSewa ID 9806800001, password Nepal@123, OTP 123456

## 👥 Team

- **Alina Lamichhane** - Senior Software Engineer (6+ years)
- **Amit Poudel** - Project Manager

---

**Built with ❤️ for the astrology community**
