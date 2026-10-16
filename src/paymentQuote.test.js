import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidPaymentQuote, paymentOrderDetails } from "./paymentQuotePayload.js";

const quote = () => ({
  booking_id: 30,
  amount: 1357,
  currency: "USD",
  expires_at: Math.floor(Date.now() / 1000) + 600,
  quote_token: "server-signed-quote",
});

test("checkout sends the exact USD cents, currency and token from the server quote", () => {
  assert.deepEqual(paymentOrderDetails(30, quote()), {
    booking_id: 30, amount: 1357, currency: "USD", quote_token: "server-signed-quote",
    receipt: "booking-30", terms_accepted: true,
  });
  const inrQuote = { ...quote(), currency: "INR", amount: 130000 };
  assert.equal(paymentOrderDetails(30, inrQuote).amount, 130000);
  assert.equal(paymentOrderDetails(30, inrQuote).currency, "INR");
});

test("changing currency or booking invalidates an earlier quote", () => {
  assert.equal(isValidPaymentQuote(quote(), 30, "USD"), true);
  assert.equal(isValidPaymentQuote(quote(), 30, "INR"), false);
  assert.equal(isValidPaymentQuote(quote(), 31, "USD"), false);
  assert.throws(() => paymentOrderDetails(31, quote()));
});

test("expired or incomplete quotes cannot be used for checkout", () => {
  for (const invalid of [null, { ...quote(), expires_at: 1 }, { ...quote(), amount: 13.57 }, { ...quote(), quote_token: "" }, { ...quote(), currency: "EUR" }]) {
    assert.throws(() => paymentOrderDetails(30, invalid));
  }
});
