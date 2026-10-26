import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Set
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from config import settings
from sajag_models import UserRole

# Standard SAJAG Auth Constants
SAJAG_ISSUER = "sajag-welfare-auth"
SAJAG_AUDIENCE = "sajag-monitoring-api"

# HTTP Bearer Auth Scheme (Deny-by-default, explicit 401 on missing)
security_bearer = HTTPBearer(auto_error=False)

# In-memory revocation cache for active sessions
REVOKED_TOKENS: Set[str] = set()


class AuthenticatedUser(BaseModel):
    """
    Verified server-side user context extracted from cryptographically verified JWT claims.
    """
    id: str
    service_id: str
    name: str
    role: UserRole
    unit: str
    rank: str = "Constable"
    is_active: bool = True


def create_sajag_token(
    user_id: str,
    service_id: str,
    role: UserRole,
    unit: str,
    name: str,
    rank: str = "Constable",
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Generates a cryptographically signed JWT with mandatory SAJAG security claims.
    """
    now = datetime.now(timezone.utc)
    expires = now + (expires_delta or timedelta(hours=24))
    
    role_str = role.value if isinstance(role, UserRole) else str(role)
    payload = {
        "sub": user_id,
        "service_id": service_id,
        "role": role_str,
        "unit": unit,
        "name": name,
        "rank": rank,
        "iss": SAJAG_ISSUER,
        "aud": SAJAG_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def revoke_token(token: str) -> None:
    """
    Adds a token to the revoked cache to support immediate session revocation.
    """
    REVOKED_TOKENS.add(token)


async def get_current_sajag_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> AuthenticatedUser:
    """
    Server-side authentication dependency.
    Validates token presence, signature, expiration, audience, issuer, required claims,
    and revocation status.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    if token in REVOKED_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer=SAJAG_ISSUER,
            audience=SAJAG_AUDIENCE
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.JWTClaimsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token claims: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature or malformed token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Enforce presence of mandatory claims
    required_claims = ["sub", "role", "service_id", "unit"]
    for claim in required_claims:
        if claim not in payload or not payload[claim]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Malformed token: missing mandatory authorization claim '{claim}'",
                headers={"WWW-Authenticate": "Bearer"}
            )

    role_val = payload["role"]
    try:
        user_role = UserRole(role_val)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown or invalid role claim '{role_val}'",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return AuthenticatedUser(
        id=payload["sub"],
        service_id=payload["service_id"],
        name=payload.get("name", "Unknown Officer"),
        role=user_role,
        unit=payload["unit"],
        rank=payload.get("rank", "Constable"),
        is_active=True
    )


def require_role(*allowed_roles: UserRole):
    """
    Role-checking dependency factory implementing least privilege and deny-by-default.
    """
    async def role_checker(
        current_user: AuthenticatedUser = Depends(get_current_sajag_user)
    ) -> AuthenticatedUser:
        if current_user.role not in allowed_roles:
            allowed_str = ", ".join(r.value for r in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of roles: [{allowed_str}]. Authenticated role is '{current_user.role.value}'."
            )
        return current_user
    return role_checker


def verify_personnel_ownership(current_user: AuthenticatedUser, target_personnel_id: str) -> None:
    """
    Cross-person access guard:
    Ensures PERSONNEL role cannot read or submit data for any other officer.
    """
    if current_user.role == UserRole.PERSONNEL and current_user.id != target_personnel_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-personnel access violation: You are not authorized to view or modify records for another personnel."
        )


def verify_unit_jurisdiction(current_user: AuthenticatedUser, target_unit: str) -> None:
    """
    Unit boundary guard:
    Ensures Welfare Officers can only review cases within their assigned battalion/unit.
    """
    if current_user.role == UserRole.WELFARE_OFFICER:
        if current_user.unit != target_unit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unit boundary violation: Officer from unit '{current_user.unit}' cannot access records belonging to unit '{target_unit}'."
            )
