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
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Generic, Literal, TypeVar
from urllib import error as urlerror
from urllib import request as urlrequest

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

import db_models
import config
import whatsapp


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


class TourHighlight(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)


class TourPricing(BaseModel):
    currency: str = Field(default="INR", min_length=3, max_length=3)
    pricing_model: Literal["fixed_per_person", "per_person_by_group_size", "on_request"] = "fixed_per_person"
    tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    shared_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)
    private_tiers: list[PricingTier] = Field(default_factory=list, max_length=20)


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
    schedule_type: ScheduleType = "Specific date"
    departure_date: date | None = None
    start_time: str | None = Field(default=None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    time_slots: list[str] = Field(default_factory=list, max_length=20)
    guide_name: str | None = Field(default=None, max_length=120)
    highlights: list[str | TourHighlight] = Field(default_factory=list, max_length=12)
    inclusions: list[str] = Field(default_factory=list, max_length=12)
    gallery_images: list[str] = Field(default_factory=list, max_length=10)
    faq_items: list[dict[str, str]] = Field(default_factory=list, max_length=12)
    review_items: list[TourReviewInput] = Field(default_factory=list, max_length=50)
    meeting_details: str = Field(default="", max_length=2000)
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
    amount: int = Field(ge=100, le=1_000_000_000, description="Amount in paise")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    receipt: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_@.\-/]+$")
    terms_accepted: bool = Field(description="Customer acknowledgement of the payment terms")


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

    if not isinstance(payload, dict) or not isinstance(payload.get("id"), str):
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


@app.on_event("startup")
def startup() -> None:
    db_models.initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "database": db_models.health()}


@app.get("/api/home-carousel", response_model=list[Tour])
def get_home_carousel() -> list[Tour]:
    return [Tour(**tour) for tour in db_models.list_carousel_tours()]


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


@app.post("/api/create-order", response_model=RazorpayOrder)
def create_razorpay_order(
    data: RazorpayCreateOrderInput,
    user: dict[str, object] = Depends(customer_required),
) -> RazorpayOrder:
    """Create a Razorpay Standard Checkout order for the customer's booking."""
    booking = db_models.get_booking(data.booking_id)
    if not booking or int(booking["user_id"]) != int(user["id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking["booking_status"] == "cancelled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cancelled bookings cannot be paid")
    if booking["payment_status"] == "paid":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This booking has already been paid")
    if not data.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Accept the Payment Terms & Conditions before paying.",
        )

    currency = data.currency.upper()
    if currency != "INR":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Bookings can only be paid in INR")
    expected_amount = booking_amount_in_paise(booking)
    if expected_amount < 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Razorpay payments must be at least 100 paise")
    if data.amount != expected_amount:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Payment amount does not match this booking")

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
    if newly_verified:
        customer = db_models.get_user(int(booking["user_id"]))
        # Messaging cannot change the outcome of a verified payment. Any
        # provider error is recorded for staff to resend later.
        try:
            deliver_booking_whatsapp_confirmations(
                booking,
                str((customer or {}).get("phone", "")),
                None,
            )
        except ValueError:
            # A legacy booking might not yet have a saved contact number.
            # Never turn a successfully paid booking into a failed response.
            pass
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
    booking = db_models.update_booking(booking_id, data.booking_status)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
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
    email_queued = 0
    for channel in data.channels:
        if channel == "email":
            recipient = str(booking["customer_email"])
            notifications.append(
                db_models.queue_booking_confirmation(
                    booking_id,
                    recipient,
                    channel,
                    account.get("id") if isinstance(account.get("id"), int) else None,
                )
            )
            email_queued += 1
        else:
            customer = db_models.get_user(int(booking["user_id"]))
            try:
                whatsapp_notifications = deliver_booking_whatsapp_confirmations(
                    booking,
                    str((customer or {}).get("phone", "")),
                    account.get("id") if isinstance(account.get("id"), int) else None,
                )
            except ValueError as error:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
            notifications.extend(whatsapp_notifications)
            whatsapp_sent += sum(
                int(notification.get("delivery_status") == "sent")
                for notification in whatsapp_notifications
            )

    summaries = []
    if whatsapp_sent:
        summaries.append(f"{whatsapp_sent} WhatsApp confirmation sent")
    elif "whatsapp" in data.channels:
        summaries.append("WhatsApp delivery failed; check the provider configuration")
    if email_queued:
        summaries.append(f"{email_queued} email confirmation queued")
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
