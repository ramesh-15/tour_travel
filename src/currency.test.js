import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  CURRENCY_STORAGE_KEY,
  RATE_CACHE_DURATION,
  RATE_STORAGE_KEY,
  formatCurrencyAmount,
  formatPaymentAmount,
  parseInrAmount,
  readCachedExchangeRate,
  readCurrencyPreference,
  saveCurrencySetting,
} from "./currency.js";

let storage;
beforeEach(() => {
  storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };
});
afterEach(() => { delete globalThis.window; });

test("USD display converts INR amounts rather than changing their symbol", () => {
  assert.equal(formatCurrencyAmount(1500, "USD", 0.012), "$18.00");
  assert.equal(formatCurrencyAmount("₹2,500", "USD", 0.012), "$30.00");
  assert.equal(formatCurrencyAmount(0, "USD", 0.012), "$0.00");
  assert.equal(formatCurrencyAmount(1500, "INR", 0.012), "₹1,500");
  assert.equal(formatCurrencyAmount(1500.25, "INR"), "₹1,500.25");
});

test("missing or invalid rates keep amounts in INR, and enquiry prices remain text", () => {
  for (const rate of [null, 0, -1, Infinity, NaN]) {
    assert.equal(formatCurrencyAmount(1500, "USD", rate), "₹1,500");
  }
  assert.equal(formatCurrencyAmount("Price on request", "USD", 0.012), "Price on request");
  assert.equal(parseInrAmount(undefined), null);
  assert.equal(parseInrAmount("₹1,00,000"), 100000);
});

test("the preference is remembered and unsupported saved currencies are ignored", () => {
  assert.equal(readCurrencyPreference(), null);
  saveCurrencySetting(CURRENCY_STORAGE_KEY, "USD");
  assert.equal(readCurrencyPreference(), "USD");
  storage.set(CURRENCY_STORAGE_KEY, "INR");
  assert.equal(readCurrencyPreference(), "INR");
  storage.set(CURRENCY_STORAGE_KEY, "EUR");
  assert.equal(readCurrencyPreference(), null);
});

test("only valid and fresh exchange rates are reused", () => {
  const fresh = { rate: 0.012, fetchedAt: Date.now(), date: "2026-10-12" };
  storage.set(RATE_STORAGE_KEY, JSON.stringify(fresh));
  assert.deepEqual(readCachedExchangeRate(), fresh);
  storage.set(RATE_STORAGE_KEY, JSON.stringify({ ...fresh, fetchedAt: Date.now() - RATE_CACHE_DURATION - 1 }));
  assert.equal(readCachedExchangeRate(), null);
  storage.set(RATE_STORAGE_KEY, JSON.stringify({ ...fresh, rate: -1 }));
  assert.equal(readCachedExchangeRate(), null);
  storage.set(RATE_STORAGE_KEY, "invalid JSON");
  assert.equal(readCachedExchangeRate(), null);
});

test("blocked browser storage does not prevent currency selection", () => {
  window.localStorage.getItem = () => { throw new Error("Storage blocked"); };
  window.localStorage.setItem = () => { throw new Error("Storage blocked"); };
  assert.equal(readCurrencyPreference(), null);
  assert.equal(readCachedExchangeRate(), null);
  assert.doesNotThrow(() => saveCurrencySetting(CURRENCY_STORAGE_KEY, "INR"));
});

test("server-confirmed amounts are formatted in their payment currency without conversion", () => {
  assert.equal(formatPaymentAmount(1357, "USD"), "$13.57");
  assert.equal(formatPaymentAmount(130000, "INR"), "₹1,300");
  assert.throws(() => formatPaymentAmount(1357, "EUR"));
  assert.throws(() => formatPaymentAmount(13.57, "USD"));
});
