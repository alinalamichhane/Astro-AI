"""
Utility command to check or change a user's role.

Usage:
    python manage.py set_role --list
    python manage.py set_role --email user@example.com
    python manage.py set_role --email user@example.com --role astrologer
    python manage.py set_role --email user@example.com --role user
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Check or change a user role (user / astrologer)'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='User email')
        parser.add_argument('--role', type=str, choices=['user', 'astrologer'],
                            help='New role to assign')
        parser.add_argument('--list', action='store_true', help='List all users and their roles')

    def handle(self, *args, **options):
        if options['list']:
            users = User.objects.all().order_by('id')
            self.stdout.write(f'\n{"ID":<5} {"Email":<40} {"Role":<12} {"Verified":<10}')
            self.stdout.write('-' * 70)
            for u in users:
                has_profile = hasattr(u, 'astrologer_profile')
                self.stdout.write(
                    f'{u.id:<5} {u.email:<40} {u.role:<12} '
                    f'{"✓ profile" if has_profile else ""}'
                )
            return

        email = options.get('email')
        if not email:
            self.stdout.write(self.style.ERROR('Provide --email or --list'))
            return

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User not found: {email}'))
            return

        new_role = options.get('role')
        if new_role:
            old_role = user.role
            user.role = new_role
            user.save(update_fields=['role'])
            self.stdout.write(self.style.SUCCESS(
                f'Updated {email}: {old_role} → {new_role}'
            ))
        else:
            # Just show current info
            has_profile = hasattr(user, 'astrologer_profile')
            self.stdout.write(f'\nUser: {user.email}')
            self.stdout.write(f'Role: {user.role}')
            self.stdout.write(f'Astrologer profile: {"Yes" if has_profile else "No"}')
            if has_profile:
                p = user.astrologer_profile
                self.stdout.write(f'  Display name: {p.display_name}')
                self.stdout.write(f'  Verified: {p.is_verified}')
