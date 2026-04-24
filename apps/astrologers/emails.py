"""
Email notifications for consultation events.
Falls back silently if email is not configured — never crashes the main flow.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _send(subject, message, recipient):
    """Send a single email, swallowing all errors."""
    if not recipient:
        return
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception as e:
        # Log but never let email failure break the API response
        logger.warning('Email send failed to %s: %s', recipient, e)


def notify_astrologer_new_booking(consultation):
    """Sent to astrologer when a user books a consultation."""
    astrologer_email = consultation.astrologer.user.email
    user_name = consultation.user.get_full_name() or consultation.user.username
    scheduled = timezone.localtime(consultation.scheduled_at).strftime('%B %d, %Y at %H:%M')

    _send(
        subject=f'New Consultation Booking — {user_name}',
        message=(
            f'Hello {consultation.astrologer.display_name},\n\n'
            f'You have a new consultation booking!\n\n'
            f'Client: {user_name} ({consultation.user.email})\n'
            f'Type: {consultation.get_consultation_type_display()}\n'
            f'Scheduled: {scheduled}\n'
            f'Duration: {consultation.duration_minutes} minutes\n'
            f'Amount: {consultation.currency} {consultation.amount}\n'
            f'Notes: {consultation.notes or "None"}\n\n'
            f'Please log in to your Astrologer Portal to confirm or decline:\n'
            f'{settings.FRONTEND_URL}/astrologer/consultations\n\n'
            f'— AstroAI Team'
        ),
        recipient=astrologer_email,
    )


def notify_user_status_change(consultation):
    """Sent to user when astrologer confirms, cancels, or completes a consultation."""
    user_email = consultation.user.email
    astrologer_name = consultation.astrologer.display_name
    scheduled = timezone.localtime(consultation.scheduled_at).strftime('%B %d, %Y at %H:%M')

    STATUS_MESSAGES = {
        'confirmed': (
            f'Great news! Your consultation with {astrologer_name} has been confirmed.',
            f'Your session is scheduled for {scheduled}. Please be ready on time.'
        ),
        'cancelled': (
            f'Your consultation with {astrologer_name} has been cancelled.',
            f'The astrologer was unable to accept your booking. Please book another session.'
        ),
        'completed': (
            f'Your consultation with {astrologer_name} is now complete.',
            f'We hope it was helpful! Please take a moment to leave a review.'
        ),
        'ongoing': (
            f'Your consultation with {astrologer_name} has started.',
            f'Your session is now in progress.'
        ),
    }

    if consultation.status not in STATUS_MESSAGES:
        return

    headline, detail = STATUS_MESSAGES[consultation.status]
    user_name = consultation.user.get_full_name() or consultation.user.username

    _send(
        subject=f'Consultation Update — {headline}',
        message=(
            f'Hello {user_name},\n\n'
            f'{headline}\n\n'
            f'{detail}\n\n'
            f'Astrologer: {astrologer_name}\n'
            f'Scheduled: {scheduled}\n'
            f'Duration: {consultation.duration_minutes} minutes\n\n'
            f'View your consultations:\n'
            f'{settings.FRONTEND_URL}/dashboard/consultations\n\n'
            f'— AstroAI Team'
        ),
        recipient=user_email,
    )
