import { useEffect, useMemo, useState } from "react";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const formatInr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const defaultUpiId = "919876543210@upi";
const defaultUpiNumber = "+91 98765 43210";
const whatsAppNumber = "919876543210";

export default function UserPortal({
  apiBaseUrl,
  session,
  siteSettings = {},
  onLogout,
}) {
  const [account, setAccount] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);

  const loadDashboard = async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const [accountResponse, bookingResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: authHeaders(session.token),
        }),
        fetch(`${apiBaseUrl}/api/bookings/me`, {
          headers: authHeaders(session.token),
        }),
      ]);
      if (accountResponse.status === 401 || bookingResponse.status === 401) {
        onLogout();
        return;
      }
      const [accountBody, bookingBody] = await Promise.all([
        accountResponse.json(),
        bookingResponse.json(),
      ]);
      if (!accountResponse.ok || !bookingResponse.ok) {
        throw new Error(
          accountBody.detail ||
            bookingBody.detail ||
            "Unable to load your journeys.",
        );
      }
      setAccount(accountBody);
      setProfile({
        name: accountBody.name,
        email: accountBody.email,
        phone: accountBody.phone || "",
      });
      setBookings(bookingBody);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [session?.token]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bookings.filter(
      (item) =>
        item.travel_date >= today && item.booking_status !== "cancelled",
    );
    return {
      upcoming,
      paid: bookings.filter((item) => item.payment_status === "paid").length,
    };
  }, [bookings]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          ...authHeaders(session.token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to update profile.");
      setAccount(body);
      setProfile({
        name: body.name,
        email: body.email,
        phone: body.phone || "",
      });
      setStatus("Your profile has been updated.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadConfirmation = async (bookingId) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/bookings/${bookingId}/confirmation`,
        { headers: authHeaders(session.token) },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Unable to download confirmation.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nomad-booking-${bookingId}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (loading)
    return (
      <main className="top-space traveller-dashboard">
        <section className="section">
          <p className="lead">Preparing your journeys…</p>
        </section>
      </main>
    );
  if (!account) return null;

  const initials = account.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <>
      <main className="top-space traveller-dashboard">
        <section className="traveller-hero">
          <div className="traveller-welcome">
            <div className="traveller-avatar">{initials}</div>
            <div>
              <span className="eyebrow">Your Nomad account</span>
              <h1>Hello, {account.name.split(" ")[0]}.</h1>
              <p>
                Keep every upcoming experience, payment, and travel detail in
                one calm place.
              </p>
            </div>
          </div>
          <div className="traveller-hero-actions">
            <button
              className="outline-button"
              onClick={() => window.location.assign("/tours")}
            >
              Explore tours
            </button>
          </div>
        </section>
        <section className="traveller-stats">
          <article>
            <span className="material-symbols-outlined">luggage</span>
            <div>
              <b>{summary.upcoming.length}</b>
              <small>Upcoming journeys</small>
            </div>
          </article>
          <article>
            <span className="material-symbols-outlined">confirmation_number</span>
            <div>
              <b>{bookings.length}</b>
              <small>Total bookings</small>
            </div>
          </article>
          <article>
            <span className="material-symbols-outlined">verified</span>
            <div>
              <b>{summary.paid}</b>
              <small>Payments complete</small>
            </div>
          </article>
        </section>
        <section className="traveller-content">
          <nav className="traveller-tabs" aria-label="Traveller account">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "bookings" ? "active" : ""}
              onClick={() => setActiveTab("bookings")}
            >
              My bookings <span>{bookings.length}</span>
            </button>
            <button
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
          </nav>
          {status && <p className="traveller-status">{status}</p>}
          {activeTab === "overview" && (
            <section className="traveller-section">
              <div className="traveller-section-heading">
                <div>
                  <span className="eyebrow">Coming up</span>
                  <h2>Your next journeys</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActiveTab("bookings")}
                >
                  View all
                </button>
              </div>
              {summary.upcoming.length ? (
                <div className="journey-list">
                  {summary.upcoming.slice(0, 2).map((item) => (
                    <JourneyCard
                      key={item.id}
                      item={item}
                      onPay={setPaymentBooking}
                      onDownload={downloadConfirmation}
                    />
                  ))}
                </div>
              ) : (
                <div className="traveller-empty">
                  <span className="material-symbols-outlined">explore</span>
                  <h3>Your next story is waiting.</h3>
                  <p>Explore local experiences and save your first journey.</p>
                  <button
                    className="primary-button"
                    onClick={() => window.location.assign("/tours")}
                  >
                    Browse experiences
                  </button>
                </div>
              )}
            </section>
          )}
          {activeTab === "bookings" && (
            <section className="traveller-section">
              <div className="traveller-section-heading">
                <div>
                  <span className="eyebrow">Your travel plans</span>
                  <h2>My bookings</h2>
                </div>
                <button
                  className="outline-button"
                  onClick={() => window.location.assign("/tours")}
                >
                  Explore more tours
                </button>
              </div>
              {bookings.length ? (
                <div className="journey-list">
                  {bookings.map((item) => (
                    <JourneyCard
                      key={item.id}
                      item={item}
                      onPay={setPaymentBooking}
                      onDownload={downloadConfirmation}
                      expanded
                    />
                  ))}
                </div>
              ) : (
                <div className="traveller-empty">
                  <span className="material-symbols-outlined">map</span>
                  <h3>No bookings yet</h3>
                  <p>Find an experience that feels like your kind of India.</p>
                </div>
              )}
            </section>
          )}
          {activeTab === "profile" && (
            <div className="traveller-grid profile-grid">
              <section className="traveller-section">
                <span className="eyebrow">Personal details</span>
                <h2>Your traveller profile</h2>
                <p className="traveller-intro">
                  Keep your contact details current so we can share booking
                  updates and confirmations.
                </p>
                <form className="traveller-form" onSubmit={saveProfile}>
                  <label>
                    Full name
                    <input
                      required
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Phone / WhatsApp number
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button className="primary-button" disabled={submitting}>
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </form>
              </section>
              <aside className="traveller-profile-note">
                <span className="material-symbols-outlined">mail</span>
                <h3>Account email</h3>
                <p>{account.email}</p>
                <small>
                  Your sign-in username: <b>{account.username}</b>
                </small>
              </aside>
            </div>
          )}
        </section>
      </main>
      {paymentBooking && (
        <PaymentDetailsModal
          booking={paymentBooking}
          siteSettings={siteSettings}
          onClose={() => setPaymentBooking(null)}
        />
      )}
    </>
  );
}

function JourneyCard({ item, onPay, onDownload, expanded = false }) {
  const isUnpaid = item.payment_status === "unpaid";
  return (
    <article className="journey-card">
      <img src={item.image_url} alt="" />
      <div className="journey-card-body">
        <div className="journey-card-topline">
          <span className={`journey-status ${item.booking_status}`}>
            {item.booking_status}
          </span>
          <span className={`journey-payment ${item.payment_status}`}>
            {item.payment_status === "paid"
              ? "Payment complete"
              : `Payment: ${item.payment_status}`}
          </span>
        </div>
        <h3>{item.tour_title}</h3>
        <p>
          {item.city} · {item.duration}
        </p>
        <div className="journey-details">
          <span>
            <i className="material-symbols-outlined">calendar_month</i>
            {formatDate(item.travel_date)}
          </span>
          <span>
            <i className="material-symbols-outlined">group</i>
            {item.travellers} traveller{item.travellers > 1 ? "s" : ""}
          </span>
        </div>
        {expanded && item.special_requests && (
          <p className="journey-note">
            <b>Your note:</b> {item.special_requests}
          </p>
        )}
        <div className="journey-actions">
          {isUnpaid && item.booking_status !== "cancelled" && (
            <button className="primary-button" onClick={() => onPay(item)}>
              Pay
            </button>
          )}
          <button
            className="text-button"
            onClick={() => onDownload(item.id)}
          >
            Download confirmation
          </button>
        </div>
      </div>
    </article>
  );
}

function PaymentDetailsModal({ booking, siteSettings, onClose }) {
  const upiId = siteSettings?.upi_id || defaultUpiId;
  const upiNumber = siteSettings?.upi_number || defaultUpiNumber;
  const amount = Number(booking.price || 0) * Number(booking.travellers || 1);
  const qrData = `upi://pay?pa=${encodeURIComponent(
    upiId,
  )}&pn=Nomad%20Wanderers&am=${amount.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    qrData,
  )}`;
  const whatsAppMessage = encodeURIComponent(
    `Hi Nomad Wanderers, I have completed payment for ${booking.tour_title} booking #${booking.id}. I am sharing the payment screenshot for verification.`,
  );
  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${whatsAppMessage}`;
  return (
    <div
      className="booking-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="booking-modal traveller-payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="booking-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close payment details"
        >
          ×
        </button>
        <div className="booking-modal-header">
          <span className="eyebrow">Complete your payment</span>
          <h2 id="payment-details-title">Pay for your booking</h2>
          <p>
            Use the UPI details below for <b>{booking.tour_title}</b>. Your
            booking remains pending until our team verifies the payment.
          </p>
        </div>
        <div className="traveller-payment-summary">
          <span>Booking #{booking.id}</span>
          <b>{formatInr(amount)}</b>
          <small>
            {booking.travellers} traveller{booking.travellers > 1 ? "s" : ""} · {formatDate(booking.travel_date)}
          </small>
        </div>
        <div className="traveller-payment-upi booking-upi-card">
          <b>Scan to pay with any UPI app</b>
          <span>UPI ID: {upiId}</span>
          <span>UPI number: {upiNumber}</span>
          <img src={qrCodeUrl} alt="UPI payment QR code" />
        </div>
        <div className="traveller-payment-note">
          <span className="material-symbols-outlined">info</span>
          <p>
            After payment, share your payment screenshot with our team on
            WhatsApp at <b>+91 98765 43210</b>. This screenshot is required
            before your booking can be confirmed.
          </p>
        </div>
        <div className="traveller-payment-actions">
          <a
            className="primary-button"
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp →
          </a>
          <button className="outline-button" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
