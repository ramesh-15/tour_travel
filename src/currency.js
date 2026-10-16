export const CURRENCY_STORAGE_KEY = "nomad_currency_preference";
export const RATE_STORAGE_KEY = "nomad_usd_exchange_rate";
export const RATE_CACHE_DURATION = 24 * 60 * 60 * 1000;

export const CURRENCY_OPTIONS = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

export function readCurrencyPreference() {
  try {
    const preference = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return CURRENCY_OPTIONS.some((option) => option.code === preference)
      ? preference
      : null;
  } catch {
    return null;
  }
}

export function readCachedExchangeRate() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(RATE_STORAGE_KEY));
    const age = Date.now() - Number(cached?.fetchedAt);
    return cached?.rate > 0 && Number.isFinite(cached.rate) &&
      age >= 0 && age < RATE_CACHE_DURATION
      ? cached
      : null;
  } catch {
    return null;
  }
}

export function saveCurrencySetting(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The selection still works for this visit when browser storage is blocked.
  }
}

export function parseInrAmount(value) {
  if (value == null || value === "") return null;
  const amount = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

export function formatCurrencyAmount(value, currency = "INR", usdRate = null) {
  const amount = parseInrAmount(value);
  if (amount === null) return String(value ?? "");
  const useUsd = currency === "USD" && Number.isFinite(usdRate) && usdRate > 0;
  return new Intl.NumberFormat(useUsd ? "en-US" : "en-IN", {
    style: "currency",
    currency: useUsd ? "USD" : "INR",
    minimumFractionDigits: useUsd ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(useUsd ? amount * usdRate : amount);
}

export function formatPaymentAmount(amount, currency) {
  if (!Number.isSafeInteger(amount) || amount < 100 || !["INR", "USD"].includes(currency)) {
    throw new Error("Invalid payment amount");
  }
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
