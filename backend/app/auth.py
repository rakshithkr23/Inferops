import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from itsdangerous import (
    BadSignature,
    SignatureExpired,
    URLSafeTimedSerializer,
)
from pwdlib import PasswordHash
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegistration

auth_router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
COOKIE_NAME = "inferops_session"

SESSION_MAX_AGE = 7 * 24 * 60 * 60

password_hash = PasswordHash.recommended()


class GoogleLoginRequest(BaseModel):
    credential: str


def get_session_serializer():
    secret = os.getenv("AUTH_SESSION_SECRET")

    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Authentication session secret is not configured.",
        )

    return URLSafeTimedSerializer(
        secret,
        salt="inferops-auth-session",
    )


def verify_google_token(token: str):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google authentication is not configured.",
        )

    try:
        return id_token.verify_oauth2_token(
            token,
            GoogleRequest(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google identity token.",
        ) from exc


def set_session_cookie(response: Response, value: str, max_age: int):
    response.set_cookie(
        key=COOKIE_NAME,
        value=value,
        max_age=max_age,
        httponly=True,
        secure=os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


def create_local_session(user: User, response: Response):
    serializer = get_session_serializer()

    token = serializer.dumps({
        "user_id": user.id,
    })

    set_session_cookie(
        response,
        f"local.{token}",
        SESSION_MAX_AGE,
    )



def register_user_response(user):
    connected_methods = []

    if user.phone_number and user.password_hash:
        connected_methods.append("phone")

    if user.email and user.password_hash:
        connected_methods.append("email")

    if user.google_sub:
        connected_methods.append("google")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "email": user.email,
        "created_at": user.created_at,
        "connected_methods": connected_methods,
    }

@auth_router.post("/auth/register", status_code=201)
def register_user(
    payload: UserRegistration,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()
    phone_number = payload.phone_number.strip()

    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email address is already registered.",
        )

    existing_phone = db.query(User).filter(
        User.phone_number == phone_number
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=409,
            detail="Phone number is already registered.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        phone_number=phone_number,
        email=email,
        password_hash=password_hash.hash(payload.password),
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email address or phone number is already registered.",
        )

    return {
        "message": "Registration successful.",
        "user": register_user_response(user),
    }


@auth_router.post("/auth/login")
def login_user(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    identifier = payload.identifier.strip()

    if "@" in identifier:
        user = db.query(User).filter(
            User.email == identifier.lower()
        ).first()
    else:
        user = db.query(User).filter(
            User.phone_number == identifier
        ).first()

    if (
        not user
        or not user.password_hash
        or not password_hash.verify(
            payload.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid phone/email or password.",
        )

    create_local_session(user, response)

    return {
        "authenticated": True,
        "user": register_user_response(user),
    }


@auth_router.post("/auth/google")
def google_login(
    payload: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    google_user = verify_google_token(payload.credential)

    google_sub = google_user.get("sub")
    email = google_user.get("email", "").strip().lower()
    full_name = google_user.get("name") or "InferOps User"

    if not google_sub or not email:
        raise HTTPException(
            status_code=401,
            detail="Google account information is incomplete.",
        )

    if google_user.get("email_verified") is not True:
        raise HTTPException(
            status_code=401,
            detail="Google email address is not verified.",
        )

    user = db.query(User).filter(
        User.google_sub == google_sub
    ).first()

    if user:
        create_local_session(user, response)

        return {
            "authenticated": True,
            "user": register_user_response(user),
        }
    if not user:
        existing_email = db.query(User).filter(
            User.email == email
        ).first()

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this email already exists. "
                "Sign in using your existing account before linking Google."
            ),
        )

    # Create a Google-only account.
    user = User(
        full_name=full_name,
        email=email,
        google_sub=google_sub,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This Google account is already registered.",
        )

    create_local_session(user, response)

    return {
        "authenticated": True,
        "user": register_user_response(user),
    }


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if token.startswith("local."):
        serializer = get_session_serializer()

        try:
            session_data = serializer.loads(
                token[6:],
                max_age=SESSION_MAX_AGE,
            )
        except (BadSignature, SignatureExpired) as exc:
            raise HTTPException(
                status_code=401,
                detail="Session expired or invalid.",
            ) from exc

        user = db.query(User).filter(
            User.id == session_data["user_id"]
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found.",
            )

        return user

    return verify_google_token(token)

@auth_router.post("/auth/google/link")
def link_google_account(
    payload: GoogleLoginRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not isinstance(current_user, User):
        raise HTTPException(
            status_code=401,
            detail="Please sign in to your InferOps account first.",
        )

    google_user = verify_google_token(payload.credential)

    google_sub = google_user.get("sub")
    google_email = google_user.get("email", "").strip().lower()

    if not google_sub or not google_email:
        raise HTTPException(
            status_code=401,
            detail="Google account information is incomplete.",
        )

    if google_user.get("email_verified") is not True:
        raise HTTPException(
            status_code=401,
            detail="Google email address is not verified.",
        )

    if google_email != current_user.email.lower():
        raise HTTPException(
            status_code=409,
            detail="Google email must match your InferOps account email.",
        )

    existing_link = db.query(User).filter(
        User.google_sub == google_sub
    ).first()

    if existing_link and existing_link.id != current_user.id:
        raise HTTPException(
            status_code=409,
            detail="This Google account is linked to another account.",
        )

    if current_user.google_sub and current_user.google_sub != google_sub:
        raise HTTPException(
            status_code=409,
            detail="Another Google account is already linked.",
        )

    current_user.google_sub = google_sub

    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unable to link this Google account.",
        )

    return {
        "message": "Google account linked successfully.",
        "user": register_user_response(current_user),
    }

@auth_router.get("/auth/me")
def get_logged_in_user(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request, db)

    if isinstance(user, User):
        return {
            "authenticated": True,
            "user": register_user_response(user),
        }

    return {
        "authenticated": True,
        "user": {
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
        },
    }


@auth_router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )

    return {
        "authenticated": False,
        "message": "Logged out successfully.",
    }
