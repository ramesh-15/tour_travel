"""Regression tests for the WhatsApp Cloud API message payload."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, call, patch


sys.path.insert(0, str(Path(__file__).parent))

import config  # noqa: E402
import main  # noqa: E402
import whatsapp  # noqa: E402


class WhatsAppTemplatePayloadTests(unittest.TestCase):
    def test_booking_template_uses_configured_parameter_order(self) -> None:
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({"messages": [{"id": "wamid.test"}]}).encode()

        with (
            patch.object(config, "META_WHATSAPP_ACCESS_TOKEN", "test-token"),
            patch.object(config, "META_WHATSAPP_PHONE_NUMBER_ID", "1307104352491372"),
            patch.object(config, "META_WHATSAPP_TEMPLATE_NAME", "booking_confirmation"),
            patch.object(config, "META_WHATSAPP_TEMPLATE_LANGUAGE", "en_US"),
            patch.object(
                config,
                "META_WHATSAPP_TEMPLATE_PARAMETER_KEYS",
                ("first_name", "booking_reference", "tour_title", "travel_date", "traveller_count"),
            ),
            patch("whatsapp.urlrequest.urlopen", return_value=response) as urlopen,
        ):
            message_id = whatsapp.send_booking_confirmation(
                {
                    "id": 42,
                    "customer_name": "Asha Patel",
                    "tour_title": "Mumbai Walk",
                    "travel_date": "2026-10-01",
                    "travellers": 2,
                },
                "+91 98765 43210",
            )

        payload = json.loads(urlopen.call_args.args[0].data)
        self.assertEqual(message_id, "wamid.test")
        self.assertEqual(payload["to"], "919876543210")
        self.assertEqual(
            [parameter["text"] for parameter in payload["template"]["components"][0]["parameters"]],
            ["Asha", "NW-42", "Mumbai Walk", "2026-10-01", "2"],
        )


class WhatsAppConfirmationRecipientTests(unittest.TestCase):
    def test_booking_contact_and_unique_admin_numbers_receive_confirmation(self) -> None:
        booking = {"id": 42, "contact_phone": "+91 98765 43210"}
        with (
            patch.object(
                config,
                "META_WHATSAPP_ADMIN_RECIPIENTS",
                ("+1 (202) 555-0100", "+91 98765 43210"),
            ),
            patch(
                "main.deliver_whatsapp_booking_confirmation",
                side_effect=[{"id": 1, "delivery_status": "sent"}, {"id": 2, "delivery_status": "sent"}],
            ) as send_confirmation,
        ):
            notifications = main.deliver_booking_whatsapp_confirmations(
                booking,
                profile_phone="",
                requested_by=7,
            )

        self.assertEqual(len(notifications), 2)
        self.assertEqual(
            send_confirmation.call_args_list,
            [
                call(booking, "919876543210", 7),
                call(booking, "12025550100", 7),
            ],
        )


if __name__ == "__main__":
    unittest.main()
