"""Small, dependency-free client for Meta's WhatsApp Cloud API."""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from typing import Mapping
from urllib import error as urlerror
from urllib import request as urlrequest

import config


class WhatsAppConfigurationError(ValueError):
    """The service was enabled without the values needed to send a template."""


class WhatsAppDeliveryError(RuntimeError):
    """Meta did not accept or complete the send request."""


_PHONE_NUMBER_ID_PATTERN = re.compile(r"^\d+$")
_API_VERSION_PATTERN = re.compile(r"^v\d+\.\d+$")
_TEMPLATE_PARAMETER_KEYS = {
    "first_name",
    "booking_reference",
    "tour_title",
    "travel_date",
    "traveller_count",
}


def normalise_recipient(phone: str) -> str:
    """Return an E.164 number without ``+``, as required by Meta's API."""
    raw_phone = phone.strip()
    if not raw_phone or re.search(r"[A-Za-z]", raw_phone):
        raise ValueError("The traveller's WhatsApp number must include a country code.")

    digits = "".join(character for character in raw_phone if character.isdigit())
    if raw_phone.startswith("00"):
        digits = digits[2:]
    if not 8 <= len(digits) <= 15:
        raise ValueError("The traveller's WhatsApp number must include a country code.")
    return digits


def _template_parameter_values(booking: Mapping[str, object]) -> dict[str, str]:
    customer_name = str(booking.get("customer_name") or "Traveller").strip()
    travel_date = booking.get("travel_date")
    if isinstance(travel_date, (date, datetime)):
        display_date = travel_date.isoformat()
    else:
        display_date = str(travel_date or "")
    return {
        "first_name": customer_name.split(maxsplit=1)[0] or "Traveller",
        "booking_reference": f"NW-{booking.get('id', '')}",
        "tour_title": str(booking.get("tour_title") or ""),
        "travel_date": display_date,
        "traveller_count": str(booking.get("travellers") or ""),
    }


def _validate_configuration() -> None:
    if not config.META_WHATSAPP_ACCESS_TOKEN or not config.META_WHATSAPP_PHONE_NUMBER_ID:
        raise WhatsAppConfigurationError("WhatsApp Cloud API credentials are not configured.")
    if not config.META_WHATSAPP_TEMPLATE_NAME or not config.META_WHATSAPP_TEMPLATE_LANGUAGE:
        raise WhatsAppConfigurationError("WhatsApp template settings are not configured.")
    if not _PHONE_NUMBER_ID_PATTERN.fullmatch(config.META_WHATSAPP_PHONE_NUMBER_ID):
        raise WhatsAppConfigurationError("META_WHATSAPP_PHONE_NUMBER_ID must contain only digits.")
    if not _API_VERSION_PATTERN.fullmatch(config.META_WHATSAPP_API_VERSION):
        raise WhatsAppConfigurationError("META_WHATSAPP_API_VERSION must look like v24.0.")
    unknown_keys = set(config.META_WHATSAPP_TEMPLATE_PARAMETER_KEYS) - _TEMPLATE_PARAMETER_KEYS
    if unknown_keys:
        raise WhatsAppConfigurationError("META_WHATSAPP_TEMPLATE_PARAMETER_KEYS contains an unsupported value.")


def send_booking_confirmation(booking: Mapping[str, object], recipient: str) -> str:
    """Send the configured approved template and return Meta's message ID.

    Business-initiated WhatsApp messages must use an approved template. The
    configured parameter keys must be in the same order as the template body.
    """
    _validate_configuration()
    to = normalise_recipient(recipient)
    parameter_values = _template_parameter_values(booking)
    components: list[dict[str, object]] = []
    if config.META_WHATSAPP_TEMPLATE_PARAMETER_KEYS:
        components.append(
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": parameter_values[key]}
                    for key in config.META_WHATSAPP_TEMPLATE_PARAMETER_KEYS
                ],
            }
        )

    payload: dict[str, object] = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": config.META_WHATSAPP_TEMPLATE_NAME,
            "language": {"code": config.META_WHATSAPP_TEMPLATE_LANGUAGE},
        },
    }
    if components:
        payload["template"]["components"] = components  # type: ignore[index]

    endpoint = (
        f"https://graph.facebook.com/{config.META_WHATSAPP_API_VERSION}/"
        f"{config.META_WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    request = urlrequest.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {config.META_WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(request, timeout=15) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except urlerror.HTTPError as error:
        # Do not include Meta's response body here: it can contain customer or
        # provider details that should not be returned by a booking endpoint.
        raise WhatsAppDeliveryError(f"Meta WhatsApp rejected the message (HTTP {error.code}).") from error
    except (urlerror.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise WhatsAppDeliveryError("Meta WhatsApp could not be reached.") from error

    messages = response_payload.get("messages") if isinstance(response_payload, dict) else None
    if not isinstance(messages, list) or not messages or not isinstance(messages[0], dict):
        raise WhatsAppDeliveryError("Meta WhatsApp returned an unexpected response.")
    message_id = messages[0].get("id")
    if not isinstance(message_id, str) or not message_id:
        raise WhatsAppDeliveryError("Meta WhatsApp did not return a message ID.")
    return message_id
