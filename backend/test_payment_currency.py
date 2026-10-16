"""Currency conversion and server-authoritative payment regression tests."""

from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import HTTPException, Response
import config
import main
import payment_currency


class ExchangeRateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.cache_patch = patch.object(payment_currency, "_rate_cache", None)
        self.cache_patch.start()
        self.addCleanup(self.cache_patch.stop)

    def response(self, rate: float = 0.01044) -> MagicMock:
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({
            "amount": 1, "base": "INR", "date": datetime.now(timezone.utc).date().isoformat(),
            "rates": {"USD": rate},
        }).encode()
        return response

    def test_exact_conversion_and_cent_rounding(self) -> None:
        self.assertEqual(payment_currency.payment_amount_in_subunits(130000, "INR"), 130000)
        self.assertEqual(payment_currency.payment_amount_in_subunits(130000, "USD", Decimal("0.01044")), 1357)
        self.assertEqual(payment_currency.payment_amount_in_subunits(100050, "USD", Decimal("0.01")), 1001)

    def test_reference_rates_are_validated_and_cached(self) -> None:
        with patch("payment_currency.urlrequest.urlopen", return_value=self.response()) as fetch:
            first = payment_currency.get_usd_exchange_rate()
            self.assertEqual(first[0], Decimal("0.01044"))
            self.assertEqual(first, payment_currency.get_usd_exchange_rate())
            fetch.assert_called_once()
            request = fetch.call_args.args[0]
            self.assertEqual(request.get_header("Accept"), "application/json")
            self.assertEqual(request.get_header("User-agent"), "NomadWanderers/1.0 (currency-conversion)")

    def test_v2_pair_endpoint_is_used_if_the_primary_request_is_rejected(self) -> None:
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({
            "base": "INR", "quote": "USD", "rate": 0.01044,
            "date": datetime.now(timezone.utc).date().isoformat(),
        }).encode()
        rejected = HTTPError(payment_currency.EXCHANGE_RATE_URL, 403, "Forbidden", {}, None)
        with patch("payment_currency.urlrequest.urlopen", side_effect=[rejected, response]) as fetch:
            self.assertEqual(payment_currency.get_usd_exchange_rate()[0], Decimal("0.01044"))
        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(fetch.call_args.args[0].full_url, payment_currency.EXCHANGE_RATE_FALLBACK_URL)

    def test_fallback_rejects_wrong_currency_stale_and_malformed_data(self) -> None:
        for invalid in [
            {"base": "USD", "quote": "INR", "rate": 0.01, "date": "2026-01-01"},
            {"base": "INR", "quote": "EUR", "rate": 0.01, "date": datetime.now(timezone.utc).date().isoformat()},
            {"base": "INR", "quote": "USD", "rate": 0.01, "date": "2000-01-01"},
            {"base": "INR", "quote": "USD", "rate": "NaN", "date": datetime.now(timezone.utc).date().isoformat()},
            [],
        ]:
            with self.subTest(body=invalid):
                response = MagicMock()
                response.__enter__.return_value = response
                response.read.return_value = json.dumps(invalid).encode()
                with patch("payment_currency.urlrequest.urlopen", side_effect=[TimeoutError(), response]):
                    with self.assertRaises(payment_currency.ExchangeRateUnavailable):
                        payment_currency.get_usd_exchange_rate()

    def test_unavailable_or_invalid_rates_never_use_a_guessed_conversion(self) -> None:
        with patch("payment_currency.urlrequest.urlopen", side_effect=TimeoutError):
            with self.assertRaises(payment_currency.ExchangeRateUnavailable):
                payment_currency.get_usd_exchange_rate()
        with patch("payment_currency.urlrequest.urlopen", return_value=self.response(-1)):
            with self.assertRaises(payment_currency.ExchangeRateUnavailable):
                payment_currency.get_usd_exchange_rate()
        with self.assertRaises(payment_currency.ExchangeRateUnavailable):
            payment_currency.payment_amount_in_subunits(130000, "USD")

    def test_expired_rate_is_not_used_during_a_provider_outage(self) -> None:
        payment_currency._rate_cache = Decimal("0.01"), "2026-01-01", -1000000
        with patch("payment_currency.urlrequest.urlopen", side_effect=TimeoutError):
            with self.assertRaises(payment_currency.ExchangeRateUnavailable):
                payment_currency.get_usd_exchange_rate()


class PaymentQuoteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.booking = {"id": 30, "user_id": 7, "price": Decimal("650.00"), "travellers": 2, "booking_status": "pending", "payment_status": "unpaid"}
        self.user = {"id": 7}
        for patcher in [
            patch.object(config, "RAZORPAY_KEY_SECRET", "test-payment-secret"),
            patch.object(config, "RAZORPAY_KEY_ID", "test-key-id"),
            patch("payment_currency.get_usd_exchange_rate", return_value=(Decimal("0.01044"), "2026-10-12")),
            patch("main.db_models.get_booking", side_effect=lambda _id: self.booking),
        ]:
            patcher.start()
            self.addCleanup(patcher.stop)

    def quote(self, currency: str = "USD") -> main.PaymentQuote:
        return main.get_booking_payment_quote(30, Response(), currency, self.user)

    def order_input(self, quote: main.PaymentQuote, **overrides: object) -> main.RazorpayCreateOrderInput:
        values = {
            "booking_id": 30, "amount": quote.amount, "currency": quote.currency,
            "quote_token": quote.quote_token, "receipt": "booking-30", "terms_accepted": True,
        }
        values.update(overrides)
        return main.RazorpayCreateOrderInput(**values)

    def test_dollar_quote_produces_and_persists_a_dollar_order(self) -> None:
        quote = self.quote()
        self.assertEqual((quote.currency, quote.amount), ("USD", 1357))
        with (
            patch("main.create_razorpay_order_request", return_value={"id": "order_test"}) as gateway,
            patch("main.db_models.create_razorpay_order") as store,
            patch("payment_currency.get_usd_exchange_rate", side_effect=AssertionError("Do not reprice a confirmed quote")),
        ):
            order = main.create_razorpay_order(self.order_input(quote), self.user)
        self.assertEqual((order.currency, order.amount), ("USD", 1357))
        gateway.assert_called_once_with(1357, "USD", "booking-30")
        self.assertEqual(store.call_args.kwargs["currency"], "USD")
        self.assertEqual(store.call_args.kwargs["amount"], 1357)
        self.assertEqual(self.booking["price"], Decimal("650.00"))

    def test_inr_payments_continue_to_use_the_saved_booking_total(self) -> None:
        quote = self.quote("INR")
        self.assertEqual(quote.amount, 130000)
        with patch("main.create_razorpay_order_request", return_value={"id": "order_inr"}) as gateway, patch("main.db_models.create_razorpay_order"):
            main.create_razorpay_order(self.order_input(quote, quote_token=None), self.user)
        gateway.assert_called_once_with(130000, "INR", "booking-30")

    def test_razorpay_request_uses_usd_and_cents(self) -> None:
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({"id": "order_usd", "amount": 1357, "currency": "USD"}).encode()
        with patch("main.urlrequest.urlopen", return_value=response) as send:
            result = main.create_razorpay_order_request(1357, "USD", "booking-30")
        self.assertEqual(json.loads(send.call_args.args[0].data), {"amount": 1357, "currency": "USD", "receipt": "booking-30"})
        self.assertEqual(result["currency"], "USD")

    def test_mismatched_gateway_currency_is_rejected(self) -> None:
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({"id": "order_wrong", "amount": 1357, "currency": "INR"}).encode()
        with patch("main.urlrequest.urlopen", return_value=response):
            with self.assertRaises(HTTPException) as raised:
                main.create_razorpay_order_request(1357, "USD", "booking-30")
        self.assertEqual(raised.exception.status_code, 502)

    def test_modified_amount_currency_and_token_are_rejected_before_gateway(self) -> None:
        quote = self.quote()
        for overrides in [{"amount": 1358}, {"currency": "INR"}, {"quote_token": quote.quote_token + "x"}, {"quote_token": None}]:
            with self.subTest(overrides=overrides), patch("main.create_razorpay_order_request") as gateway:
                with self.assertRaises(HTTPException) as raised:
                    main.create_razorpay_order(self.order_input(quote, **overrides), self.user)
                self.assertEqual(raised.exception.status_code, 422)
                gateway.assert_not_called()

    def test_quote_cannot_be_reused_for_a_changed_booking_or_customer(self) -> None:
        quote = self.quote()
        self.booking["price"] = Decimal("700")
        with self.assertRaises(HTTPException):
            main.validate_payment_quote(self.order_input(quote), self.booking, 7)
        self.booking["price"] = Decimal("650")
        with self.assertRaises(HTTPException):
            main.validate_payment_quote(self.order_input(quote), self.booking, 8)

    def test_expired_quotes_require_refreshing(self) -> None:
        quote = self.quote()
        payload, _signature = quote.quote_token.split(".")
        claims = json.loads(main.base64url_decode(payload))
        claims["expires_at"] = 1
        payload = main.base64url_encode(json.dumps(claims).encode())
        token = f"{payload}.{main.payment_quote_signature(payload)}"
        with self.assertRaises(HTTPException) as raised:
            main.validate_payment_quote(self.order_input(quote, quote_token=token), self.booking, 7)
        self.assertEqual(raised.exception.status_code, 409)

    def test_ownership_booking_status_and_terms_are_enforced(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            main.get_payable_booking(30, 8)
        self.assertEqual(raised.exception.status_code, 404)
        quote = self.quote()
        with self.assertRaises(HTTPException):
            main.create_razorpay_order(self.order_input(quote, terms_accepted=False), self.user)
        for field, value in [("booking_status", "cancelled"), ("payment_status", "paid")]:
            original = self.booking[field]
            self.booking[field] = value
            with self.assertRaises(HTTPException) as raised:
                self.quote()
            self.assertEqual(raised.exception.status_code, 409)
            self.booking[field] = original

    def test_unsupported_currency_and_rate_failures_do_not_create_orders(self) -> None:
        with self.assertRaises(HTTPException):
            main.create_payment_quote(self.booking, 7, "EUR")
        with patch("payment_currency.get_usd_exchange_rate", side_effect=payment_currency.ExchangeRateUnavailable("Rate unavailable")):
            with self.assertRaises(HTTPException) as raised:
                self.quote()
        self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
