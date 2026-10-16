import { useCallback, useEffect, useState } from "react";
import { useCurrency } from "./CurrencyPreferences";
import { formatApiError } from "./apiError";
import { formatPaymentAmount } from "./currency";
import { isValidPaymentQuote } from "./paymentQuotePayload";
export { paymentOrderDetails } from "./paymentQuotePayload";

export function usePaymentQuote({ apiBaseUrl, token, booking, enabled = true }) {
  const { currency } = useCurrency();
  const bookingId = booking?.id;
  const requestKey = `${bookingId || ""}:${currency}:${booking?.price || ""}:${booking?.travellers || ""}`;
  const [result, setResult] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshQuote = useCallback(() => {
    setResult(null);
    setRefreshCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !bookingId || !token) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    let refreshTimer;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setResult(null);
    fetch(`${apiBaseUrl}/api/bookings/${bookingId}/payment-quote?currency=${currency}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const quote = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(formatApiError(quote.detail, "Unable to confirm your payment amount."));
        if (!isValidPaymentQuote(quote, bookingId, currency)) {
          throw new Error("Invalid payment quote. Please try again.");
        }
        if (cancelled) return;
        setResult({ key: requestKey, quote, formattedAmount: formatPaymentAmount(quote.amount, quote.currency) });
        refreshTimer = window.setTimeout(refreshQuote, Math.max(0, quote.expires_at * 1000 - Date.now() - 1000));
      })
      .catch((error) => {
        if (!cancelled) setResult({ key: requestKey, error: error.name === "AbortError" ? "Payment quote timed out. Please try again." : error.message });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(refreshTimer);
    };
  }, [apiBaseUrl, bookingId, currency, enabled, refreshCount, refreshQuote, requestKey, token]);

  const matchingResult = result?.key === requestKey ? result : null;
  return {
    quote: matchingResult?.quote || null,
    formattedAmount: matchingResult?.formattedAmount || "",
    quoteError: matchingResult?.error || "",
    loadingQuote: Boolean(enabled && bookingId && token && !matchingResult),
    refreshQuote,
  };
}

export function PaymentQuoteStatus({ error, onRetry }) {
  if (!error) return null;
  return <p className="form-status error" role="alert">{error} <button className="text-button" type="button" onClick={onRetry}>Refresh payment amount</button></p>;
}

