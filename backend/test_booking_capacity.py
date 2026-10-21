"""Unit tests for per-duration and per-mode booking capacity selection."""

from __future__ import annotations

from contextlib import nullcontext
from datetime import date
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch


sys.path.insert(0, str(Path(__file__).parent))

import db_models
import main


class BookingCapacityTests(unittest.TestCase):
    travel_date = date(2026, 12, 1)

    def duration_tour(self) -> dict[str, object]:
        return {
            "capacity": 20,
            "price": 1200,
            "private_price": 1800,
            "mode": "Both",
            "duration": "8 hours",
            "pricing": {
                "duration_options": [
                    {
                        "id": "half-day",
                        "duration": "4 hours",
                        "duration_value": 4,
                        "duration_unit": "hours",
                        "available_modes": ["Shared", "Private"],
                        "shared_slots": 4,
                        "private_slots": 2,
                        "shared_tiers": [{"travellers": 2, "price_per_person": 1200}],
                        "private_tiers": [{"travellers": 1, "price_per_person": 1800}],
                    }
                ]
            },
        }

    def create_with_mocks(
        self,
        tour: dict[str, object],
        data: dict[str, object],
        *,
        selected_capacity: int | None = None,
        reserved_rows: list[dict[str, object]] | None = None,
    ) -> tuple[dict[str, object], MagicMock, MagicMock]:
        connection = MagicMock()
        booking = {"id": 101, "tour_id": data["tour_id"]}
        fetch_all = MagicMock(return_value=reserved_rows or [])
        insert = MagicMock(return_value=101)
        with (
            patch.object(db_models, "database", return_value=nullcontext(connection)),
            patch.object(db_models, "_claim_idempotency", return_value=None),
            patch.object(db_models, "_complete_idempotency"),
            patch.object(db_models, "_fetch_one", side_effect=[tour, booking]),
            patch.object(db_models, "_fetch_all", fetch_all),
            patch.object(db_models, "_insert_and_get_id", insert),
        ):
            result = db_models.create_booking(
                7,
                data,
                "booking-capacity-test",
                selected_capacity=selected_capacity,
            )
        return result, fetch_all, insert

    def test_duration_options_keep_numeric_duration_and_slot_configuration(self) -> None:
        options = db_models._tour_duration_options(self.duration_tour(), self.duration_tour()["pricing"])

        self.assertEqual(len(options), 1)
        self.assertEqual(options[0]["duration_value"], 4)
        self.assertEqual(options[0]["duration_unit"], "hours")
        self.assertEqual(options[0]["shared_slots"], 4)
        self.assertEqual(options[0]["private_slots"], 2)
        self.assertEqual(db_models._duration_option_slot_capacity(options[0], "Private"), 2)

    def test_configured_slots_scope_reservations_by_duration_and_mode(self) -> None:
        data = {
            "tour_id": 42,
            "travel_date": self.travel_date,
            "travellers": 2,
            "booking_mode": "Shared",
            "duration_option_id": "half-day",
            "contact_phone": "+919999999999",
            "special_requests": "",
        }
        result, fetch_all, insert = self.create_with_mocks(
            self.duration_tour(),
            data,
            selected_capacity=4,
            reserved_rows=[{"travellers": 2}],
        )

        self.assertEqual(result["id"], 101)
        query, parameters = fetch_all.call_args.args[1:]
        self.assertIn("duration_option_id = %s", query)
        self.assertIn("booking_mode = %s", query)
        self.assertIn("FOR UPDATE", query)
        self.assertEqual(parameters, (42, self.travel_date, "half-day", "Shared"))
        inserted = insert.call_args.args[2]
        self.assertEqual(inserted[4:6], ("Shared", "half-day"))

    def test_legacy_tour_without_slots_keeps_one_tour_day_capacity_pool(self) -> None:
        tour = {
            "capacity": 3,
            "price": 1000,
            "private_price": None,
            "mode": "Shared",
            "duration": "3 hours",
            "pricing": {},
        }
        data = {
            "tour_id": 9,
            "travel_date": self.travel_date,
            "travellers": 1,
            "contact_phone": "+919999999999",
            "special_requests": "",
        }
        _, fetch_all, _ = self.create_with_mocks(tour, data, reserved_rows=[{"travellers": 2}])

        query, parameters = fetch_all.call_args.args[1:]
        self.assertNotIn("duration_option_id = %s", query)
        self.assertNotIn("booking_mode = %s", query)
        self.assertEqual(parameters, (9, self.travel_date))

    def test_explicit_capacity_cannot_disagree_with_configured_mode_slots(self) -> None:
        data = {
            "tour_id": 42,
            "travel_date": self.travel_date,
            "travellers": 2,
            "booking_mode": "Shared",
            "duration_option_id": "half-day",
            "contact_phone": "+919999999999",
            "special_requests": "",
        }
        connection = MagicMock()
        fetch_all = MagicMock()
        with (
            patch.object(db_models, "database", return_value=nullcontext(connection)),
            patch.object(db_models, "_claim_idempotency", return_value=None),
            patch.object(db_models, "_fetch_one", return_value=self.duration_tour()),
            patch.object(db_models, "_fetch_all", fetch_all),
        ):
            with self.assertRaisesRegex(ValueError, "Selected capacity no longer matches"):
                db_models.create_booking(7, data, "booking-capacity-test", selected_capacity=5)
        fetch_all.assert_not_called()


class DurationSlotSchemaTests(unittest.TestCase):
    def test_new_duration_uses_numeric_value_and_per_mode_slots(self) -> None:
        option = main.DurationPricingOption(
            id="four-hours",
            duration="4 hours",
            duration_value=4,
            duration_unit="hours",
            available_modes=["Shared", "Private"],
            shared_slots=12,
            private_slots=4,
            shared_tiers=[{"travellers": 2, "price_per_person": 1200}],
            private_tiers=[{"travellers": 1, "price_per_person": 1800}],
        )

        self.assertEqual(option.duration_value, 4)
        self.assertEqual(option.shared_slots, 12)
        self.assertEqual(option.private_slots, 4)

    def test_new_duration_rejects_missing_or_inconsistent_numeric_slots(self) -> None:
        with self.assertRaisesRegex(ValueError, "numeric number of available slots"):
            main.DurationPricingOption(
                id="four-hours",
                duration="4 hours",
                duration_value=4,
                duration_unit="hours",
                available_modes=["Shared"],
                shared_tiers=[{"travellers": 1, "price_per_person": 1200}],
            )
        with self.assertRaisesRegex(ValueError, "cannot exceed"):
            main.DurationPricingOption(
                id="four-hours",
                duration="4 hours",
                duration_value=4,
                duration_unit="hours",
                available_modes=["Shared"],
                shared_slots=2,
                shared_tiers=[{"travellers": 3, "price_per_person": 1200}],
            )


if __name__ == "__main__":
    unittest.main()
