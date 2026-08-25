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
from pathlib import Path
from typing import Generic, Literal, TypeVar

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

import db_models
import config


ENV_PATH = Path(__file__).with_name(".env")
TOUR_UPLOADS_PATH = Path(__file__).with_name("uploads") / "tours"
MAX_TOUR_IMAGE_BYTES = 5 * 1024 * 1024
TOUR_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


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
    "Festival special",
]
ScheduleType = Literal["Daily", "Specific date"]
UserRole = Literal["customer", "admin", "operations", "support"]
BookingStatus = Literal["pending", "confirmed", "cancelled", "completed"]
PaymentStatus = Literal["unpaid", "paid", "refunded"]
ResponseItem = TypeVar("ResponseItem")


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
    guide_name: str | None = Field(default=None, max_length=120)
    highlights: list[str] = Field(default_factory=list, max_length=12)
    tag: str | None = Field(default=None, max_length=40)
    featured: bool = False
    dark: bool = False
    published: bool = True


class Tour(TourInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


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
    payment_status: PaymentStatus | None = None


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
    demo_payment_total: float


RequestStatus = Literal["new", "in_progress", "quoted", "closed"]
PaymentMethod = Literal["upi", "credit_card", "debit_card"]


class ContactEnquiryInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=5, max_length=40)
    subject: str = Field(min_length=3, max_length=180)
    message: str = Field(min_length=5, max_length=4000)


class DemoPaymentInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: str = Field(min_length=5, max_length=40)
    tour_title: str = Field(min_length=3, max_length=180)
    amount: float = Field(gt=0, le=10_000_000)
    payment_method: PaymentMethod


class DemoPayment(DemoPaymentInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    booking_id: int | None = None
    status: Literal["paid"]
    transaction_reference: str
    created_at: datetime


class DemoPaymentResult(BaseModel):
    payment: DemoPayment
    email_confirmation: str
    whatsapp_confirmation: str


class BookingPaymentInput(BaseModel):
    payment_method: PaymentMethod


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


def authenticated_account(authorization: str | None = Header(default=None)) -> dict[str, object]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    claims = validate_access_token(authorization.removeprefix("Bearer "))
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
app.mount("/uploads", StaticFiles(directory=TOUR_UPLOADS_PATH.parent), name="uploads")


@app.on_event("startup")
def startup() -> None:
    db_models.initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "database": db_models.health()}


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


@app.get("/api/admin/me")
def get_admin_profile(account: dict[str, object] = Depends(admin_required)) -> dict[str, str]:
    return {
        "name": str(account.get("name") or "Administrator"),
        "username": str(account.get("username") or ADMIN_USERNAME),
        "role": "admin",
    }


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
def logout_account(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    token = authorization.removeprefix("Bearer ")
    claims = validate_access_token(token)
    db_models.revoke_token(token, int(claims["exp"]))
    return {"message": "Logged out"}


@app.post("/api/admin/logout")
def logout(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    token = authorization.removeprefix("Bearer ")
    claims = validate_access_token(token)
    db_models.revoke_token(token, int(claims["exp"]))
    return {"message": "Logged out"}


@app.get("/api/tours", response_model=PaginatedResponse[Tour])
def list_tours(
    city: str | None = Query(default=None),
    mode: str | None = Query(default=None),
    trip_type: TripType | None = Query(default=None),
    category: str | None = Query(default=None, max_length=80),
    search: str | None = Query(default=None, max_length=160),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, ge=1, le=100),
) -> PaginatedResponse[Tour]:
    items, total = db_models.paginate_public_tours(page, page_size, city, mode, trip_type, category, search)
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
        booking = db_models.create_booking(int(user["id"]), data.model_dump(), idempotency_key)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found or unavailable")
    return Booking(**booking)


@app.get("/api/bookings/me", response_model=list[Booking])
def list_my_bookings(user: dict[str, object] = Depends(customer_required)) -> list[Booking]:
    return [Booking(**booking) for booking in db_models.list_user_bookings(int(user["id"]))]


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


@app.post("/api/bookings/{booking_id}/demo-payment", response_model=DemoPaymentResult)
def pay_booking_in_demo(booking_id: int, data: BookingPaymentInput, user: dict[str, object] = Depends(customer_required), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key", min_length=8, max_length=200)) -> DemoPaymentResult:
    booking = db_models.get_booking(booking_id)
    if not booking or int(booking["user_id"]) != int(user["id"]):
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["booking_status"] == "cancelled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cancelled bookings cannot be paid")
    try:
        payment_row = db_models.create_booking_demo_payment(booking, user, data.payment_method, idempotency_key)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    payment = DemoPayment(**payment_row)
    return DemoPaymentResult(
        payment=payment,
        email_confirmation=f"Demo email confirmation prepared for {payment.email}.",
        whatsapp_confirmation=f"Demo WhatsApp template prepared for {payment.phone}.",
    )


@app.get("/api/staff/bookings", response_model=list[StaffBooking])
def list_staff_bookings(_: dict[str, object] = Depends(staff_required)) -> list[StaffBooking]:
    return [StaffBooking(**booking) for booking in db_models.list_staff_bookings()]


@app.patch("/api/staff/bookings/{booking_id}", response_model=StaffBooking)
def update_staff_booking(booking_id: int, data: BookingUpdate, account: dict[str, object] = Depends(staff_required)) -> StaffBooking:
    role = str(account["role"])
    if role == "support" and (data.booking_status != "cancelled" or data.payment_status is not None):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Support can only cancel bookings")
    if role == "operations" and data.payment_status is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an admin can update payment status")
    if data.booking_status is None and data.payment_status is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select a booking or payment status to update")
    booking = db_models.update_booking(booking_id, data.booking_status, data.payment_status)
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
    queued = []
    for channel in data.channels:
        if channel == "email":
            recipient = str(booking["customer_email"])
        else:
            customer = db_models.get_user(int(booking["user_id"]))
            recipient = str((customer or {}).get("phone", ""))
            if not recipient:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The traveller has no WhatsApp number on their profile")
        queued.append(db_models.queue_booking_confirmation(booking_id, recipient, channel, account.get("id") if isinstance(account.get("id"), int) else None))
    return {"message": "Confirmation delivery queued. Configure an email and WhatsApp provider to send it.", "notifications": queued}


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


@app.post("/api/admin/tours", response_model=Tour, status_code=status.HTTP_201_CREATED, dependencies=[Depends(admin_required)])
def create_tour(data: TourInput) -> Tour:
    tour = Tour(**db_models.save_tour(data.model_dump(mode="json")))
    return tour


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


@app.post("/api/demo-payments", response_model=DemoPaymentResult, status_code=status.HTTP_201_CREATED)
def create_demo_payment(data: DemoPaymentInput) -> DemoPaymentResult:
    payment = DemoPayment(**db_models.create_demo_payment(data.model_dump()))
    return DemoPaymentResult(
        payment=payment,
        email_confirmation=f"Demo email confirmation prepared for {payment.email}.",
        whatsapp_confirmation=f"Demo WhatsApp template prepared for {payment.phone}.",
    )


@app.get("/api/admin/demo-payments", response_model=PaginatedResponse[DemoPayment], dependencies=[Depends(admin_required)])
def list_admin_demo_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    search: str | None = Query(default=None, max_length=160),
) -> PaginatedResponse[DemoPayment]:
    items, total = db_models.paginate_demo_payments(page, page_size, search)
    return PaginatedResponse(items=[DemoPayment(**payment) for payment in items], total=total, page=page, page_size=page_size)


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
