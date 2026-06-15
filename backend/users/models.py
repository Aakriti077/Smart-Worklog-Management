# Custom User model — replaces Django's default User
# Uses email as the login field instead of username

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    # Creates a regular user with hashed password
    def create_user(self, email, name, password, role='employee', department=None):
        user = self.model(email=self.normalize_email(email), name=name, role=role, department=department)
        user.set_password(password)  # Hashes the password before saving
        user.save(using=self._db)
        return user

    # Creates an admin user with full system access
    def create_superuser(self, email, name, password):
        user = self.create_user(email, name, password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('employee', 'Employee'), ('manager', 'Manager'), ('admin', 'Admin')]

    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')

    # Optional link to a department — if department is deleted, user stays (SET_NULL)
    department = models.ForeignKey(
        'departments.Department', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='members'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    # Use email to login instead of the default username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'  # Maps to the existing 'users' table in PostgreSQL

    def __str__(self):
        return f'{self.name} ({self.role})'
