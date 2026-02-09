"""Service exports."""

from services.auth import (
    AuthServiceError,
    get_user_profile,
    login_user,
    register_user,
    send_password_reset,
    update_password,
    verify_access_token,
)
from services.users import (
    UserServiceError,
    assign_coaches_to_user,
    create_user,
    deactivate_user,
    get_admin_overview,
    get_user_detail,
    list_users,
    remove_coach_assignment,
    update_user,
)

__all__ = [
    "AuthServiceError",
    "get_user_profile",
    "login_user",
    "register_user",
    "send_password_reset",
    "update_password",
    "verify_access_token",
    "UserServiceError",
    "list_users",
    "get_user_detail",
    "create_user",
    "update_user",
    "deactivate_user",
    "assign_coaches_to_user",
    "remove_coach_assignment",
    "get_admin_overview",
]
