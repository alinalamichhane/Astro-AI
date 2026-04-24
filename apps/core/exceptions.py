"""
Global DRF exception handler.
Normalises ALL error responses to a consistent shape:

  { "error": "Human-readable message", "code": "snake_case_code", "details": {...} }

This means the frontend only ever needs to read `error` for the message.
"""
import logging
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    APIException, AuthenticationFailed, NotAuthenticated,
    PermissionDenied as DRFPermissionDenied, ValidationError,
    NotFound, MethodNotAllowed, Throttled,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def _first_message(detail):
    """Recursively extract the first human-readable string from DRF detail."""
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        return _first_message(detail[0]) if detail else 'Unknown error'
    if isinstance(detail, dict):
        first_val = next(iter(detail.values()), 'Unknown error')
        return _first_message(first_val)
    return str(detail)


def _flatten_errors(detail):
    """Flatten nested DRF validation errors into {field: [messages]} dict."""
    if isinstance(detail, dict):
        result = {}
        for key, value in detail.items():
            if isinstance(value, list):
                result[key] = [str(v) for v in value]
            elif isinstance(value, dict):
                result[key] = _flatten_errors(value)
            else:
                result[key] = [str(value)]
        return result
    if isinstance(detail, list):
        return {'non_field_errors': [str(v) for v in detail]}
    return {'non_field_errors': [str(detail)]}


def custom_exception_handler(exc, context):
    """
    Custom exception handler that wraps all errors in a consistent format.
    """
    # Let DRF handle it first so we get the response object
    response = drf_exception_handler(exc, context)

    # Map Django core exceptions to DRF equivalents
    if response is None:
        if isinstance(exc, Http404):
            exc = NotFound()
            response = Response(status=status.HTTP_404_NOT_FOUND)
        elif isinstance(exc, PermissionDenied):
            exc = DRFPermissionDenied()
            response = Response(status=status.HTTP_403_FORBIDDEN)
        elif isinstance(exc, DjangoValidationError):
            exc = ValidationError(detail=exc.message_dict if hasattr(exc, 'message_dict') else exc.messages)
            response = Response(status=status.HTTP_400_BAD_REQUEST)
        else:
            # Unhandled server error — log it, return generic 500
            logger.exception('Unhandled server error in %s', context.get('view'))
            return Response(
                {'error': 'An unexpected server error occurred. Please try again later.',
                 'code': 'server_error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Build normalised payload
    detail = getattr(exc, 'detail', str(exc))
    message = _first_message(detail)

    payload = {
        'error': message,
        'code': _get_code(exc),
    }

    # For validation errors, include field-level details so the frontend
    # can highlight specific form fields
    if isinstance(exc, ValidationError) and isinstance(detail, dict):
        payload['details'] = _flatten_errors(detail)

    response.data = payload
    return response


def _get_code(exc):
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return 'authentication_failed'
    if isinstance(exc, DRFPermissionDenied):
        return 'permission_denied'
    if isinstance(exc, NotFound):
        return 'not_found'
    if isinstance(exc, ValidationError):
        return 'validation_error'
    if isinstance(exc, MethodNotAllowed):
        return 'method_not_allowed'
    if isinstance(exc, Throttled):
        return 'throttled'
    code = getattr(getattr(exc, 'detail', None), 'code', None)
    return str(code) if code else 'error'
