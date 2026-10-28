"""Nomad Wanderers API.

Run locally with: uvicorn main:app --reload --port 8000
The temporary admin credentials are username `admin` and password `admin`.
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import logging
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Generic, Literal, TypeVar
from urllib import error as urlerror
from urllib import request as urlrequest

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator
import requests

import db_models
import config
import email_delivery
import whatsapp
import payment_currency


ENV_PATH = Path(__file__).with_name(".env")
TOUR_UPLOADS_PATH = Path(__file__).with_name("uploads") / "tours"
RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"
MAX_TOUR_IMAGE_BYTES = 5 * 1024 * 1024
MAX_TOUR_VIDEO_BYTES = 100 * 1024 * 1024
TOUR_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
TOUR_VIDEO_TYPES = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}

import logging
import sys
from datetime import date, datetime
from decimal import Decimal
LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

if not LOGGER.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(levelname)s - %(name)s - %(message)s"
        )
    )
    LOGGER.addHandler(handler)

LOGGER.propagate = False


LOGGER.warning("========== app STARTED ==========")
LOGGER.info("========== get STARTED ==========")


def load_environment_file() -> None:
    """Load local backend secrets without replacing deployment environment values."""
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_environment_file()
ADMIN_USERNAME = config.ADMIN_USERNAME
ADMIN_PASSWORD = config.ADMIN_PASSWORD
JWT_SECRET = config.JWT_SECRET
JWT_EXPIRY_HOURS = 8
TripType = Literal[
    "Morning trip",
    "Evening trip",
    "Half-day trip",
    "One-day trip",
    "Weekly trip",
    "Multi-day trip",
    "Festival special",
]
ScheduleType = Literal["Daily", "Specific date"]
UserRole = Literal["customer", "admin", "operations", "support"]
BookingStatus = Literal["pending", "confirmed", "cancelled", "completed"]
BookingMode = Literal["Shared", "Private"]
ResponseItem = TypeVar("ResponseItem")


class TourDestination(BaseModel):
    city: str = Field(min_length=2, max_length=80)
    nights: int = Field(default=0, ge=0, le=365)


class ItineraryDay(BaseModel):
    day: int = Field(ge=1, le=365)
    title: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=80)
    overnight_location: str | None = Field(default=None, max_length=80)
    summary: str = Field(default="", max_length=3000)
    transport: list[str] = Field(default_factory=list, max_length=12)
    activities: list[str] = Field(default_factory=list, max_length=20)
    included: list[str] = Field(default_factory=list, max_length=20)
    optional: list[str] = Field(default_factory=list, max_length=20)


class InclusionGroup(BaseModel):
    title: str = Field(min_length=2, max_length=80)
    items: list[str] = Field(default_factory=list, max_length=30)


class TourReviewInput(BaseModel):
    id: int | None = Field(default=None, ge=1)
    name: str = Field(min_length=1, max_length=120)
    rating: int = Field(default=5, ge=1, le=5)
    review_heading: str = Field(default="", max_length=180)
    review_point: str = Field(min_length=1, max_length=10000)
    guide_rating: int = Field(default=5, ge=1, le=5)
    meeting_or_pickup_rating: int = Field(default=5, ge=1, le=5)
    value_for_money_rating: int = Field(default=5, ge=1, le=5)
    date: str | None = Field(default=None, max_length=40)
    source: str = Field(default="", max_length=100)
    link: str | None = Field(default=None, max_length=2048, pattern=r"^https?://")

    @field_validator("name", "review_point")
    @classmethod
    def review_text_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class TourReview(BaseModel):
    id: int
    tour_id: int
    name: str
    rating: int
    review_heading: str
    review_point: str
    guide_rating: int
    meeting_or_pickup_rating: int
    value_for_money_rating: int
    date: str | None
    source: str
    link: str | None
    show_on_home: bool
    tour_name: str | None = None


class PricingTier(BaseModel):
    travellers: int = Field(ge=1, le=500)
    price_per_person: float = Field(gt=0, le=10_000_000)


class DurationPricingOption(BaseModel):
    id: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    duration: str = Field(min_length=2, max_length=80)
    # `duration` remains a human-readable label for existing tours. New admin
    # edits also persist these numeric fields so the duration is never just
    # free-form text.
    duration_value: int | None = Field(default=None, ge=1, le=365)
    duration_unit: Literal["hours", "days"] | None = None
    shared_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    private_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    # Seats are deliberately per duration and tour style. Older tours without
    # these values keep using the tour-level capacity as a compatibility
    # fallback.
    shared_slots: int | None = Field(default=None, ge=1, le=500)
    private_slots: int | None = Field(default=None, ge=1, le=500)
    shared_inclusions: list[str] = Field(default_factory=list, max_length=30)
    private_inclusions: list[str] = Field(default_factory=list, max_length=30)
    shared_meeting_point: str = Field(default="", max_length=300)
    private_meeting_point: str = Field(default="", max_length=300)
    shared_start_meeting_point: str = Field(default="", max_length=300)
    shared_end_meeting_point: str = Field(default="", max_length=300)
    shared_start_meeting_map_url: str | None = Field(default=None, max_length=2048)
    shared_end_meeting_map_url: str | None = Field(default=None, max_length=2048)
    private_start_meeting_point: str = Field(default="", max_length=300)
    private_end_meeting_point: str = Field(default="", max_length=300)
    private_start_meeting_map_url: str | None = Field(default=None, max_length=2048)
    private_end_meeting_map_url: str | None = Field(default=None, max_length=2048)
    shared_departure_date: str | None = None
    private_departure_date: str | None = None
    shared_schedule_type: Literal["Daily", "Specific date"] | None = None
    private_schedule_type: Literal["Daily", "Specific date"] | None = None
    shared_time_slots: list[str] = Field(default_factory=list, max_length=50)
    private_time_slots: list[str] = Field(default_factory=list, max_length=50)
    available_modes: list[BookingMode] = Field(min_length=1, max_length=2)

    @model_validator(mode="after")
    def validate_pricing(self) -> "DurationPricingOption":
        if len(set(self.available_modes)) != len(self.available_modes):
            raise ValueError("Each duration can include Shared and Private only once")
        if (self.duration_value is None) != (self.duration_unit is None):
            raise ValueError("A numeric duration needs both a value and a unit")
        if self.duration_value is not None:
            assert self.duration_unit is not None
            expected_unit = self.duration_unit[:-1] if self.duration_value == 1 else self.duration_unit
            expected_duration = f"{self.duration_value} {expected_unit}"
            if self.duration.strip().casefold() != expected_duration:
                raise ValueError("Duration label must match its numeric value and unit")
        for mode, tiers in (("Shared", self.shared_tiers), ("Private", self.private_tiers)):
            if mode not in self.available_modes:
                continue
            if not tiers:
                raise ValueError(f"{mode} pricing needs at least one group size")
            if len({tier.travellers for tier in tiers}) != len(tiers):
                raise ValueError(f"{mode} pricing cannot repeat a group size")
            slots = self.shared_slots if mode == "Shared" else self.private_slots
            if self.duration_value is not None and slots is None:
                raise ValueError(f"{mode} tours need a numeric number of available slots")
            if slots is not None and max(tier.travellers for tier in tiers) > slots:
                raise ValueError(f"{mode} group size cannot exceed its available slots")
        return self


class TourHighlight(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)


class TourPricing(BaseModel):
    currency: str = Field(default="INR", min_length=3, max_length=3)
    pricing_model: Literal["fixed_per_person", "per_person_by_group_size", "on_request"] = "fixed_per_person"
    tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    shared_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    private_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    available_modes: list[BookingMode] | None = Field(default=None, min_length=1, max_length=2)
    duration_options: list[DurationPricingOption] = Field(default_factory=list, max_length=50)
    time_slot_modes: list[list[BookingMode]] = Field(default_factory=list, max_length=50)
    availability_options: list[dict[str, object]] = Field(default_factory=list, max_length=50)
    inclusion_modes: list[BookingMode] = Field(default_factory=lambda: ["Shared", "Private"], max_length=2)
    inclusion_options: list[dict[str, object]] = Field(default_factory=list, max_length=30)
    capacity_modes: list[BookingMode] = Field(default_factory=lambda: ["Shared", "Private"], max_length=2)
    capacity_options: list[dict[str, object]] = Field(default_factory=list, max_length=50)
    meeting_detail_options: list[dict[str, object]] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def validate_duration_options(self) -> "TourPricing":
        ids = [option.id for option in self.duration_options]
        if len(set(ids)) != len(ids):
            raise ValueError("Each duration option needs a unique id")
        durations = [option.duration.strip().casefold() for option in self.duration_options]
        if len(set(durations)) != len(durations):
            raise ValueError("Each duration option needs a unique duration")
        return self


class TourAvailability(BaseModel):
    booking_type: Literal["Scheduled", "On request", "Private on request"] = "Scheduled"
    min_travellers: int = Field(default=1, ge=1, le=500)
    max_travellers: int = Field(default=20, ge=1, le=500)
    customizable: bool = False


class TourMeetingLocation(BaseModel):
    start_meeting_point: str = Field(default="", max_length=300)
    start_meeting_map_url: str | None = Field(default=None, max_length=2048, pattern=r"^https?://")
    end_meeting_point: str = Field(default="", max_length=300)
    end_meeting_map_url: str | None = Field(default=None, max_length=2048, pattern=r"^https?://")
    modes: list[BookingMode] = Field(default_factory=lambda: ["Shared", "Private"], max_length=2)


class TourInput(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=2000)
    image_url: HttpUrl
    city: str = Field(min_length=2, max_length=80)
    mode: str = Field(min_length=2, max_length=40)
    trip_type: TripType
    category: str = Field(min_length=2, max_length=80)
    duration: str = Field(min_length=2, max_length=80)
    price: float = Field(gt=0, le=10_000_000)
    capacity: int = Field(default=20, ge=1, le=500)
    capacity_modes: list[BookingMode] = Field(default_factory=lambda: ["Shared", "Private"], max_length=2)
    capacity_options: list[dict[str, object]] = Field(default_factory=list, max_length=50)
    schedule_type: ScheduleType = "Specific date"
    departure_date: date | None = None
    start_time: str | None = Field(default=None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    time_slots: list[str] = Field(default_factory=list, max_length=50)
    time_slot_modes: list[list[BookingMode]] = Field(default_factory=list, max_length=50)
    availability_options: list[dict[str, object]] = Field(default_factory=list, max_length=50)
    guide_name: str | None = Field(default=None, max_length=120)
    highlights: list[str | TourHighlight] = Field(default_factory=list, max_length=12)
    inclusions: list[str] = Field(default_factory=list, max_length=12)
    inclusion_modes: list[BookingMode] = Field(default_factory=lambda: ["Shared", "Private"], max_length=2)
    inclusion_options: list[dict[str, object]] = Field(default_factory=list, max_length=30)
    gallery_images: list[str] = Field(default_factory=list, max_length=10)
    faq_items: list[dict[str, str]] = Field(default_factory=list, max_length=12)
    review_items: list[TourReviewInput] = Field(default_factory=list, max_length=50)
    meeting_details: str = Field(default="", max_length=2000)
    meeting_detail_options: list[dict[str, object]] = Field(default_factory=list, max_length=30)
    start_meeting_point: str = Field(default="", max_length=300)
    start_meeting_map_url: str | None = Field(default=None, max_length=2048, pattern=r"^https?://")
    end_meeting_point: str = Field(default="", max_length=300)
    end_meeting_map_url: str | None = Field(default=None, max_length=2048, pattern=r"^https?://")
    meeting_locations: list[TourMeetingLocation] = Field(default_factory=list, max_length=10)
    traveller_video_url: str | None = Field(default=None, max_length=2048)
    private_price: float | None = Field(default=None, gt=0, le=10_000_000)
    categories: list[str] = Field(default_factory=list, max_length=12)
    start_city: str | None = Field(default=None, max_length=80)
    end_city: str | None = Field(default=None, max_length=80)
    destinations: list[TourDestination] = Field(default_factory=list, max_length=30)
    duration_days: int | None = Field(default=None, ge=1, le=365)
    duration_nights: int | None = Field(default=None, ge=0, le=364)
    languages: list[str] = Field(default_factory=list, max_length=10)
    physicality: str | None = Field(default=None, max_length=40)
    itinerary: list[ItineraryDay] = Field(default_factory=list, max_length=365)
    inclusion_groups: list[InclusionGroup] = Field(default_factory=list, max_length=12)
    exclusions: list[str] = Field(default_factory=list, max_length=30)
    pricing: TourPricing | None = None
    availability: TourAvailability | None = None
    tag: str | None = Field(default=None, max_length=40)
    featured: bool = False
    dark: bool = False
    published: bool = True


class Tour(TourInput):
    model_config = ConfigDict(from_attributes=True)
    review_items: list[TourReview] = Field(default_factory=list, max_length=50)
    id: int
    created_at: datetime
    updated_at: datetime


class CarouselSelection(BaseModel):
    tour_ids: list[int] = Field(min_length=5, max_length=5)


class AdminCarouselResponse(BaseModel):
    tour_ids: list[int] = Field(default_factory=list)
    tours: list[Tour]


class BlogInput(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=10000)
    image_url: HttpUrl
    author_name: str = Field(default="", max_length=120)
    published: bool = True

class Blog(BlogInput):
    id: int
    created_at: datetime
    updated_at: datetime


class AdminReviewList(BaseModel):
    items: list[TourReview]
    total: int
    page: int
    page_size: int
    home_enabled_count: int


class ReviewHomeUpdate(BaseModel):
    enabled: bool


class TourBulkDelete(BaseModel):
    tour_ids: list[int] = Field(min_length=1, max_length=100)


class PaginatedResponse(BaseModel, Generic[ResponseItem]):
    items: list[ResponseItem]
    total: int
    page: int
    page_size: int


class UserRegistration(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(default="", max_length=40)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=1, max_length=128)


class PasswordReset(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    new_password: str = Field(min_length=8, max_length=128)


class Account(BaseModel):
    id: int
    name: str
    username: str
    email: str
    phone: str
    role: UserRole
    is_active: bool
    created_at: datetime


class AccountUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, min_length=5, max_length=254)


class StaffAccountCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "operations", "support"]


class StaffAccountUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class BookingInput(BaseModel):
    tour_id: int = Field(gt=0)
    travel_date: date
    travellers: int = Field(ge=1, le=20)
    booking_mode: BookingMode | None = None
    duration_option_id: str | None = Field(default=None, min_length=1, max_length=80)
    contact_phone: str = Field(min_length=8, max_length=40)
    special_requests: str = Field(default="", max_length=4000)


class Booking(BaseModel):
    id: int
    tour_id: int
    tour_title: str
    city: str
    duration: str
    image_url: HttpUrl
    price: float
    booking_mode: BookingMode
    duration_option_id: str | None = None
    travel_date: date
    travellers: int
    contact_phone: str
    special_requests: str
    booking_status: str
    payment_status: str
    created_at: datetime


class StaffBooking(Booking):
    customer_name: str
    customer_email: str
    guide_name: str | None = None


class BookingUpdate(BaseModel):
    booking_status: BookingStatus | None = None


class TourScheduleUpdate(BaseModel):
    capacity: int = Field(ge=1, le=500)
    departure_date: date | None = None
    guide_name: str | None = Field(default=None, max_length=120)


class ConfirmationRequest(BaseModel):
    channels: list[Literal["email", "whatsapp"]] = Field(min_length=1, max_length=2)


class AdminReport(BaseModel):
    customers: int
    bookings: int
    confirmed_bookings: int
    razorpay_payments: int


RequestStatus = Literal["new", "in_progress", "quoted", "closed"]


class ContactEnquiryInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=5, max_length=40)
    subject: str = Field(min_length=3, max_length=180)
    message: str = Field(min_length=5, max_length=4000)


class RazorpayCreateOrderInput(BaseModel):
    """Checkout order details, bound to a booking owned by the customer."""

    booking_id: int = Field(gt=0)
    amount: int = Field(ge=100, le=1_000_000_000, description="Amount in paise (INR) or cents (USD)")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    receipt: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_@.\-/]+$")
    terms_accepted: bool = Field(description="Customer acknowledgement of the payment terms")
    quote_token: str | None = Field(default=None, min_length=1, max_length=2048)


class PaymentQuote(BaseModel):
    booking_id: int
    amount: int
    currency: Literal["INR", "USD"]
    expires_at: int
    quote_token: str


class RazorpayOrder(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class RazorpayVerifyPaymentInput(BaseModel):
    razorpay_payment_id: str = Field(min_length=1, max_length=64)
    razorpay_order_id: str = Field(min_length=1, max_length=64)
    razorpay_signature: str = Field(min_length=1, max_length=128)


class RazorpayVerificationResult(BaseModel):
    success: bool = True
    booking: Booking


class ContactEnquiry(ContactEnquiryInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: RequestStatus
    admin_notes: str
    created_at: datetime
    updated_at: datetime


class ContactEnquiryUpdate(BaseModel):
    status: RequestStatus
    admin_notes: str = Field(default="", max_length=4000)


class CustomJourneyInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=5, max_length=40)
    destinations: str = Field(min_length=2, max_length=600)
    start_date: str | None = Field(default=None, max_length=40)
    duration: str = Field(min_length=2, max_length=80)
    travellers: str = Field(min_length=1, max_length=40)
    budget: str = Field(min_length=2, max_length=80)
    interests: str = Field(min_length=5, max_length=4000)


class CustomJourney(CustomJourneyInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: RequestStatus
    admin_notes: str
    quote: str
    created_at: datetime
    updated_at: datetime


class CustomJourneyUpdate(BaseModel):
    status: RequestStatus
    admin_notes: str = Field(default="", max_length=4000)
    quote: str = Field(default="", max_length=4000)


def base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def base64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_access_token(subject: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    header = base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = base64url_encode(json.dumps({"sub": subject, "role": role, "jti": str(uuid.uuid4()), "iat": int(now.timestamp()), "exp": int((now + timedelta(hours=JWT_EXPIRY_HOURS)).timestamp())}, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}"
    signature = base64url_encode(hmac.new(JWT_SECRET.encode(), signing_input.encode(), hashlib.sha256).digest())
    return f"{signing_input}.{signature}"


def validate_access_token(token: str) -> dict[str, object]:
    try:
        header, payload, signature = token.split(".")
        signing_input = f"{header}.{payload}"
        expected_signature = base64url_encode(hmac.new(JWT_SECRET.encode(), signing_input.encode(), hashlib.sha256).digest())
        claims = json.loads(base64url_decode(payload))
        expiry = claims.get("exp") if isinstance(claims, dict) else None
        if not hmac.compare_digest(signature, expected_signature) or not isinstance(claims.get("sub"), str) or claims.get("role") not in {"admin", "customer", "operations", "support"} or not isinstance(expiry, (int, float)) or expiry < datetime.now(timezone.utc).timestamp() or db_models.is_token_revoked(token):
            raise ValueError("Invalid token")
        return claims
    except (ValueError, TypeError, binascii.Error, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from None


bearer_security = HTTPBearer(
    scheme_name="JWT Bearer",
    bearerFormat="JWT",
    description="Paste the JWT access token returned by an auth login endpoint. Do not include the `Bearer ` prefix.",
)


def authenticated_account(credentials: HTTPAuthorizationCredentials = Depends(bearer_security)) -> dict[str, object]:
    if credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    claims = validate_access_token(credentials.credentials)
    if claims.get("role") == "admin" and claims.get("sub") == ADMIN_USERNAME:
        return {"id": None, "name": "Administrator", "email": "", "role": "admin", "is_active": True, "legacy_admin": True}
    try:
        user_id = int(str(claims["sub"]))
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid account token") from None
    user = db_models.get_user(user_id)
    if not user or not bool(user["is_active"]) or user["role"] != claims.get("role"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is unavailable or access has changed")
    return user


def require_roles(*roles: UserRole):
    def dependency(account: dict[str, object] = Depends(authenticated_account)) -> dict[str, object]:
        if account.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action")
        return account
    return dependency


admin_required = require_roles("admin")
customer_required = require_roles("customer")
operations_required = require_roles("admin", "operations")
support_required = require_roles("admin", "support")
staff_required = require_roles("admin", "operations", "support")


def booking_amount_in_paise(booking: dict[str, object]) -> int:
    """Convert the saved INR booking price to Razorpay's smallest unit."""
    total = Decimal(str(booking["price"])) * Decimal(str(booking["travellers"]))
    return int((total * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def get_payable_booking(booking_id: int, user_id: int) -> dict[str, object]:
    booking = db_models.get_booking(booking_id)
    if not booking or int(booking["user_id"]) != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking["booking_status"] == "cancelled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cancelled bookings cannot be paid")
    if booking["payment_status"] == "paid":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This booking has already been paid")
    return booking


def payment_quote_signature(payload: str) -> str:
    if not config.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay is not configured.")
    return base64url_encode(hmac.new(
        config.RAZORPAY_KEY_SECRET.encode(),
        f"nomad-payment-quote:{payload}".encode(),
        hashlib.sha256,
    ).digest())


def create_payment_quote(booking: dict[str, object], user_id: int, currency: str) -> PaymentQuote:
    if currency not in {"INR", "USD"}:
        raise HTTPException(status_code=422, detail="Choose INR or USD for payment.")
    base_amount = booking_amount_in_paise(booking)
    try:
        rate = payment_currency.get_usd_exchange_rate()[0] if currency == "USD" else None
        amount = payment_currency.payment_amount_in_subunits(base_amount, currency, rate)
    except payment_currency.ExchangeRateUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    if amount < 100 or amount > 1_000_000_000:
        raise HTTPException(status_code=422, detail=f"Payment amount is outside the supported range for {currency}.")
    expires_at = int(datetime.now(timezone.utc).timestamp()) + 600
    claims = {
        "booking_id": int(booking["id"]), "user_id": user_id, "currency": currency,
        "amount": amount, "base_amount": base_amount, "expires_at": expires_at,
    }
    payload = base64url_encode(json.dumps(claims, separators=(",", ":")).encode())
    return PaymentQuote(
        booking_id=int(booking["id"]), amount=amount, currency=currency, expires_at=expires_at,
        quote_token=f"{payload}.{payment_quote_signature(payload)}",
    )


def validate_payment_quote(data: RazorpayCreateOrderInput, booking: dict[str, object], user_id: int) -> int:
    try:
        payload, signature = (data.quote_token or "").split(".")
        if not hmac.compare_digest(signature, payment_quote_signature(payload)):
            raise ValueError("Invalid signature")
        claims = json.loads(base64url_decode(payload))
        if (
            not isinstance(claims, dict)
            or claims.get("booking_id") != int(booking["id"])
            or claims.get("user_id") != user_id
            or claims.get("currency") != data.currency.upper()
            or claims.get("base_amount") != booking_amount_in_paise(booking)
            or claims.get("amount") != data.amount
            or not isinstance(claims.get("expires_at"), int)
        ):
            raise ValueError("Quote does not match booking")
    except (ValueError, TypeError, binascii.Error, UnicodeDecodeError) as error:
        raise HTTPException(status_code=422, detail="Invalid payment quote. Refresh the payment amount before trying again.") from error
    if claims["expires_at"] <= datetime.now(timezone.utc).timestamp():
        raise HTTPException(status_code=409, detail="Payment quote expired. Refresh the payment amount before trying again.")
    return data.amount


def create_razorpay_order_request(amount: int, currency: str, receipt: str) -> dict[str, object]:
    """Create a Razorpay order with server-only Basic authentication."""
    if not config.RAZORPAY_KEY_ID or not config.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.",
        )

    auth_value = base64.b64encode(
        f"{config.RAZORPAY_KEY_ID}:{config.RAZORPAY_KEY_SECRET}".encode("utf-8"),
    ).decode("ascii")
    request = urlrequest.Request(
        RAZORPAY_ORDERS_URL,
        data=json.dumps(
            {"amount": amount, "currency": currency, "receipt": receipt},
            separators=(",", ":"),
        ).encode("utf-8"),
        headers={
            "Authorization": f"Basic {auth_value}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urlerror.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay could not create the order (HTTP {error.code}).",
        ) from error
    except (urlerror.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Razorpay. Please try again.",
        ) from error

    if (
        not isinstance(payload, dict)
        or not isinstance(payload.get("id"), str)
        or payload.get("amount") != amount
        or payload.get("currency") != currency
    ):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Razorpay returned an invalid order response.",
        )
    return payload


app = FastAPI(title="Nomad Wanderers API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
)
TOUR_UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/tours", StaticFiles(directory=TOUR_UPLOADS_PATH), name="tour-uploads")


@app.exception_handler(db_models.DatabasePoolBusy)
async def database_pool_busy_handler(_request: Request, _error: db_models.DatabasePoolBusy) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "The service is busy. Please try again shortly."},
        headers={"Retry-After": "1"},
    )


@app.on_event("startup")
def startup() -> None:
    db_models.initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "database": db_models.health()}


@app.get("/api/home-carousel", response_model=list[Tour])
def get_home_carousel() -> list[Tour]:
    return [Tour(**tour) for tour in db_models.list_carousel_tours()]


@app.get("/api/blogs", response_model=list[Blog])
def list_blogs() -> list[Blog]:
    return [Blog(**blog) for blog in db_models.list_blogs()]


@app.get("/api/admin/blogs", response_model=list[Blog], dependencies=[Depends(admin_required)])
def list_admin_blogs() -> list[Blog]:
    return [Blog(**blog) for blog in db_models.list_blogs(include_unpublished=True)]


@app.post("/api/admin/blogs", response_model=Blog, status_code=status.HTTP_201_CREATED, dependencies=[Depends(admin_required)])
def create_blog(data: BlogInput) -> Blog:
    return Blog(**db_models.save_blog(data.model_dump(mode="json")))


@app.put("/api/admin/blogs/{blog_id}", response_model=Blog, dependencies=[Depends(admin_required)])
def update_blog(blog_id: int, data: BlogInput) -> Blog:
    blog = db_models.save_blog(data.model_dump(mode="json"), blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return Blog(**blog)


@app.delete("/api/admin/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_blog(blog_id: int) -> None:
    if not db_models.delete_blog(blog_id):
        raise HTTPException(status_code=404, detail="Blog not found")


@app.get("/api/home-reviews", response_model=list[TourReview])
def get_home_reviews() -> list[TourReview]:
    return [TourReview(**review) for review in db_models.list_home_reviews()]


@app.post("/api/admin/tour-images", dependencies=[Depends(admin_required)])
async def upload_tour_image(image: UploadFile = File(...)) -> dict[str, str]:
    """Store an admin-uploaded tour image and return its public URL."""
    extension = TOUR_IMAGE_TYPES.get(image.content_type or "")
    if not extension:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload a JPEG, PNG, or WebP image.")

    contents = await image.read(MAX_TOUR_IMAGE_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The image file is empty.")
    if len(contents) > MAX_TOUR_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image files must be 5 MB or smaller.")

    filename = f"{uuid.uuid4().hex}{extension}"
    (TOUR_UPLOADS_PATH / filename).write_bytes(contents)
    base_url = os.getenv("ASSET_BASE_URL", "http://localhost:8000").rstrip("/")
    return {"image_url": f"{base_url}/uploads/tours/{filename}"}


@app.post("/api/admin/tour-videos", dependencies=[Depends(admin_required)])
async def upload_tour_video(video: UploadFile = File(...)) -> dict[str, str]:
    """Store an admin-uploaded traveller-experience video."""
    extension = TOUR_VIDEO_TYPES.get(video.content_type or "")
    if not extension:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload an MP4, WebM, or MOV video.")
    contents = await video.read(MAX_TOUR_VIDEO_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The video file is empty.")
    if len(contents) > MAX_TOUR_VIDEO_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Video files must be 100 MB or smaller.")
    filename = f"{uuid.uuid4().hex}{extension}"
    (TOUR_UPLOADS_PATH / filename).write_bytes(contents)
    base_url = os.getenv("ASSET_BASE_URL", "http://localhost:8000").rstrip("/")
    return {"video_url": f"{base_url}/uploads/tours/{filename}"}


@app.get("/api/admin/me")
def get_admin_profile(account: dict[str, object] = Depends(admin_required)) -> dict[str, str]:
    return {
        "name": str(account.get("name") or "Administrator"),
        "username": str(account.get("username") or ADMIN_USERNAME),
        "role": "admin",
    }


@app.get("/api/admin/carousel", response_model=AdminCarouselResponse)
def get_admin_carousel(_: dict[str, object] = Depends(admin_required)) -> AdminCarouselResponse:
    tours = db_models.list_tours(include_unpublished=True)
    available_ids = {int(tour["id"]) for tour in tours}
    selected_ids = [
        tour_id
        for tour_id in db_models.get_carousel_tour_ids()
        if tour_id in available_ids
    ]
    return AdminCarouselResponse(
        tour_ids=selected_ids,
        tours=[Tour(**tour) for tour in tours],
    )


@app.put("/api/admin/carousel", response_model=AdminCarouselResponse)
def update_admin_carousel(data: CarouselSelection, _: dict[str, object] = Depends(admin_required)) -> AdminCarouselResponse:
    tour_ids = list(dict.fromkeys(data.tour_ids))
    if len(tour_ids) != 5:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select exactly 5 tours for the home carousel")
    available_ids = {int(tour["id"]) for tour in db_models.list_tours()}
    missing_ids = [tour_id for tour_id in tour_ids if tour_id not in available_ids]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Select published tours only; unavailable tour id(s): "
            + ", ".join(map(str, missing_ids)),
        )
    db_models.save_carousel_tour_ids(tour_ids)
    tours = db_models.list_tours(include_unpublished=True)
    return AdminCarouselResponse(
        tour_ids=tour_ids,
        tours=[Tour(**tour) for tour in tours],
    )


@app.get("/api/admin/reviews", response_model=AdminReviewList, dependencies=[Depends(admin_required)])
def list_admin_reviews(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
) -> AdminReviewList:
    items, total, home_enabled_count = db_models.paginate_admin_reviews(page, page_size, search)
    return AdminReviewList(
        items=[TourReview(**review) for review in items],
        total=total,
        page=page,
        page_size=page_size,
        home_enabled_count=home_enabled_count,
    )


@app.put("/api/admin/reviews/{review_id}/home", response_model=TourReview, dependencies=[Depends(admin_required)])
def update_review_home_visibility(review_id: int, data: ReviewHomeUpdate) -> TourReview:
    try:
        review = db_models.set_review_home_visibility(review_id, data.enabled)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return TourReview(**review)


@app.post("/api/auth/register", response_model=Account, status_code=status.HTTP_201_CREATED)
def register_account(data: UserRegistration) -> Account:
    if db_models.get_user_by_email(data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")
    if db_models.get_user_by_username(data.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already in use")
    return Account(**db_models.create_user(data.name.strip(), data.username, data.email, data.password, data.phone.strip()))


@app.post("/api/auth/login")
def login_account(credentials: UserLogin) -> dict[str, str | int]:
    # The bootstrap administrator is configured in backend/.env. All other
    # accounts are stored in MySQL and carry their own role.
    if credentials.username == ADMIN_USERNAME and credentials.password == ADMIN_PASSWORD:
        return {"access_token": create_access_token(ADMIN_USERNAME, "admin"), "token_type": "bearer", "expires_in": JWT_EXPIRY_HOURS * 3600, "role": "admin"}
    user = db_models.get_user_by_username(credentials.username)
    if not user or not bool(user["is_active"]) or not db_models.verify_password(credentials.password, str(user["password_hash"])):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return {"access_token": create_access_token(str(user["id"]), str(user["role"])), "token_type": "bearer", "expires_in": JWT_EXPIRY_HOURS * 3600, "role": str(user["role"])}


@app.post("/api/auth/reset-password")
def reset_account_password(data: PasswordReset) -> dict[str, str]:
    """Replace a registered account password after its email is confirmed."""
    user = db_models.get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account was found for this email")
    if not bool(user.get("is_active")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active")
    if not db_models.reset_user_password_by_email(data.email, data.new_password):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account was found for this email")
    return {"detail": "Password updated. Please sign in with your new password."}


@app.get("/api/auth/me", response_model=Account)
def get_current_account(user: dict[str, object] = Depends(authenticated_account)) -> Account:
    if user.get("legacy_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use the administrator dashboard for this account")
    return Account(**user)


@app.put("/api/auth/me", response_model=Account)
def update_current_account(data: AccountUpdate, user: dict[str, object] = Depends(authenticated_account)) -> Account:
    if user.get("legacy_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Use a managed account to update a profile")
    if data.email:
        existing = db_models.get_user_by_email(data.email)
        if existing and int(existing["id"]) != int(user["id"]):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")
    account = db_models.update_user_profile(int(user["id"]), data.name.strip(), data.phone.strip() if data.phone is not None else None, data.email.strip() if data.email is not None else None)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**account)


@app.post("/api/auth/logout")
def logout_account(credentials: HTTPAuthorizationCredentials = Depends(bearer_security)) -> dict[str, str]:
    token = credentials.credentials
    claims = validate_access_token(token)
    db_models.revoke_token(token, int(claims["exp"]))
    return {"message": "Logged out"}


@app.post("/api/admin/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer_security)) -> dict[str, str]:
    token = credentials.credentials
    claims = validate_access_token(token)
    db_models.revoke_token(token, int(claims["exp"]))
    return {"message": "Logged out"}


@app.get("/api/tours", response_model=PaginatedResponse[Tour])
def list_tours(
    city: str | None = Query(default=None),
    mode: str | None = Query(default=None),
    trip_type: TripType | None = Query(default=None),
    multi_day: bool = Query(default=False),
    category: str | None = Query(default=None, max_length=80),
    search: str | None = Query(default=None, max_length=160),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
) -> PaginatedResponse[Tour]:
    items, total = db_models.paginate_public_tours(
        page, page_size, city, mode, trip_type, category, search, multi_day,
    )
    return PaginatedResponse(items=[Tour(**tour) for tour in items], total=total, page=page, page_size=page_size)


@app.get("/api/admin/tours", response_model=PaginatedResponse[Tour], dependencies=[Depends(admin_required)])
def list_admin_tours(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
) -> PaginatedResponse[Tour]:
    items, total = db_models.paginate_admin_tours(page, page_size, search)
    return PaginatedResponse(items=[Tour(**tour) for tour in items], total=total, page=page, page_size=page_size)


@app.get("/api/tours/{tour_id}", response_model=Tour)
def get_tour(tour_id: int) -> Tour:
    tour = db_models.get_tour(tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**tour)


@app.post("/api/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingInput, user: dict[str, object] = Depends(customer_required), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key", min_length=8, max_length=200)) -> Booking:
    if data.travel_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Travel date must be today or later")
    if not db_models.get_tour(data.tour_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found or unavailable")
    try:
        contact_phone = f"+{whatsapp.normalise_recipient(data.contact_phone)}"
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    booking_data = data.model_dump()
    booking_data["contact_phone"] = contact_phone
    try:
        booking = db_models.create_booking(int(user["id"]), booking_data, idempotency_key)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found or unavailable")
    return Booking(**booking)


@app.get("/api/bookings/me", response_model=list[Booking])
def list_my_bookings(user: dict[str, object] = Depends(customer_required)) -> list[Booking]:
    return [Booking(**booking) for booking in db_models.list_user_bookings(int(user["id"]))]


@app.get("/api/exchange-rates")
def get_exchange_rates() -> dict[str, object]:
    try:
        rate, observed_date = payment_currency.get_usd_exchange_rate()
    except payment_currency.ExchangeRateUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"amount": 1, "base": "INR", "date": observed_date, "rates": {"USD": float(rate)}}


@app.get("/api/bookings/{booking_id}/payment-quote", response_model=PaymentQuote)
def get_booking_payment_quote(
    booking_id: int,
    response: Response,
    currency: Literal["INR", "USD"] = Query(default="INR"),
    user: dict[str, object] = Depends(customer_required),
) -> PaymentQuote:
    response.headers["Cache-Control"] = "no-store"
    user_id = int(user["id"])
    booking = get_payable_booking(booking_id, user_id)
    return create_payment_quote(booking, user_id, currency)


@app.post("/api/create-order", response_model=RazorpayOrder)
def create_razorpay_order(
    data: RazorpayCreateOrderInput,
    user: dict[str, object] = Depends(customer_required),
) -> RazorpayOrder:
    """Create a Razorpay Standard Checkout order for the customer's booking."""
    booking = get_payable_booking(data.booking_id, int(user["id"]))
    if not data.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Accept the Payment Terms & Conditions before paying.",
        )

    currency = data.currency.upper()
    if currency not in {"INR", "USD"}:
        raise HTTPException(status_code=422, detail="Choose INR or USD for payment.")
    if data.quote_token:
        expected_amount = validate_payment_quote(data, booking, int(user["id"]))
    elif currency == "USD":
        raise HTTPException(status_code=422, detail="A server-confirmed quote is required for dollar payments.")
    else:
        # Preserve compatibility with existing INR clients during rollout.
        expected_amount = booking_amount_in_paise(booking)
        if data.amount != expected_amount:
            raise HTTPException(status_code=422, detail="Payment amount does not match this booking")

    razorpay_order = create_razorpay_order_request(expected_amount, currency, data.receipt)
    order_id = razorpay_order["id"]
    assert isinstance(order_id, str)  # Checked by create_razorpay_order_request.
    db_models.create_razorpay_order(
        razorpay_order_id=order_id,
        booking_id=data.booking_id,
        user_id=int(user["id"]),
        amount=expected_amount,
        currency=currency,
        receipt=data.receipt,
        terms_version="2026-09-19",
    )
    return RazorpayOrder(
        order_id=order_id,
        amount=expected_amount,
        currency=currency,
        key_id=config.RAZORPAY_KEY_ID or "",
    )


def deliver_whatsapp_booking_confirmation(
    booking: dict[str, object],
    recipient: str,
    requested_by: int | None,
) -> dict[str, object]:
    """Hand a confirmation template to Meta and persist the hand-off result."""
    normalised_recipient = whatsapp.normalise_recipient(recipient)
    notification = db_models.queue_booking_confirmation(
        int(booking["id"]),
        f"+{normalised_recipient}",
        "whatsapp",
        requested_by,
    )
    try:
        whatsapp.send_booking_confirmation(booking, normalised_recipient)
    except (whatsapp.WhatsAppConfigurationError, whatsapp.WhatsAppDeliveryError):
        return db_models.update_booking_confirmation_status(int(notification["id"]), "failed")
    return db_models.update_booking_confirmation_status(int(notification["id"]), "sent")


def deliver_email_booking_confirmation(
    booking: dict[str, object],
    recipient: str,
    requested_by: int | None,
) -> dict[str, object]:
    """Hand a booking confirmation directly to SMTP and record the result.

    The database record is delivery audit history only.  It is not a queue and
    no Redis worker is involved in sending this confirmation.
    """
    customer_email = str(recipient).strip()
    booking_id = int(booking["id"])
    LOGGER.info(
        "Booking confirmation email requested: booking_id=%s customer_email=%s",
        booking_id,
        customer_email or "<missing>",
    )
    notification = db_models.start_booking_confirmation_delivery(
        booking_id,
        customer_email,
        "email",
        requested_by,
    )
    try:
        email_delivery.send_booking_confirmation(booking, customer_email)
    except (
        ValueError,
        email_delivery.EmailConfigurationError,
        email_delivery.EmailDeliveryError,
    ) as error:
        LOGGER.warning(
            "Booking confirmation email failed: booking_id=%s customer_email=%s error=%s",
            booking_id,
            customer_email or "<missing>",
            type(error).__name__,
        )
        return db_models.update_booking_confirmation_status(int(notification["id"]), "failed")
    result = db_models.update_booking_confirmation_status(int(notification["id"]), "sent")
    LOGGER.info(
        "Booking confirmation email sent: booking_id=%s customer_email=%s notification_id=%s",
        booking_id,
        customer_email,
        notification["id"],
    )
    return result


def deliver_booking_whatsapp_confirmations(
    booking: dict[str, object],
    profile_phone: str,
    requested_by: int | None,
) -> list[dict[str, object]]:
    """Send the confirmation to the booking contact and configured admins."""
    traveller_phone = str(booking.get("contact_phone") or profile_phone).strip()
    if not traveller_phone:
        raise ValueError("The traveller has no WhatsApp number on this booking.")

    notifications = []
    delivered_numbers: set[str] = set()
    for index, recipient in enumerate((traveller_phone, *config.META_WHATSAPP_ADMIN_RECIPIENTS)):
        try:
            normalised_recipient = whatsapp.normalise_recipient(recipient)
        except ValueError:
            # A malformed admin setting must not prevent a traveller's paid
            # booking confirmation. The traveller number remains mandatory.
            if index == 0:
                raise
            continue
        if normalised_recipient in delivered_numbers:
            continue
        delivered_numbers.add(normalised_recipient)
        notifications.append(
            deliver_whatsapp_booking_confirmation(booking, normalised_recipient, requested_by)
        )
    return notifications


@app.post("/api/verify-payment", response_model=RazorpayVerificationResult)
def verify_razorpay_payment(
    data: RazorpayVerifyPaymentInput,
    user: dict[str, object] = Depends(customer_required),
) -> RazorpayVerificationResult:
    """Verify Checkout's HMAC signature before marking a booking as paid."""
    LOGGER.info("========== PAYMENT VERIFICATION ==========")
    if not config.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured.",
        )
    signature_payload = f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        config.RAZORPAY_KEY_SECRET.encode("utf-8"),
        signature_payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, data.razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Razorpay payment signature")

    try:
        booking, newly_verified = db_models.complete_razorpay_payment(
            razorpay_order_id=data.razorpay_order_id,
            razorpay_payment_id=data.razorpay_payment_id,
            razorpay_signature=data.razorpay_signature,
            user_id=int(user["id"]),
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Razorpay order not found")
    
    
    LOGGER.info("booking details: %s  ", booking)
    if newly_verified:
        customer = db_models.get_user(int(booking["user_id"]))
        LOGGER.info("customer details: %s  ", customer)
        email_sent =  send_email_to_customer(
            booking=booking,
            customer=customer,
            max_attempts=3,
            retry_delay=5,
        )
        LOGGER.info(
            "Booking confirmation email result: booking_id=%s success=%s",
            booking["id"],
            email_sent,
        )
        try:
            customer_name = str(
                booking.get("customer_name")
                or customer.get("name")
                or "Guest"
            )
            LOGGER.info(f"Name : {customer_name}")

            tour_name = str(booking.get("tour_title") or "Your Tour")
            LOGGER.info(f"Tour Name : {tour_name}")
            

            travel_date = booking.get("travel_date")
            LOGGER.info(f"Travel Date : {travel_date}")
            if isinstance(travel_date, (date, datetime)):
                travel_date = travel_date.strftime("%d %B %Y")
            else:
                travel_date = str(travel_date or "To be confirmed")
            LOGGER.info(f"Travel Date : {travel_date}")

            
            booking_id = booking.get("tour_id")
            contact_phone = booking.get("contact_phone")
            contact_phone = contact_phone.lstrip("+")
            send_whatsapp_booking_confirmation(customer_name=customer_name, tour_name=tour_name, travel_date=travel_date, booking_id=booking_id, contact_phone=contact_phone)
            LOGGER.info(f" Traveller Booking confirmation WhatsApp result: booking_id={booking['id']} success=True")
            contact_phone='9196199 52139'
            send_whatsapp_booking_confirmation(customer_name=customer_name, tour_name=tour_name, travel_date=travel_date, booking_id=booking_id, contact_phone=contact_phone)
            LOGGER.info(f" Admin Booking confirmation WhatsApp result: booking_id={booking['id']} success=True")
        except ValueError:
            # A legacy booking might not yet have a saved contact number.
            # Never turn a successfully paid booking into a failed response.
            LOGGER.info(f"Booking confirmation WhatsApp result: booking_id={booking['id']} success=False")
    return RazorpayVerificationResult(success=True, booking=Booking(**booking))


@app.get("/api/bookings/{booking_id}/confirmation")
def download_booking_confirmation(booking_id: int, user: dict[str, object] = Depends(customer_required)) -> Response:
    booking = db_models.get_booking(booking_id)
    if not booking or int(booking["user_id"]) != int(user["id"]):
        raise HTTPException(status_code=404, detail="Booking not found")
    confirmation = (
        "Nomad Wanderers booking confirmation\n\n"
        f"Booking reference: NW-{booking['id']}\n"
        f"Traveller: {booking['customer_name']}\n"
        f"Tour: {booking['tour_title']}\n"
        f"Travel date: {booking['travel_date']}\n"
        f"Travellers: {booking['travellers']}\n"
        f"Booking status: {booking['booking_status']}\n"
        f"Payment status: {booking['payment_status']}\n"
    )
    return Response(
        content=confirmation,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="nomad-booking-{booking_id}.txt"'},
    )


@app.get("/api/staff/bookings", response_model=list[StaffBooking])
def list_staff_bookings(_: dict[str, object] = Depends(staff_required)) -> list[StaffBooking]:
    return [StaffBooking(**booking) for booking in db_models.list_staff_bookings()]


@app.patch("/api/staff/bookings/{booking_id}", response_model=StaffBooking)
def update_staff_booking(booking_id: int, data: BookingUpdate, account: dict[str, object] = Depends(staff_required)) -> StaffBooking:
    role = str(account["role"])
    if role == "support" and data.booking_status != "cancelled":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Support can only cancel bookings")
    if data.booking_status is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select a booking status to update")
    previous_booking = db_models.get_booking(booking_id)
    if not previous_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking = db_models.update_booking(booking_id, data.booking_status)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if data.booking_status == "confirmed" and previous_booking.get("booking_status") != "confirmed":
        # A manual staff confirmation should reach the traveller immediately as
        # well; provider failure is recorded without undoing the status change.
        deliver_email_booking_confirmation(
            booking,
            str(booking.get("customer_email") or ""),
            account.get("id") if isinstance(account.get("id"), int) else None,
        )
    return StaffBooking(**booking)


@app.get("/api/operations/tours", response_model=list[Tour])
def list_operations_tours(_: dict[str, object] = Depends(operations_required)) -> list[Tour]:
    return [Tour(**tour) for tour in db_models.list_tours(include_unpublished=True)]


@app.patch("/api/operations/tours/{tour_id}/schedule", response_model=Tour)
def update_operations_tour_schedule(tour_id: int, data: TourScheduleUpdate, _: dict[str, object] = Depends(operations_required)) -> Tour:
    tour = db_models.update_tour_schedule(tour_id, data.capacity, data.departure_date, data.guide_name)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**tour)


@app.post("/api/staff/bookings/{booking_id}/confirmations")
def resend_booking_confirmation(booking_id: int, data: ConfirmationRequest, account: dict[str, object] = Depends(support_required)) -> dict[str, object]:
    booking = db_models.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    notifications = []
    whatsapp_sent = 0
    email_sent = 0
    for channel in data.channels:
        if channel == "email":
            recipient = str(booking["customer_email"])
            email_notification = deliver_email_booking_confirmation(
                booking,
                recipient,
                account.get("id") if isinstance(account.get("id"), int) else None,
            )
            notifications.append(email_notification)
            email_sent += int(email_notification.get("delivery_status") == "sent")
        else:
            customer = db_models.get_user(int(booking["user_id"]))

    summaries = []
    if whatsapp_sent:
        summaries.append(f"{whatsapp_sent} WhatsApp confirmation sent")
    elif "whatsapp" in data.channels:
        summaries.append("WhatsApp delivery failed; check the provider configuration")
    if email_sent:
        summaries.append(f"{email_sent} email confirmation sent")
    elif "email" in data.channels:
        summaries.append("Email delivery failed; check the SMTP configuration")
    return {"message": "; ".join(summaries), "notifications": notifications}


@app.get("/api/staff/contact-enquiries", response_model=PaginatedResponse[ContactEnquiry])
def list_staff_contact_enquiries(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
    _: dict[str, object] = Depends(support_required),
) -> PaginatedResponse[ContactEnquiry]:
    items, total = db_models.paginate_contact_enquiries(page, page_size, search)
    return PaginatedResponse(items=[ContactEnquiry(**enquiry) for enquiry in items], total=total, page=page, page_size=page_size)


@app.put("/api/staff/contact-enquiries/{enquiry_id}", response_model=ContactEnquiry)
def update_staff_contact_enquiry(enquiry_id: int, data: ContactEnquiryUpdate, _: dict[str, object] = Depends(support_required)) -> ContactEnquiry:
    enquiry = db_models.update_contact_enquiry(enquiry_id, data.model_dump())
    if not enquiry:
        raise HTTPException(status_code=404, detail="Contact enquiry not found")
    return ContactEnquiry(**enquiry)


@app.post(
    "/api/admin/tours",
    response_model=Tour | list[Tour],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_required)],
)
def create_tour(data: TourInput | list[TourInput]) -> Tour | list[Tour]:
    """Create one tour object or bulk-create a JSON list of tour objects."""
    if isinstance(data, list):
        return [Tour(**db_models.save_tour(item.model_dump(mode="json"))) for item in data]
    return Tour(**db_models.save_tour(data.model_dump(mode="json")))


@app.put("/api/admin/tours/{tour_id}", response_model=Tour, dependencies=[Depends(admin_required)])
def update_tour(tour_id: int, data: TourInput) -> Tour:
    tour = db_models.save_tour(data.model_dump(mode="json"), tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**tour)


@app.delete("/api/admin/tours/{tour_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_tour(tour_id: int) -> None:
    if not db_models.delete_tour(tour_id):
        raise HTTPException(status_code=404, detail="Tour not found")


@app.delete("/api/admin/tours", dependencies=[Depends(admin_required)])
def delete_tours(data: TourBulkDelete) -> dict[str, int]:
    deleted = db_models.delete_tours(data.tour_ids)
    return {"deleted": deleted}


@app.get("/api/admin/users", response_model=list[Account], dependencies=[Depends(admin_required)])
def list_admin_users() -> list[Account]:
    return [Account(**user) for user in db_models.list_users()]


@app.get("/api/admin/reports", response_model=AdminReport, dependencies=[Depends(admin_required)])
def get_admin_report() -> AdminReport:
    return AdminReport(**db_models.admin_report())


@app.post("/api/admin/users", response_model=Account, status_code=status.HTTP_201_CREATED, dependencies=[Depends(admin_required)])
def create_admin_staff_user(data: StaffAccountCreate) -> Account:
    if db_models.get_user_by_email(data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")
    if db_models.get_user_by_username(data.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already in use")
    return Account(**db_models.create_staff_user(data.name.strip(), data.username, data.email, data.password, data.role))


@app.patch("/api/admin/users/{user_id}", response_model=Account, dependencies=[Depends(admin_required)])
def update_admin_user_access(user_id: int, data: StaffAccountUpdate) -> Account:
    if data.role == "customer":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Customer accounts cannot be assigned through staff access management")
    account = db_models.update_user_access(user_id, data.role, data.is_active)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**account)


@app.post("/api/contact-enquiries", response_model=ContactEnquiry, status_code=status.HTTP_201_CREATED)
def create_contact_enquiry(data: ContactEnquiryInput) -> ContactEnquiry:
    return ContactEnquiry(**db_models.create_contact_enquiry(data.model_dump()))


@app.get("/api/admin/contact-enquiries", response_model=PaginatedResponse[ContactEnquiry], dependencies=[Depends(admin_required)])
def list_admin_contact_enquiries(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
) -> PaginatedResponse[ContactEnquiry]:
    items, total = db_models.paginate_contact_enquiries(page, page_size, search)
    return PaginatedResponse(items=[ContactEnquiry(**enquiry) for enquiry in items], total=total, page=page, page_size=page_size)


@app.put("/api/admin/contact-enquiries/{enquiry_id}", response_model=ContactEnquiry, dependencies=[Depends(admin_required)])
def update_contact_enquiry(enquiry_id: int, data: ContactEnquiryUpdate) -> ContactEnquiry:
    enquiry = db_models.update_contact_enquiry(enquiry_id, data.model_dump())
    if not enquiry:
        raise HTTPException(status_code=404, detail="Contact enquiry not found")
    return ContactEnquiry(**enquiry)


@app.delete("/api/admin/contact-enquiries/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_contact_enquiry(enquiry_id: int) -> None:
    if not db_models.delete_contact_enquiry(enquiry_id):
        raise HTTPException(status_code=404, detail="Contact enquiry not found")


@app.post("/api/custom-journeys", response_model=CustomJourney, status_code=status.HTTP_201_CREATED)
def create_custom_journey(data: CustomJourneyInput) -> CustomJourney:
    return CustomJourney(**db_models.create_custom_journey(data.model_dump()))


@app.get("/api/admin/custom-journeys", response_model=PaginatedResponse[CustomJourney], dependencies=[Depends(admin_required)])
def list_admin_custom_journeys(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
) -> PaginatedResponse[CustomJourney]:
    items, total = db_models.paginate_custom_journeys(page, page_size, search)
    return PaginatedResponse(items=[CustomJourney(**journey) for journey in items], total=total, page=page, page_size=page_size)


@app.put("/api/admin/custom-journeys/{journey_id}", response_model=CustomJourney, dependencies=[Depends(admin_required)])
def update_custom_journey(journey_id: int, data: CustomJourneyUpdate) -> CustomJourney:
    journey = db_models.update_custom_journey(journey_id, data.model_dump())
    if not journey:
        raise HTTPException(status_code=404, detail="Custom journey not found")
    return CustomJourney(**journey)


@app.delete("/api/admin/custom-journeys/{journey_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(admin_required)])
def delete_custom_journey(journey_id: int) -> None:
    if not db_models.delete_custom_journey(journey_id):
        raise HTTPException(status_code=404, detail="Custom journey not found")

ACCESS_TOKEN = "EAAXkQwMVhLEBSiZAFBt1iZC7fTkMi5ZBT9XObSg8l7Pi4Pza3Yuqd6cGWbOHeIHYIXSZCEs62fHoSREZCz498SksAo0NYP9a81dSqrwxsvGWSJaCZAqSTtbN7NgeeZBETqZCsZCAmqeoGwhL4cCZAeCzY4a4QJqqeNYuzQB6U0rt1S3rG8y8aKaZCvc2kzW5dXMZCwZDZD"
PHONE_NUMBER_ID = "1362908966906121"
API_VERSION = "v22.0"

TEMPLATE_NAME = "nomad_wonderers_test_templetee"
TEMPLATE_LANGUAGE = "en"


# CUSTOMER_PHONE = "919000590442"
# CUSTOMER_NAME = "nayak"
# TOUR_TITLE = "Kalsubai Peak"
# TRAVEL_DATE = "30 Oct 2026"
# BOOKING_REFERENCE = "NM06202663"

def send_whatsapp_booking_confirmation(customer_name: str, tour_name: str, travel_date: str, booking_id: str, contact_phone: str):
    
    


    url = (
        f"https://graph.facebook.com/"
        f"{API_VERSION}/{PHONE_NUMBER_ID}/messages"
    )

    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": contact_phone,
        "type": "template",
        "template": {
            "name": TEMPLATE_NAME,
            "language": {
                "code": TEMPLATE_LANGUAGE
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": customer_name
                        },
                        {
                            "type": "text",
                            "text": tour_name
                        },
                        {
                            "type": "text",
                            "text": travel_date
                        },
                        {
                            "type": "text",
                            "text": booking_id
                        }
                    ]
                }
            ]
        }
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30
        )

        print("Status Code:", response.status_code)

        try:
            result = response.json()
        except ValueError:
            print("Response:", response.text)
            return None

        print("Response:", json.dumps(result, indent=4))

        if response.status_code == 200:
            print("WhatsApp message accepted by Meta!")
            return result

        print("WhatsApp message failed!")
        return None

    except requests.exceptions.RequestException as error:
        print("Error sending WhatsApp:", str(error))
        return None

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="wanderersnomad@gmail.com"
SMTP_PASSWORD="yzve wqnz uxmy ezop"
SMTP_FROM_EMAIL="wanderersnomad@gmail.com"
SMTP_FROM_NAME="Nomad Wanderers"



def send_email_to_customer(
    booking: dict,
    customer: dict | None = None,
    max_attempts: int = 3,
    retry_delay: int = 5,
) -> bool:
    import smtplib
    import ssl
    import time
    import re
    import logging
    from datetime import date, datetime
    from decimal import Decimal
    from html import escape
    from email.message import EmailMessage
    from email.utils import formataddr

    logger = logging.getLogger(__name__)
    customer = customer or {}
    # Load SMTP credentials from config.py
    # (
    #     SMTP_HOST,
    #     SMTP_PORT,
    #     SMTP_USERNAME,
    #     SMTP_PASSWORD,
    #     SMTP_FROM_EMAIL,
    #     SMTP_FROM_NAME,
    # ) = _smtp_settings()
    logger.info("Email code inside >>>>>>>")
    # Verify SMTP configuration
    logger.info("SMTP Host: %s", SMTP_HOST)
    logger.info("SMTP Port: %s", SMTP_PORT)

    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1")

    if retry_delay < 0:
        raise ValueError("retry_delay cannot be negative")

    booking_id = str(booking["id"])

    customer_email = str(
        booking.get("customer_email")
        or booking.get("contact_email")
        or customer.get("email")
        or ""
    ).strip()
    logger.info(f"Email : {customer_email}")

    customer_name = str(
        booking.get("customer_name")
        or customer.get("name")
        or "Guest"
    )
    logger.info(f"Name : {customer_name}")

    tour_name = str(booking.get("tour_title") or "Your Tour")
    logger.info(f"Tour Name : {tour_name}")
    city = str(booking.get("city") or "Not specified")
    logger.info(f"City : {city}")

    travel_date = booking.get("travel_date")
    logger.info(f"Travel Date : {travel_date}")
    if isinstance(travel_date, (date, datetime)):
        travel_date = travel_date.strftime("%d %B %Y")
    else:
        travel_date = str(travel_date or "To be confirmed")
    logger.info(f"Travel Date : {travel_date}")
    travellers = int(booking.get("travellers") or 1)
    logger.info(f"Travellers : {travellers}")
    duration = str(
        booking.get("selected_duration")
        or booking.get("duration")
        or "Not specified"
    )
    logger.info(f"Duration : {duration}")
    booking_mode = str(booking.get("booking_mode") or "Shared")
    logger.info(f"Booking Mode : {booking_mode}")
    guide_name = str(booking.get("guide_name") or "To be assigned")
    logger.info(f"Guide Name : {guide_name}")
    booking_status = str(booking.get("booking_status") or "pending").title()
    logger.info(f"Booking Status : {booking_status}")
    payment_status = str(booking.get("payment_status") or "unpaid").title()
    logger.info(f"Payment Status : {payment_status}")

    unit_price = Decimal(str(booking.get("unit_price") or "0"))
    total_amount = unit_price * travellers
    logger.info(f"Total Amount : {total_amount}")
    currency = str(booking.get("currency") or "INR").upper()
    logger.info(f"Currency : {currency}")
    currency_symbol = {
        "INR": "₹",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
    }.get(currency, currency + " ")

    formatted_amount = f"{currency_symbol}{total_amount:,.2f}"

    special_requests = str(booking.get("special_requests") or "")
    logger.info(f"Special Requests : {special_requests}")
    start_time = "To be confirmed"

    match = re.search(
        r"Start time slot:\s*([^\r\n]+)",
        special_requests,
        flags=re.IGNORECASE,
    )

    if match:
        start_time = match.group(1).strip()
        if "·" in start_time:
            start_time = start_time.split("·")[-1].strip()

    if not customer_email or "@" not in customer_email:
        logger.error("Missing customer email for booking %s", booking_id)
        return False

    if booking_status.lower() != "confirmed" or payment_status.lower() != "paid":
        logger.warning(
            "Email not sent because booking %s is not confirmed and paid",
            booking_id,
        )
        return False

    def safe(value):
        return escape(str(value))

    subject = f"Booking Confirmed #{booking_id} | Nomad Wanderers"

    details = [
        ("Booking ID", f"#{booking_id}"),
        ("Tour Name", tour_name),
        ("Destination", city),
        ("Travel Date", travel_date),
        ("Start Time", start_time),
        ("Duration", duration),
        ("Travellers", str(travellers)),
        ("Tour Type", booking_mode),
        ("Tour Guide", guide_name),
    ]

    details_rows = "".join(
        f"""
        <tr>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;
                       color:#64748b;width:38%;vertical-align:top;">
                {safe(label)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #e2e8f0;
                       color:#123c5a;font-weight:600;">
                {safe(value)}
            </td>
        </tr>
        """
        for label, value in details
    )

    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:25px 10px;background:#f4f7fb;
                 font-family:Arial,Helvetica,sans-serif;color:#334155;">

        <table role="presentation" cellpadding="0" cellspacing="0"
               style="max-width:620px;width:100%;margin:auto;
                      background:#ffffff;border-collapse:collapse;">

            <tr>
                <td style="background:#123c5a;color:#ffffff;
                           text-align:center;padding:32px 20px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;">
                        Nomad Wanderers
                    </h1>
                    <p style="color:#dbeafe;margin:10px 0 0;">
                        Explore More, Wander More
                    </p>
                </td>
            </tr>

            <tr>
                <td style="padding:30px 25px 15px;">
                    <h2 style="color:#15803d;text-align:center;">
                        &#10004; Your Booking is Confirmed!
                    </h2>

                    <p>Dear <strong>{safe(customer_name)}</strong>,</p>

                    <p style="line-height:1.7;">
                        Thank you for choosing
                        <strong>Nomad Wanderers!</strong>
                    </p>

                    <p style="line-height:1.7;">
                        We are delighted to confirm your booking.
                        Your payment has been successfully received,
                        and your adventure is all set!
                    </p>
                </td>
            </tr>

            <tr>
                <td style="padding:10px 25px;">
                    <h3 style="color:#123c5a;">Your Booking Details</h3>

                    <table role="presentation" cellpadding="0"
                           cellspacing="0"
                           style="width:100%;background:#f8fafc;
                                  border-collapse:collapse;font-size:14px;">
                        {details_rows}
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding:20px 25px;">
                    <h3 style="color:#123c5a;">Payment Summary</h3>

                    <table role="presentation" cellpadding="0"
                           cellspacing="0"
                           style="width:100%;border-collapse:collapse;">

                        <tr>
                            <td style="padding:12px;">Booking Status</td>
                            <td style="padding:12px;color:#15803d;
                                       font-weight:bold;">
                                {safe(booking_status)}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:12px;">Payment Status</td>
                            <td style="padding:12px;color:#15803d;
                                       font-weight:bold;">
                                {safe(payment_status)}
                            </td>
                        </tr>

                        <tr style="background:#eef2f7;">
                            <td style="padding:15px;font-weight:bold;">
                                Total Amount Paid
                            </td>
                            <td style="padding:15px;font-size:20px;
                                       color:#123c5a;font-weight:bold;">
                                {safe(formatted_amount)}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding:15px 25px 30px;">
                    <h3 style="color:#123c5a;">
                        Your Adventure Awaits!
                    </h3>

                    <p style="line-height:1.7;">
                        We're excited to welcome you to
                        {safe(city)} and make your travel
                        experience memorable.
                    </p>

                    <p style="line-height:1.7;">
                        Please keep this booking confirmation
                        available on your travel day.
                        Our team will share any necessary
                        meeting-point or pickup instructions.
                    </p>

                    <p>Thank you for trusting Nomad Wanderers!</p>

                    <p style="margin-top:25px;">
                        Warm Regards,<br>
                        <strong>Nomad Wanderers Team</strong>
                    </p>
                </td>
            </tr>

            <tr>
                <td style="background:#eef2f7;text-align:center;
                           padding:20px;color:#64748b;font-size:12px;">
                    <strong style="color:#123c5a;">
                        Nomad Wanderers
                    </strong>
                    <p>Explore More, Wander More</p>
                    <p>&copy; 2026 Nomad Wanderers. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    plain_details = "\n".join(
        f"{label}: {value}" for label, value in details
    )

    plain_body = f"""
NOMAD WANDERERS
Explore More, Wander More

YOUR BOOKING IS CONFIRMED!

Dear {customer_name},

Thank you for choosing Nomad Wanderers!

Your booking has been confirmed and your payment
has been successfully received.

BOOKING DETAILS
------------------------------
{plain_details}

PAYMENT SUMMARY
------------------------------
Booking Status: {booking_status}
Payment Status: {payment_status}
Total Amount Paid: {formatted_amount}

YOUR ADVENTURE AWAITS!

We're excited to welcome you to {city}.

Please keep this booking confirmation available
on your travel day. Our team will share any
necessary meeting-point or pickup instructions.

Warm Regards,
Nomad Wanderers Team
"""

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(
        (SMTP_FROM_NAME, SMTP_FROM_EMAIL)
    )
    message["To"] = customer_email

    message.set_content(plain_body)
    message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()

    for attempt in range(1, max_attempts + 1):
        try:
            logger.info(
                "Sending booking confirmation: booking_id=%s attempt=%s/%s",
                booking_id,
                attempt,
                max_attempts,
            )

            with smtplib.SMTP(
                SMTP_HOST,
                SMTP_PORT,
                timeout=30,
            ) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(
                    SMTP_USERNAME,
                    SMTP_PASSWORD.replace(" ", ""),
                )
                server.send_message(message)

            logger.info(
                "Booking confirmation accepted by SMTP: booking_id=%s",
                booking_id,
            )
            return True

        except smtplib.SMTPAuthenticationError:
            logger.exception("Gmail authentication failed")
            return False

        except (
            smtplib.SMTPRecipientsRefused,
            smtplib.SMTPSenderRefused,
        ):
            logger.exception("SMTP sender or recipient rejected")
            return False

        except smtplib.SMTPResponseException as error:
            logger.warning(
                "SMTP error for booking %s: %s",
                booking_id,
                error.smtp_code,
            )
            if not 400 <= error.smtp_code < 500:
                return False

        except (OSError, smtplib.SMTPException) as error:
            logger.warning(
                "SMTP connection error for booking %s: %s",
                booking_id,
                error,
            )

        except Exception:
            logger.exception(
                "Unexpected email error for booking %s",
                booking_id,
            )
            return False

        if attempt < max_attempts:
            time.sleep(retry_delay * (2 ** (attempt - 1)))

    logger.error(
        "Booking confirmation failed after %s attempts: booking_id=%s",
        max_attempts,
        booking_id,
    )
    return False


