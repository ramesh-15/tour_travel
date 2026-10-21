"""Regression tests for immediate booking-confirmation email delivery."""

from __future__ import annotations

import hashlib
import hmac
import sys
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).parent))

import config  # noqa: E402
import email_delivery  # noqa: E402
import main  # noqa: E402


BOOKING = {
    "id": 42,
    "user_id": 7,
    "tour_id": 12,
    "tour_title": "Mumbai Food Walk",
    "city": "Mumbai",
    "duration": "4 hours",
    "image_url": "https://example.test/tours/mumbai-food-walk.jpg",
    "price": 2250,
    "booking_mode": "Shared",
    "duration_option_id": "four-hours",
    "travel_date": date(2026, 11, 1),
    "travellers": 2,
    "contact_phone": "+919876543210",
    "special_requests": "",
    "booking_status": "confirmed",
    "payment_status": "paid",
    "created_at": datetime(2026, 10, 20, tzinfo=timezone.utc),
    "customer_name": "Asha Patel",
    "customer_email": "asha@example.com",
}


class DirectEmailConfirmationTests(unittest.TestCase):
    def test_direct_email_records_a_sent_provider_hand_off(self) -> None:
        notification = {"id": 8, "delivery_status": "queued"}
        sent_notification = {"id": 8, "delivery_status": "sent"}
        with (
            patch("main.db_models.start_booking_confirmation_delivery", return_value=notification) as queue,
            patch("main.email_delivery.send_booking_confirmation") as send,
            patch("main.db_models.update_booking_confirmation_status", return_value=sent_notification) as update,
        ):
            result = main.deliver_email_booking_confirmation(
                BOOKING, "asha@example.com", requested_by=3
            )

        self.assertEqual(result, sent_notification)
        queue.assert_called_once_with(42, "asha@example.com", "email", 3)
        send.assert_called_once_with(BOOKING, "asha@example.com")
        update.assert_called_once_with(8, "sent")

    def test_direct_email_failure_is_recorded_without_a_queue_retry(self) -> None:
        notification = {"id": 9, "delivery_status": "queued"}
        failed_notification = {"id": 9, "delivery_status": "failed"}
        with (
            patch("main.db_models.start_booking_confirmation_delivery", return_value=notification),
            patch(
                "main.email_delivery.send_booking_confirmation",
                side_effect=email_delivery.EmailDeliveryError("provider unavailable"),
            ),
            patch("main.db_models.update_booking_confirmation_status", return_value=failed_notification) as update,
        ):
            result = main.deliver_email_booking_confirmation(
                BOOKING, "asha@example.com", requested_by=None
            )

        self.assertEqual(result, failed_notification)
        update.assert_called_once_with(9, "failed")

    def test_newly_verified_payment_hands_email_to_smtp_once(self) -> None:
        secret = "test-razorpay-secret"
        order_id = "order_123"
        payment_id = "pay_123"
        signature = hmac.new(
            secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256
        ).hexdigest()
        request = main.RazorpayVerifyPaymentInput(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        )
        with (
            patch.object(config, "RAZORPAY_KEY_SECRET", secret),
            patch("main.db_models.complete_razorpay_payment", return_value=(BOOKING, True)),
            patch("main.db_models.get_user", return_value={"phone": "+919876543210"}),
            patch("main.deliver_email_booking_confirmation", return_value={"delivery_status": "sent"}) as email,
            patch("main.deliver_booking_whatsapp_confirmations", return_value=[]) as whatsapp,
        ):
            result = main.verify_razorpay_payment(request, {"id": 7})

        self.assertTrue(result.success)
        email.assert_called_once_with(BOOKING, "asha@example.com", None)
        whatsapp.assert_called_once_with(BOOKING, "+919876543210", None)

    def test_repeated_verified_payment_does_not_send_a_duplicate_email(self) -> None:
        secret = "test-razorpay-secret"
        order_id = "order_123"
        payment_id = "pay_123"
        signature = hmac.new(
            secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256
        ).hexdigest()
        request = main.RazorpayVerifyPaymentInput(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        )
        with (
            patch.object(config, "RAZORPAY_KEY_SECRET", secret),
            patch("main.db_models.complete_razorpay_payment", return_value=(BOOKING, False)),
            patch("main.deliver_email_booking_confirmation") as email,
            patch("main.deliver_booking_whatsapp_confirmations") as whatsapp,
        ):
            result = main.verify_razorpay_payment(request, {"id": 7})

        self.assertTrue(result.success)
        email.assert_not_called()
        whatsapp.assert_not_called()

    def test_staff_resend_reports_immediate_email_delivery(self) -> None:
        with (
            patch("main.db_models.get_booking", return_value=BOOKING),
            patch(
                "main.deliver_email_booking_confirmation",
                return_value={"id": 10, "delivery_status": "sent"},
            ) as email,
        ):
            result = main.resend_booking_confirmation(
                42,
                main.ConfirmationRequest(channels=["email"]),
                {"id": 3, "role": "support"},
            )

        self.assertEqual(result["message"], "1 email confirmation sent")
        self.assertEqual(result["notifications"], [{"id": 10, "delivery_status": "sent"}])
        email.assert_called_once_with(BOOKING, "asha@example.com", 3)

    def test_manual_staff_confirmation_sends_email_on_the_status_transition(self) -> None:
        pending_booking = {**BOOKING, "booking_status": "pending", "payment_status": "unpaid"}
        with (
            patch("main.db_models.get_booking", return_value=pending_booking),
            patch("main.db_models.update_booking", return_value=BOOKING),
            patch("main.deliver_email_booking_confirmation") as email,
        ):
            result = main.update_staff_booking(
                42,
                main.BookingUpdate(booking_status="confirmed"),
                {"id": 3, "role": "admin"},
            )

        self.assertEqual(result.booking_status, "confirmed")
        email.assert_called_once_with(BOOKING, "asha@example.com", 3)


if __name__ == "__main__":
    unittest.main()
