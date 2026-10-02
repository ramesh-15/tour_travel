"""Environment-only application and third-party provider configuration."""

from __future__ import annotations

import os
from pathlib import Path


ENV_PATH = Path(__file__).with_name(".env")


def load_environment_file() -> None:
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_environment_file()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID")
PAYPAL_BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.paypal.com")

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_SES_FROM_EMAIL = os.getenv("AWS_SES_FROM_EMAIL")

META_WHATSAPP_ACCESS_TOKEN = os.getenv("META_WHATSAPP_ACCESS_TOKEN")
META_WHATSAPP_PHONE_NUMBER_ID = os.getenv("META_WHATSAPP_PHONE_NUMBER_ID")
META_WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("META_WHATSAPP_BUSINESS_ACCOUNT_ID")
META_WHATSAPP_VERIFY_TOKEN = os.getenv("META_WHATSAPP_VERIFY_TOKEN")
META_WHATSAPP_APP_SECRET = os.getenv("META_WHATSAPP_APP_SECRET")
META_WHATSAPP_API_VERSION = os.getenv("META_WHATSAPP_API_VERSION", "v24.0")
META_WHATSAPP_TEMPLATE_NAME = os.getenv("META_WHATSAPP_TEMPLATE_NAME", "").strip()
META_WHATSAPP_TEMPLATE_LANGUAGE = os.getenv("META_WHATSAPP_TEMPLATE_LANGUAGE", "en_US").strip()
META_WHATSAPP_TEMPLATE_PARAMETER_KEYS = tuple(
    key.strip()
    for key in os.getenv(
        "META_WHATSAPP_TEMPLATE_PARAMETER_KEYS",
        "first_name,booking_reference,tour_title,travel_date,traveller_count",
    ).split(",")
    if key.strip()
)
META_WHATSAPP_ADMIN_RECIPIENTS = tuple(
    number.strip()
    for number in os.getenv("META_WHATSAPP_ADMIN_RECIPIENTS", "").split(",")
    if number.strip()
)


def provider_readiness() -> dict[str, bool]:
    """Return configuration presence only; never expose credential values."""
    return {
        "razorpay": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET),
        "paypal": bool(PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET and PAYPAL_WEBHOOK_ID),
        "aws_ses": bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_REGION and AWS_SES_FROM_EMAIL),
        # Sending through the Cloud API only requires the access token, sender
        # phone-number ID, and an approved message template. The verify token
        # and app secret are only needed when webhook verification is enabled.
        "meta_whatsapp": bool(
            META_WHATSAPP_ACCESS_TOKEN
            and META_WHATSAPP_PHONE_NUMBER_ID
            and META_WHATSAPP_TEMPLATE_NAME
            and META_WHATSAPP_TEMPLATE_LANGUAGE
        ),
    }
