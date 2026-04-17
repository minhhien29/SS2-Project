from core.config import supabase_admin


def find_auth_user_by_email(email: str):
    page = 1
    while True:
        users = supabase_admin.auth.admin.list_users(page=page, per_page=200)
        if not users:
            return None

        for user in users:
            if getattr(user, "email", None) == email:
                return user

        if len(users) < 200:
            return None

        page += 1
