from rest_framework.permissions import BasePermission


class IsRegularUser(BasePermission):
    """Blocks astrologers from accessing user-only features."""
    message = 'Astrologers cannot use this feature. Please use your Astrologer Portal.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'user'
        )
