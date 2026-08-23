"""
User Management & Profile Router.
Syncs authenticated users (Google Auth, Email/Password, Guest Demo) into Google Cloud Firestore.
"""
from __future__ import annotations
import logging
from typing import Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from firestore_db import save_user_profile_firestore, get_user_profile_firestore, is_firestore_active

log = logging.getLogger("market-app")
router = APIRouter()


class UserSyncPayload(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    isGuest: Optional[bool] = False
    createdAt: Optional[str] = None


@router.post("/users/sync")
def sync_user_profile(payload: UserSyncPayload):
    """Sync user session data to Google Cloud Firestore 'users' collection."""
    user_dict = payload.model_dump()
    saved = save_user_profile_firestore(user_dict)
    return {
        "status": "synced" if saved else "fallback_saved",
        "uid": payload.uid,
        "firestore_active": is_firestore_active(),
    }


@router.get("/users/{uid}")
def get_user_profile(uid: str):
    """Retrieve user metadata from Firestore."""
    profile = get_user_profile_firestore(uid)
    if profile:
        return profile
    return {
        "uid": uid,
        "status": "active",
        "firestore_active": is_firestore_active(),
    }
