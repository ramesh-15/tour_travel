"""Unit tests for direct SMTP booking-confirmation delivery."""

from __future__ import annotations

import smtplib
import sys
import unittest
from contextlib import ExitStack, contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch


sys.path.insert(0, str(Path(__file__).parent))

import config  # noqa: E402
import email_delivery  # noqa: E402


@contextmanager
def smtp_configuration(**overrides: object):
    settings: dict[str, object] = {
        "SMTP_HOST": "smtp.example.com",
        "SMTP_PORT": 587,
        "SMTP_USERNAME": "mailer",
        "SMTP_PASSWORD": "secret",
        "SMTP_FROM_EMAIL": "bookings@nomad.example",
        "SMTP_FROM_NAME": "Nomad Wanderers",
    }
    settings.update(overrides)
    with ExitStack() as stack:
        for name, value in settings.items():
            stack.enter_context(patch.object(config, name, value, create=True))
        yield


BOOKING = {
    "id": 42,
    "customer_name": "Asha Patel",
    "tour_title": "Mumbai Food Walk",
    "travel_date": "2026-11-01",
    "travellers": 2,
    "booking_status": "confirmed",
    "payment_status": "paid",
}


class EmailDeliveryTests(unittest.TestCase):
    def test_starttls_sends_a_multipart_confirmation_with_all_booking_details(self) -> None:
        smtp_client = MagicMock()
        smtp_client.__enter__.return_value = smtp_client

        with (
            smtp_configuration(),
            patch("email_delivery.smtplib.SMTP", return_value=smtp_client) as smtp,
        ):
            result = email_delivery.send_booking_confirmation(BOOKING, "asha@example.com")

        self.assertIsNone(result)
        smtp.assert_called_once_with("smtp.example.com", 587, timeout=15)
        smtp_client.starttls.assert_called_once()
        smtp_client.login.assert_called_once_with("mailer", "secret")
        smtp_client.send_message.assert_called_once()
        message = smtp_client.send_message.call_args.args[0]
        self.assertEqual(message["To"], "asha@example.com")
        self.assertEqual(message["From"], "Nomad Wanderers <bookings@nomad.example>")
        self.assertIn("NW-42", message["Subject"])
        self.assertEqual(message.get_content_type(), "multipart/alternative")
        self.assertIn("Mumbai Food Walk", message.get_body(("plain",)).get_content())
        html_body = message.get_body(("html",)).get_content()
        for value in ("NW-42", "Asha Patel", "2026-11-01", "confirmed", "paid"):
            self.assertIn(value, html_body)

    def test_ssl_port_uses_smtp_ssl_and_does_not_log_in_without_a_username(self) -> None:
        smtp_client = MagicMock()
        smtp_client.__enter__.return_value = smtp_client

        with (
            smtp_configuration(SMTP_PORT=465, SMTP_USERNAME="", SMTP_PASSWORD=""),
            patch("email_delivery.smtplib.SMTP_SSL", return_value=smtp_client) as smtp_ssl,
            patch("email_delivery.smtplib.SMTP") as smtp,
        ):
            email_delivery.send_booking_confirmation(BOOKING, "asha@example.com")

        smtp_ssl.assert_called_once()
        smtp.assert_not_called()
        smtp_client.starttls.assert_not_called()
        smtp_client.login.assert_not_called()
        smtp_client.send_message.assert_called_once()

    def test_invalid_recipient_never_opens_an_smtp_connection(self) -> None:
        with (
            smtp_configuration(),
            patch("email_delivery.smtplib.SMTP") as smtp,
            self.assertRaisesRegex(ValueError, "valid email"),
        ):
            email_delivery.send_booking_confirmation(BOOKING, "not-an-email")

        smtp.assert_not_called()

    def test_incomplete_credentials_are_a_configuration_error(self) -> None:
        with (
            smtp_configuration(SMTP_USERNAME="mailer", SMTP_PASSWORD=""),
            self.assertRaisesRegex(email_delivery.EmailConfigurationError, "SMTP_PASSWORD"),
        ):
            email_delivery.send_booking_confirmation(BOOKING, "asha@example.com")

    def test_smtp_failure_is_a_delivery_error(self) -> None:
        smtp_client = MagicMock()
        smtp_client.__enter__.return_value = smtp_client
        smtp_client.send_message.side_effect = smtplib.SMTPException("provider unavailable")

        with (
            smtp_configuration(),
            patch("email_delivery.smtplib.SMTP", return_value=smtp_client),
            self.assertRaisesRegex(email_delivery.EmailDeliveryError, "could not be delivered"),
        ):
            email_delivery.send_booking_confirmation(BOOKING, "asha@example.com")


if __name__ == "__main__":
    unittest.main()
