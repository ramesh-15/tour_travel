import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  CURRENCY_OPTIONS,
  CURRENCY_STORAGE_KEY,
  RATE_CACHE_DURATION,
  RATE_STORAGE_KEY,
  formatCurrencyAmount,
  readCachedExchangeRate,
  readCurrencyPreference,
  saveCurrencySetting,
} from "./currency";

const CurrencyContext = createContext({
  currency: "INR",
  usdAvailable: false,
  formatPrice: (amount) => formatCurrencyAmount(amount),
  openCurrencyPicker: () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children, apiBaseUrl, enabled = true }) {
  const [preference, setPreference] = useState(readCurrencyPreference);
  const [pickerRequested, setPickerRequested] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(readCachedExchangeRate);
  const [rateStatus, setRateStatus] = useState("loading");
  const [retryCount, setRetryCount] = useState(0);
  const currency = preference || "INR";
  const openCurrencyPicker = useCallback(() => setPickerRequested(true), []);
  const usdRate = exchangeRate?.rate || null;

  useEffect(() => {
    if (!enabled || (preference === "INR" && !pickerRequested)) return undefined;
    if (exchangeRate && Date.now() - exchangeRate.fetchedAt < RATE_CACHE_DURATION) {
      setRateStatus("ready");
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setRateStatus("loading");
    fetch(`${apiBaseUrl}/api/exchange-rates`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Exchange rate unavailable");
        const body = await response.json();
        const rate = body.rates?.USD;
        if (body.base !== "INR" || body.amount !== 1 || !Number.isFinite(rate) || rate <= 0) {
          throw new Error("Invalid exchange rate");
        }
        if (cancelled) return;
        const nextRate = { rate, date: body.date, fetchedAt: Date.now() };
        setExchangeRate(nextRate);
        setRateStatus("ready");
        saveCurrencySetting(RATE_STORAGE_KEY, JSON.stringify(nextRate));
      })
      .catch(() => {
        if (!cancelled) setRateStatus("error");
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [apiBaseUrl, enabled, exchangeRate, pickerRequested, preference, retryCount]);

  const selectCurrency = (nextCurrency) => {
    if (!CURRENCY_OPTIONS.some((option) => option.code === nextCurrency)) return;
    if (nextCurrency === "USD" && !usdRate) return;
    setPreference(nextCurrency);
    setPickerRequested(false);
    saveCurrencySetting(CURRENCY_STORAGE_KEY, nextCurrency);
  };
  const formatPrice = useCallback(
    (amount) => formatCurrencyAmount(amount, currency, usdRate),
    [currency, usdRate],
  );

  return (
    <CurrencyContext.Provider value={{ currency, usdAvailable: Boolean(usdRate), formatPrice, openCurrencyPicker }}>
      {children}
      {enabled && (pickerRequested || !preference) && (
        <CurrencyPicker
          initialCurrency={currency}
          usdAvailable={Boolean(usdRate)}
          rateStatus={rateStatus}
          onSelect={selectCurrency}
          onClose={() => selectCurrency(preference === "USD" && usdRate ? "USD" : "INR")}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      )}
    </CurrencyContext.Provider>
  );
}

function CurrencyPicker({ initialCurrency, usdAvailable, rateStatus, onSelect, onClose, onRetry }) {
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeButtonRef.current.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="currency-dialog"
      aria-labelledby="currency-dialog-title"
      aria-describedby="currency-dialog-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <button ref={closeButtonRef} className="currency-dialog-close" type="button" onClick={onClose} aria-label="Close currency selection">×</button>
      <form onSubmit={(event) => { event.preventDefault(); onSelect(selectedCurrency); }}>
        <span className="currency-dialog-icon material-symbols-outlined" aria-hidden="true">currency_exchange</span>
        <span className="eyebrow">Welcome to Nomad Wanderers</span>
        <h2 id="currency-dialog-title">Select your currency</h2>
        <p id="currency-dialog-description">Choose your currency for tour prices and payments.</p>
        <fieldset className="currency-options">
          <legend className="sr-only">Preferred currency</legend>
          {CURRENCY_OPTIONS.map((option) => (
            <label className={`currency-option${selectedCurrency === option.code ? " is-selected" : ""}`} key={option.code}>
              <span className="currency-option-symbol" aria-hidden="true">{option.symbol}</span>
              <span className="currency-option-copy"><strong>{option.name}</strong><small>{option.code} · {option.symbol}</small></span>
              <input
                type="radio"
                name="preferred_currency"
                value={option.code}
                checked={selectedCurrency === option.code}
                onChange={() => setSelectedCurrency(option.code)}
              />
            </label>
          ))}
        </fieldset>
        {selectedCurrency === "USD" && !usdAvailable && (
          <div className="currency-rate-status" role="status">
            {rateStatus === "error" ? (
              <>Dollar conversion is unavailable right now. Choose Indian Rupee or <button className="text-button" type="button" onClick={onRetry}>try again</button>.</>
            ) : "Loading the latest dollar exchange rate…"}
          </div>
        )}
        <p className="currency-dialog-note">Tour prices are estimates. Your final amount is confirmed in the selected currency before payment.</p>
        <button className="primary-button currency-confirm" type="submit" disabled={selectedCurrency === "USD" && !usdAvailable}>Continue</button>
      </form>
    </dialog>
  );
}

export function CurrencyButton() {
  const { currency, usdAvailable, openCurrencyPicker } = useCurrency();
  const option = CURRENCY_OPTIONS.find((item) => item.code === currency);
  return (
    <button className="currency-toggle" type="button" onClick={openCurrencyPicker} aria-label={`Change currency, currently ${option.name}`} aria-haspopup="dialog" title={currency === "USD" && !usdAvailable ? "Dollar conversion unavailable. Prices are shown in INR." : `Change currency (${option.name})`}>
      <span aria-hidden="true">{option.symbol}</span> {option.code}
    </button>
  );
}

export function Money({ amount }) {
  const { currency, usdAvailable, formatPrice } = useCurrency();
  return <>{formatPrice(amount)}{currency === "USD" && !usdAvailable ? " (INR)" : ""}</>;
}

export function TourPrice({ tour }) {
  return <Money amount={tour.price_value ?? tour.price} />;
}

export function CurrencyPaymentNote() {
  const { currency, usdAvailable } = useCurrency();
  if (currency !== "USD") return null;
  return (
    <small className="currency-payment-note">
      {usdAvailable ? "USD prices are estimates. Your final dollar amount is confirmed before payment." : "Dollar conversion is unavailable. Please refresh the payment quote before paying in USD."}
    </small>
  );
}
