"""Direct SMTP delivery for booking-confirmation emails.

This module deliberately sends through SMTP in the request path.  It has no
queue or cache dependency, so a successful call means the configured SMTP
provider has accepted the message immediately.
"""

from __future__ import annotations

import re
import smtplib
import ssl
from datetime import date, datetime
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from typing import Mapping
import os
from pathlib import Path
import config


SMTP_TIMEOUT_SECONDS = 15

# Booking confirmations are handed directly to the configured SMTP provider.
# They deliberately do not depend on Redis or an asynchronous queue.
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = os.getenv("SMTP_PORT", "587").strip()
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "").strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Nomad Wanderers").strip() or "Nomad Wanderers"


class EmailConfigurationError(ValueError):
    """SMTP is missing or contains an invalid setting."""


class EmailDeliveryError(RuntimeError):
    """The SMTP provider could not accept a confirmation email."""


_EMAIL_PATTERN = re.compile(r"^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$")


def validate_recipient(recipient: str) -> str:
    """Validate and normalise the destination address used for SMTP delivery."""
    if not isinstance(recipient, str):
        raise ValueError("The email recipient must be an email address.")
    address = recipient.strip()
    if len(address) > 254 or not _EMAIL_PATTERN.fullmatch(address):
        raise ValueError("The email recipient must be a valid email address.")
    return address


def _setting(name: str) -> str:
    value = getattr(config, name, "")
    return str(value or "").strip()


def _smtp_settings() -> tuple[str, int, str, str, str, str]:
    host = _setting("SMTP_HOST")
    from_email = _setting("SMTP_FROM_EMAIL")
    username = _setting("SMTP_USERNAME")
    password = _setting("SMTP_PASSWORD")
    from_name = _setting("SMTP_FROM_NAME") or "Nomad Wanderers"
    raw_port = getattr(config, "SMTP_PORT", None)

    if not host:
        raise EmailConfigurationError("SMTP_HOST is not configured.")
    try:
        if isinstance(raw_port, bool):
            raise ValueError
        port = int(str(raw_port).strip())
    except (TypeError, ValueError):
        raise EmailConfigurationError("SMTP_PORT must be a number between 1 and 65535.") from None
    if not 1 <= port <= 65535:
        raise EmailConfigurationError("SMTP_PORT must be a number between 1 and 65535.")
    try:
        validate_recipient(from_email)
    except ValueError as error:
        raise EmailConfigurationError("SMTP_FROM_EMAIL must be a valid email address.") from error
    if username and not password:
        raise EmailConfigurationError("SMTP_PASSWORD is required when SMTP_USERNAME is configured.")
    if password and not username:
        raise EmailConfigurationError("SMTP_USERNAME is required when SMTP_PASSWORD is configured.")
    if "\r" in from_name or "\n" in from_name:
        raise EmailConfigurationError("SMTP_FROM_NAME must not contain a line break.")

    return host, port, username, password, from_email, from_name


def _display_value(value: object, fallback: str) -> str:
    if isinstance(value, (date, datetime)):
        value = value.isoformat()
    text = str(value or "").strip()
    return text or fallback


def _booking_values(booking: Mapping[str, object]) -> dict[str, str]:
    booking_id = _display_value(booking.get("id"), "")
    supplied_reference = _display_value(
        booking.get("booking_reference") or booking.get("reference"), ""
    )
    return {
        "reference": supplied_reference or f"NW-{booking_id or '—'}",
        "traveller": _display_value(
            booking.get("customer_name") or booking.get("traveller_name"), "Traveller"
        ),
        "tour": _display_value(booking.get("tour_title") or booking.get("tour_name"), "Your tour"),
        "travel_date": _display_value(booking.get("travel_date"), "Not set"),
        "travellers": _display_value(booking.get("travellers") or booking.get("traveller_count"), "Not set"),
        "booking_status": _display_value(booking.get("booking_status"), "Confirmed"),
        "payment_status": _display_value(booking.get("payment_status"), "Paid"),
    }


def build_booking_confirmation(booking: Mapping[str, object], recipient: str) -> EmailMessage:
    """Build a multipart booking confirmation without contacting SMTP."""
    to = validate_recipient(recipient)
    _, _, _, _, from_email, from_name = _smtp_settings()
    values = _booking_values(booking)

    message = EmailMessage()
    message["From"] = formataddr((from_name, from_email))
    message["To"] = to
    message["Subject"] = f"Your Nomad Wanderers booking confirmation — {values['reference']}"

    message.set_content(
        "Hello {traveller},\n\n"
        "Your Nomad Wanderers booking confirmation is below.\n\n"
        "Booking reference: {reference}\n"
        "Traveller: {traveller}\n"
        "Tour: {tour}\n"
        "Travel date: {travel_date}\n"
        "Travellers: {travellers}\n"
        "Booking status: {booking_status}\n"
        "Payment status: {payment_status}\n\n"
        "We look forward to travelling with you.\n"
        .format(**values)
    )

    escaped = {key: escape(value) for key, value in values.items()}
    message.add_alternative(
        "<html><body>"
        f"<p>Hello {escaped['traveller']},</p>"
        "<p>Your Nomad Wanderers booking confirmation is below.</p>"
        "<table>"
        f"<tr><th align=\"left\">Booking reference</th><td>{escaped['reference']}</td></tr>"
        f"<tr><th align=\"left\">Traveller</th><td>{escaped['traveller']}</td></tr>"
        f"<tr><th align=\"left\">Tour</th><td>{escaped['tour']}</td></tr>"
        f"<tr><th align=\"left\">Travel date</th><td>{escaped['travel_date']}</td></tr>"
        f"<tr><th align=\"left\">Travellers</th><td>{escaped['travellers']}</td></tr>"
        f"<tr><th align=\"left\">Booking status</th><td>{escaped['booking_status']}</td></tr>"
        f"<tr><th align=\"left\">Payment status</th><td>{escaped['payment_status']}</td></tr>"
        "</table><p>We look forward to travelling with you.</p>"
        "</body></html>",
        subtype="html",
    )
    return message


def send_booking_confirmation(booking: Mapping[str, object], recipient: str) -> None:
    """Send a booking confirmation directly to SMTP with a 15-second timeout."""
    host, port, username, password, _, _ = _smtp_settings()
    message = build_booking_confirmation(booking, recipient)
    tls_context = ssl.create_default_context()

    try:
        if port == 465:
            smtp_client = smtplib.SMTP_SSL(
                host,
                port,
                timeout=SMTP_TIMEOUT_SECONDS,
                context=tls_context,
            )
        else:
            smtp_client = smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT_SECONDS)

        with smtp_client as smtp:
            if port != 465:
                smtp.ehlo()
                smtp.starttls(context=tls_context)
                smtp.ehlo()
            if username:
                smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException, TimeoutError) as error:
        raise EmailDeliveryError("The booking confirmation email could not be delivered.") from error



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
    logger.info("SMTP Username: %s", SMTP_USERNAME)
    logger.info("SMTP From Email: %s", SMTP_FROM_EMAIL)
    logger.info("SMTP Password Configured: %s", bool(SMTP_PASSWORD))
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

    customer_name = str(
        booking.get("customer_name")
        or customer.get("name")
        or "Guest"
    )

    tour_name = str(booking.get("tour_title") or "Your Tour")
    city = str(booking.get("city") or "Not specified")

    travel_date = booking.get("travel_date")
    if isinstance(travel_date, (date, datetime)):
        travel_date = travel_date.strftime("%d %B %Y")
    else:
        travel_date = str(travel_date or "To be confirmed")

    travellers = int(booking.get("travellers") or 1)

    duration = str(
        booking.get("selected_duration")
        or booking.get("duration")
        or "Not specified"
    )

    booking_mode = str(booking.get("booking_mode") or "Shared")
    guide_name = str(booking.get("guide_name") or "To be assigned")
    booking_status = str(booking.get("booking_status") or "pending").title()
    payment_status = str(booking.get("payment_status") or "unpaid").title()

    unit_price = Decimal(str(booking.get("unit_price") or "0"))
    total_amount = unit_price * travellers

    currency = str(booking.get("currency") or "INR").upper()
    currency_symbol = {
        "INR": "₹",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
    }.get(currency, currency + " ")

    formatted_amount = f"{currency_symbol}{total_amount:,.2f}"

    special_requests = str(booking.get("special_requests") or "")
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
