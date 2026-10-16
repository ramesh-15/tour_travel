// Validate a server quote before constructing the checkout request.
export function isValidPaymentQuote(quote, bookingId, currency) {
  return Boolean(
    quote && quote.booking_id === bookingId && quote.currency === currency &&
    ["INR", "USD"].includes(currency) &&
    Number.isSafeInteger(quote.amount) && quote.amount >= 100 && quote.amount <= 1_000_000_000 &&
    Number.isInteger(quote.expires_at) && quote.expires_at * 1000 > Date.now() &&
    typeof quote.quote_token === "string" && quote.quote_token,
  );
}

export function paymentOrderDetails(bookingId, quote) {
  if (!isValidPaymentQuote(quote, bookingId, quote?.currency)) {
    throw new Error("Please refresh the payment amount before paying.");
  }
  return {
    booking_id: bookingId,
    amount: quote.amount,
    currency: quote.currency,
    quote_token: quote.quote_token,
    receipt: `booking-${bookingId}`,
    terms_accepted: true,
  };
}
