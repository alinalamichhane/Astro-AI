from rest_framework.permissions import BasePermission


class IsAstrologer(BasePermission):
    """Allows access only to users with role='astrologer'."""
    message = 'Only registered astrologers can access this.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'astrologer'
        )
