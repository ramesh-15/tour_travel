import { useEffect, useRef, useState } from "react";
import delhiIndiaGate from "./assets/delhi-india-gate.png";
import roadTripCar from "./assets/road-trip-car.png";
import rajasthanCamelTour from "./assets/rajasthan-desert-camel-tour.png";
import footerCitySkyline from "./assets/footer-city-skyline.png";
import UserPortal from "./UserPortal";
import { AdminTeamPortal, StaffPortal } from "./StaffPortal";
import UnifiedLogin from "./UnifiedLogin";
import "./App.css";

const images = {
  gateway:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC-yhTTTbmF0KufK5ozjDj4PNlvBoQAu7iNtm4bpSGB_zXNA4g1yQ51n4DpBDI6njI6WOL7GwgnudU8CqyFFx_iDWP47QesT6aj_X8DE8Ui6lFPGFMuc1b3cVI_-NCLVsJD5Op8m01UydADUuHg7yK6Lpf2i3eZ1M-M3IrBXiixTid4MhE58PYaVqh_NrORQJ7UvYYOngCrX7G3bYA3yJPYjpRHUI5xkmlrvhgbJY9NIFowjmv1l7tvSIuBNLbhTtnNY9G3SLYOFeY",
  city: "https://lh3.googleusercontent.com/aida-public/AB6AXuBspkPMgCN5jsVWpGox3fRwy3yYDWRFI73UA-qvgp6koUZnfJVzMJyw_6Hj86v9TShHaAEtP7VJeJUl9wJJtmRPDKK9Y8jd4aPGvF-hGpCzIUVzRgpJHMsRp17EQXw5BmJoSTd86LyoCcZSA8ujybsOrbclkem65KVjzGuNqLEOY8IWU-hG9P9O-lIODvP1nF2BaG5Q9k_XQsOed_zbg3K157XsNZFniD_x951eROY-uIhJagrUkrKGBf9w175TXfAv-07UTeEfOwI",
  market:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDNIEcBKu8CEgpI3k2fF9Va76UeKL0Gkm4J9sjhDsfNDWhMxi6beUClfNE3WmfvrUMhWVqDV59jBMFn7rBTeK7JywQrgyz3ZSkfxcnDqtDvBgMj5sco6zhMW7gT0LaKd7oLL-ThzS45eJSaEHdndTV5ZjngPhm27ToEmytb4bm85Iz2Aqc-dMHKHA2BATtDIm_1yOViGReMG1g2uIk1jf7y5uDUh2zAXia5g1c5pYtsp1mz0Kw-stOd1iaRQjoAZoV-u2e_v4uitYs",
  heritage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDeYew-RKEsoL0xHcWw-Yl9hRR5e7zmXXniIqMAmLhd1deGngA4PsZJKurpSXapcyQKFqv_BBy3h_LsK2hB3Xva1B9Th3VvlE-r8FkdR95b1JhJ-TWCxAX0af-LdiIdqUQGlwP9j9CdRAkwS3j3CxQupgXnfrgUWNRpUqi-Z4M8LXftw3QixaZyW67KZkiOHU_XE6CTQccoJODSR2JWE2yXTVG3AKa7adWOEhVSOcQOdFYxXMjO0Nsl8wsiL8UHTps8deP0hW6i9l4",
  bicycle:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDo_ABCi6Ne30XhC2OrEpEHacwtpRY2Hvbf4mp7Hn8X4Nc0lCc7mkB3I0jiK3QmmV_EIfanNzd3cUDQgsOQqbOUnKwjOktGmjhIgNk7nixMgZfT0sN4SM3EDaFkZQhnwoDIgDGRH4iT4qeYXVwdDX7WlbqIgPb_o-QL1xBB5gKGUWGVVTZGNeHpvsOZLDgJV7P8vL-H3TO72IXY2O0O8A5DLrzop3tFsXZiF2bcKtjewVPKyIH4xOgglIZqLNAPoy3YrXgYGBjWOE",
  dharavi:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKAa0AXXbC30oPrGCc3rEEGKm0sJSMUHg-jmxt5xThEEhcC6RXO6qZ2TtKTfsMAecpqJusBhzK0GWsg9g4WAD5TW2t51WRtbm5Qwm6qvgSZz-wfZmjUcd9ScG9qZDzin99thuXNrfSsndDBOJZrVWkWRKzvwW_YNZL9NJRAtbWsyr5HrplYJTdYJ496AGQTasAG5s1XJIGHiydx3AwEdU6Sd_UU6Bi9XkYbFZBcNWDtP_bpYr-kCXst4zExRCQERY62rRPPqVoOlk",
  pottery:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCjtPZMOZUsCg8SEYnzpCmRg74EXBsaqdQASHv9vfmXpfZhO32Sx7kEiGN3b7HvTT5g_U-LigK8ESuVeTN5ZbSaUOyuAKnKlMBRvAC3afEtQxu682lZ7vBJW4O_12c5tnb5KHjzYgXJVpifnlxoF88dGhcHcwFtCwK6nhEOs9PCJdaqmqYdliMIR07IFAJ9k34S4jYottOZlYqnluv1xLjOsw6MvcRmkgss7j2c05gsW7ey5GfJ--3cGexdawNVOYP7u96-VRh5iXE",
  mumbai:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBHu7SLyVWPjAXmffTqNx_h_ezBkUrG38RxSs0CpIBQszOI-VenY0kTf5TIU_-bbkDgeX0sqm8a_GxZFGqmN4hYCJlTLfTGVYZeinuQOLeu4Eu6cm5HKcC5_fo6W18yJy7fX1ccwNWvuXVskrqjlF0lt8rYEPPEh-P6nuVRP1K8maiMgPQsab-Lwuwtn8khW1gkiY3xFKCTqbE6wSh3d-2uLPPLn_tq-QzBsY0VdAMh7X56N0du7mazjPRhKhyzCMfYQ4jJPfN8n7s",
  raj: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgSdhMQ05ee1HfAGqwZjXDlL50w9fbZZo3PThmQGqg_XV1iGf1upc02TWeaFj3r5CVINxZ2vuj-mPpG0-IRow-vuuwwpr44jCeS1pSMBxHu519ecICpjTltsE6ihMliyhZjlNKRR896349I96jyPuBlM9ITwFtNdYSZAxCmRXMBQD1DuECmUie2K4CvkJSFzXzRO_sCBMXk6i8LR5vTHfGV09agMLynoUwBGeUAP-gAJWSy4Vj8TZrcyX84fP7tUcfldOOPPljWrA",
  delhi: delhiIndiaGate,
  rajasthanCamelTour,
  food: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNIEcBKu8CEgpI3k2fF9Va76UeKL0Gkm4J9sjhDsfNDWhMxi6beUClfNE3WmfvrUMhWVqDV59jBMFn7rBTeK7JywQrgyz3ZSkfxcnDqtDvBgMj5sco6zhMW7gT0LaKd7oLL-ThzS45eJSaEHdndTV5ZjngPhm27ToEmytb4bm85Iz2Aqc-dMHKHA2BATtDIm_1yOViGReMG1g2uIk1jf7y5uDUh2zAXia5g1c5pYtsp1mz0Kw-stOd1iaRQjoAZoV-u2e_v4uitYs",
};

const fallbackTours = [];
/*
  { title: 'Mumbai City Tours', text: "A comprehensive journey through Mumbai's most iconic landmarks, from the majestic Gateway of India to the vibrant Marine Drive. Perfect for first-time visitors seeking the soul of the city.", image: images.city, tag: 'TOP RATED', city: 'Mumbai', mode: 'Shared', category: 'City', duration: '4 hours', price: '₹2,500', highlights: ['Gateway of India', 'Marine Drive', 'Local stories'], featured: true },
  { title: 'Market Tours', text: 'Navigate the chaotic beauty of Crawford Market and Chor Bazaar. Discover exotic spices, textiles, and antique treasures hidden in plain sight.', image: images.market, city: 'Mumbai', mode: 'Shared', category: 'Market', duration: '3 hours', price: '₹1,800', highlights: ['Crawford Market', 'Chor Bazaar', 'Spice tasting'] },
  { title: 'Heritage Walking Tours', text: "A journey back in time through the Victorian Gothic and Indo-Saracenic architecture of South Mumbai's historic district.", image: images.heritage, city: 'Mumbai', mode: 'Shared', category: 'Walking', duration: '2.5 hours', price: '₹1,500', highlights: ['Historic district', 'Architecture', 'Local guide'] },
  { title: 'Bicycle Tours', text: "Experience the city's awakening. Pedal through quiet lanes and watch the morning bustle of fish markets and newspaper depots.", image: images.bicycle, city: 'Mumbai', mode: 'Shared', category: 'Cycling', duration: '3 hours', price: '₹1,900', highlights: ['Early morning', 'Quiet lanes', 'Bicycle included'] },
  { title: 'Dharavi Slum Tours', text: "A respectful perspective on Asia's largest informal economy. See the incredible resilience and industry that fuels this vibrant community.", image: images.dharavi, city: 'Mumbai', mode: 'Private', category: 'Community', duration: '2 hours', price: '₹1,500', highlights: ['Resident guide', 'Pottery colony', 'Community impact'], dark: true },
]
*/

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
const businessWhatsAppNumber = "919876543210";
const businessUpiId = import.meta.env.VITE_UPI_ID || "919876543210@upi";
const defaultSiteSettings = {
  upi_id: businessUpiId,
  upi_number: "+91 98765 43210",
};

function requiresCustomerAuth(destination) {
  const url = new URL(destination, window.location.origin);
  const protectedIntent =
    url.pathname === "/contact" &&
    ["book", "custom"].includes(url.searchParams.get("intent"));
  const protectedBooking =
    url.pathname.startsWith("/tours") && url.searchParams.get("booking") === "1";
  return protectedIntent || protectedBooking || url.pathname === "/payment";
}

function AuthRequiredModal({ destination, onCancel, onContinue }) {
  const intent = new URL(destination, window.location.origin).searchParams.get(
    "intent",
  );
  const action =
    intent === "custom" ? "plan your trip" : "book this tour";
  return (
    <div
      className="auth-required-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="auth-required-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-required-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="auth-required-close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>
        <span className="material-symbols-outlined auth-required-icon">
          lock
        </span>
        <Eyebrow>Account required</Eyebrow>
        <h2 id="auth-required-title">Sign in to continue</h2>
        <p>
          Please log in or create an account before you {action}. We’ll bring
          you straight back here afterward.
        </p>
        <div className="auth-required-actions">
          <button className="primary-button" onClick={onContinue}>
            Continue to login →
          </button>
          <button className="text-button" onClick={onCancel}>
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}

function apiTourToUi(tour) {
  return {
    ...tour,
    text: tour.description,
    image: tour.image_url,
    price: new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(tour.price),
  };
}

function DummyPayment({ session }) {
  const query = new URLSearchParams(window.location.search);
  const [method, setMethod] = useState("upi");
  const [payment, setPayment] = useState(null);
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState(false);
  const tour = query.get("tour") || "Tour booking";
  const name = query.get("name") || "Traveller";
  const email = query.get("email") || "";
  const phone = query.get("phone") || "";
  const bookingId = query.get("booking_id");
  const amount = 499;
  const completePayment = async (event) => {
    event.preventDefault();
    setPaying(true);
    setStatus("");
    try {
      const endpoint = bookingId
        ? `/api/bookings/${bookingId}/demo-payment`
        : "/api/demo-payments";
      const paymentHeaders = bookingId
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.token || ""}`,
          }
        : { "Content-Type": "application/json" };
      const paymentPayload = bookingId
        ? { payment_method: method }
        : {
            name,
            email,
            phone,
            tour_title: tour,
            amount,
            payment_method: method,
          };
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: paymentHeaders,
        body: JSON.stringify(paymentPayload),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to complete the demo payment.");
      setPayment(body);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPaying(false);
    }
  };
  if (payment)
    return (
      <main className="top-space">
        <section className="section payment-screen">
          <div className="payment-confirmation">
            <span className="material-symbols-outlined">check_circle</span>
            <Eyebrow>Demo payment successful</Eyebrow>
            <h1>Your booking request is recorded.</h1>
            <p>
              This is a test payment only. No money was transferred and no live
              messages were sent.
            </p>
            <div className="payment-receipt">
              <div>
                <span>Tour</span>
                <b>{payment.payment.tour_title}</b>
              </div>
              <div>
                <span>Demo reference</span>
                <b>{payment.payment.transaction_reference}</b>
              </div>
              <div>
                <span>Amount</span>
                <b>₹{Number(payment.payment.amount).toLocaleString("en-IN")}</b>
              </div>
              <div>
                <span>Method</span>
                <b>{payment.payment.payment_method.replace("_", " ")}</b>
              </div>
            </div>
            <div className="confirmation-previews">
              <article>
                <span className="material-symbols-outlined">mail</span>
                <div>
                  <b>Email confirmation preview</b>
                  <p>{payment.email_confirmation}</p>
                </div>
              </article>
              <article>
                <span className="material-symbols-outlined">chat</span>
                <div>
                  <b>WhatsApp template preview</b>
                  <p>{payment.whatsapp_confirmation}</p>
                </div>
              </article>
            </div>
            <button
              className="primary-button"
              onClick={() => window.location.assign("/")}
            >
              Back to home
            </button>
          </div>
        </section>
      </main>
    );
  return (
    <main className="top-space">
      <section className="section payment-screen">
        <div className="payment-intro">
          <Eyebrow>Demo checkout</Eyebrow>
          <h1>Complete your test payment</h1>
          <p>
            This Razorpay-style screen is a safe simulation for the booking
            flow. No payment details are processed and no money moves.
          </p>
          <div className="payment-order">
            <span>Booking deposit</span>
            <b>₹{amount.toLocaleString("en-IN")}</b>
            <small>{tour}</small>
          </div>
        </div>
        <form className="contact-form payment-form" onSubmit={completePayment}>
          <div className="payment-form-heading">
            <span className="material-symbols-outlined">lock</span>
            <div>
              <h2>Choose a payment method</h2>
              <p>Demo mode only</p>
            </div>
          </div>
          <div className="payment-methods">
            {[
              ["upi", "UPI"],
              ["credit_card", "Credit card"],
              ["debit_card", "Debit card"],
            ].map(([value, label]) => (
              <label key={value} className={method === value ? "selected" : ""}>
                <input
                  type="radio"
                  name="method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                <span className="material-symbols-outlined">
                  {value === "upi" ? "qr_code_2" : "credit_card"}
                </span>
                <b>{label}</b>
              </label>
            ))}
          </div>
          <div className="payment-demo-note">
            <span className="material-symbols-outlined">info</span>
            <p>
              For this demo, click the button below to simulate a successful
              payment.
            </p>
          </div>
          <button className="primary-button" type="submit" disabled={paying}>
            {paying
              ? "Processing demo payment..."
              : `Pay ₹${amount.toLocaleString("en-IN")} (Demo)`}
          </button>
          {status && <p className="admin-status">{status}</p>}
        </form>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [query, setQuery] = useState(window.location.search);
  const [tours, setTours] = useState(fallbackTours);
  const [carouselTours, setCarouselTours] = useState([]);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [userSession, setUserSession] = useState(() => {
    const token = sessionStorage.getItem("nomad_user_token");
    return token ? { token } : null;
  });
  const [adminSession, setAdminSession] = useState(() => {
    const token = sessionStorage.getItem("nomad_admin_token");
    return token ? { token } : null;
  });
  const [staffSession, setStaffSession] = useState(() => {
    const token = sessionStorage.getItem("nomad_staff_token");
    return token ? { token } : null;
  });
  const [pendingAuthDestination, setPendingAuthDestination] = useState("");
  const go = (to, customerAuthenticated = false) => {
    const requested = new URL(to, window.location.origin);
    if (
      !userSession &&
      !customerAuthenticated &&
      requiresCustomerAuth(requested.href)
    ) {
      const destination = `${requested.pathname}${requested.search}${requested.hash}`;
      sessionStorage.setItem("nomad_after_login", destination);
      setPendingAuthDestination(destination);
      return;
    }
    const next = requested;
    window.history.pushState(
      {},
      "",
      `${next.pathname}${next.search}${next.hash}`,
    );
    setPath(next.pathname);
    setQuery(next.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const clearAdminSession = () => {
    sessionStorage.removeItem("nomad_admin_token");
    setAdminSession(null);
  };
  const clearUserSession = () => {
    sessionStorage.removeItem("nomad_user_token");
    setUserSession(null);
  };
  const clearStaffSession = () => {
    sessionStorage.removeItem("nomad_staff_token");
    setStaffSession(null);
  };
  const logoutUser = async () => {
    try {
      if (userSession)
        await fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${userSession.token}` },
        });
    } finally {
      clearUserSession();
    }
  };
  const logoutAdmin = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
    } finally {
      // Remove the local token even if it has already expired or was revoked.
      clearAdminSession();
    }
  };
  const logoutStaff = async () => {
    try {
      if (staffSession)
        await fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${staffSession.token}` },
        });
    } finally {
      clearStaffSession();
    }
  };
  const authenticateByRole = ({ token, role }) => {
    if (role === "customer") {
      const currentDestination = `${path}${query}`;
      const pendingDestination = sessionStorage.getItem("nomad_after_login");
      const destination =
        pendingDestination ||
        (requiresCustomerAuth(currentDestination) ? currentDestination : "/");
      sessionStorage.removeItem("nomad_after_login");
      setPendingAuthDestination("");
      sessionStorage.setItem("nomad_user_token", token);
      setUserSession({ token });
      go(destination, true);
    } else if (role === "admin") {
      sessionStorage.setItem("nomad_admin_token", token);
      setAdminSession({ token });
      go("/admin");
    } else {
      sessionStorage.setItem("nomad_staff_token", token);
      setStaffSession({ token });
      go("/staff");
    }
  };
  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname);
      setQuery(window.location.search);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/tours?page_size=100`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setTours(data.items.map(apiTourToUi));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/site-settings`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((settings) =>
        setSiteSettings({
          upi_id: settings.upi_id || defaultSiteSettings.upi_id,
          upi_number: settings.upi_number || defaultSiteSettings.upi_number,
        }),
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/home-carousel`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => setCarouselTours(items.map(apiTourToUi)))
      .catch(() => {});
  }, []);
  const loginPage = (
    <UnifiedLogin
      apiBaseUrl={apiBaseUrl}
      onAuthenticated={authenticateByRole}
    />
  );
  const customerRouteIsProtected = requiresCustomerAuth(`${path}${query}`);
  const showingLogin =
    path === "/login" || (customerRouteIsProtected && !userSession);
  const page = showingLogin ? (
    loginPage
  ) : path === "/admin/team" ? (
    adminSession ? (
      <AdminTeamPortal
        apiBaseUrl={apiBaseUrl}
        session={adminSession}
        onLogout={logoutAdmin}
        onBack={() => go("/admin")}
      />
    ) : (
      loginPage
    )
  ) : path === "/admin" ? (
    adminSession ? (
      <AdminDashboardV2
        session={adminSession}
        siteSettings={siteSettings}
        onSiteSettingsSaved={setSiteSettings}
        onCarouselSaved={(selectedTours) => setCarouselTours(selectedTours.map(apiTourToUi))}
        onSessionExpired={clearAdminSession}
        onManageTeam={() => go("/admin/team")}
        onTourSaved={(tour) => {
          const nextTour = apiTourToUi(tour);
          setTours((current) =>
            tour.published
              ? [nextTour, ...current.filter((item) => item.id !== tour.id)]
              : current.filter((item) => item.id !== tour.id),
          );
          setCarouselTours((current) =>
            tour.published
              ? current.map((item) => (item.id === tour.id ? nextTour : item))
              : current.filter((item) => item.id !== tour.id),
          );
        }}
        onTourDeleted={(tourId) => {
          setTours((current) => current.filter((tour) => tour.id !== tourId));
          setCarouselTours((current) => current.filter((tour) => tour.id !== tourId));
        }}
      />
    ) : (
      loginPage
    )
  ) : path === "/staff" ? (
    staffSession ? (
      <StaffPortal
        apiBaseUrl={apiBaseUrl}
        session={staffSession}
        onAuthenticated={(nextSession) => {
          sessionStorage.setItem("nomad_staff_token", nextSession.token);
          setStaffSession(nextSession);
        }}
        onLogout={logoutStaff}
      />
    ) : (
      loginPage
    )
  ) : path === "/account" ? (
    userSession ? (
      <UserPortal
        apiBaseUrl={apiBaseUrl}
        session={userSession}
        onAuthenticated={(nextSession) => {
          sessionStorage.setItem("nomad_user_token", nextSession.token);
          setUserSession(nextSession);
        }}
        onLogout={logoutUser}
      />
    ) : (
      loginPage
    )
  ) : path === "/about" ? (
    <About go={go} />
  ) : path === "/tours/unique" ? (
    <ToursV3 go={go} city="" category="Unique" tours={tours} />
  ) : path === "/trips" ? (
    <MultiDayToursPage
      go={go}
      mode={new URLSearchParams(query).get("mode") || ""}
      tours={tours}
    />
  ) : path === "/tours" ? (
    new URLSearchParams(query).get("view") === "detail" ? (
      <Dharavi
        go={go}
        tours={tours}
        session={userSession}
        siteSettings={siteSettings}
        initialBooking={new URLSearchParams(query).get("booking") === "1"}
        city={new URLSearchParams(query).get("city") || ""}
        category={new URLSearchParams(query).get("category") || ""}
      />
    ) : (
      <ToursV3
        go={go}
        city={new URLSearchParams(query).get("city") || ""}
        category={new URLSearchParams(query).get("category") || ""}
        mode={new URLSearchParams(query).get("mode") || ""}
        tours={tours}
      />
    )
  ) : path === "/tours/dharavi" && tours.some((tour) => /dharavi/i.test(tour.title) || tour.category === "Community") ? (
    <Dharavi go={go} tours={tours} session={userSession} siteSettings={siteSettings} initialBooking={new URLSearchParams(query).get("booking") === "1"} />
  ) : path === "/tours/dharavi" ? (
    <ToursV3 go={go} city="Mumbai" category="Community" tours={tours} />
  ) : /^\/tours\/\d+$/.test(path) ? (
    <Dharavi go={go} tours={tours} session={userSession} siteSettings={siteSettings} initialBooking={new URLSearchParams(query).get("booking") === "1"} tourId={Number(path.split("/").pop())} />
  ) : path === "/payment" ? (
    <DummyPayment session={userSession} />
  ) : path === "/contact" ? (
    <ContactFlowV2 session={userSession} />
  ) : (
    <Home go={go} carouselTours={carouselTours} />
  );
  const closeAuthPrompt = () => {
    sessionStorage.removeItem("nomad_after_login");
    setPendingAuthDestination("");
  };
  const continueToLogin = () => {
    setPendingAuthDestination("");
    go("/login");
  };
  return (
    <>
      {!showingLogin && (
        <Header
          path={path}
          query={query}
          go={go}
          tours={tours}
          userSession={userSession}
          onUserLogout={userSession ? logoutUser : null}
          onStaffLogout={path === "/staff" && staffSession ? logoutStaff : null}
          onAdminLogout={
            path.startsWith("/admin") && adminSession ? logoutAdmin : null
          }
        />
      )}
      {page}
      {!showingLogin && (
        <>
          <Footer go={go} />
          <a
            className="floating-whatsapp"
            href={`https://wa.me/${businessWhatsAppNumber}?text=Hello%20Nomad%20Wanderers%2C%20I%20would%20like%20to%20plan%20a%20tour.`}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Nomad Wanderers on WhatsApp"
          >
            <span className="material-symbols-outlined">chat</span>
            <span>WhatsApp</span>
          </a>
        </>
      )}
      {pendingAuthDestination && (
        <AuthRequiredModal
          destination={pendingAuthDestination}
          onCancel={closeAuthPrompt}
          onContinue={continueToLogin}
        />
      )}
    </>
  );
}

function Header({
  path,
  query = "",
  go,
  tours,
  userSession,
  onUserLogout,
  onStaffLogout,
  onAdminLogout,
}) {
  const [toursOpen, setToursOpen] = useState(false);
  const [mumbaiToursOpen, setMumbaiToursOpen] = useState(false);
  const [delhiToursOpen, setDelhiToursOpen] = useState(false);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigationRef = useRef(null);
  const profileMenuRef = useRef(null);
  const closeNavigationMenus = () => {
    setToursOpen(false);
    setMumbaiToursOpen(false);
    setDelhiToursOpen(false);
    setTripsOpen(false);
    setMobileNavOpen(false);
  };
  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!navigationRef.current?.contains(event.target)) {
        closeNavigationMenus();
        setUserMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeNavigationMenus();
        setUserMenuOpen(false);
      }
    };
    const closeMobileOnDesktop = () => {
      if (window.innerWidth > 800) setMobileNavOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeMobileOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeMobileOnDesktop);
    };
  }, []);
  useEffect(() => {
    closeNavigationMenus();
  }, [path, query]);
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target))
        setUserMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    const closeOnScroll = () => setUserMenuOpen(false);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [userMenuOpen]);
  const link = (label, to, active) => {
    const destination = label === "About" ? "/about" : to;
    return (
      <button
        className={`nav-link ${label === "About" ? path === "/about" : active ? "active" : ""}`}
        onClick={() => go(destination)}
      >
        {label}
      </button>
    );
  };
  if (onAdminLogout)
    return (
      <header className="site-header">
        <nav ref={navigationRef}>
          <button className="brand" onClick={() => go("/")}>
            Nomad Wanderers
          </button>
          <div className="nav-links">
            <span className="admin-nav-label">Admin workspace</span>
          </div>
          <div className="profile-nav-menu" ref={profileMenuRef}>
            <button
              className={`profile-nav-button admin-profile-button ${path.startsWith("/admin") ? "active" : ""}`}
              onClick={() => setUserMenuOpen((current) => !current)}
              aria-label="Open admin account menu"
              aria-expanded={userMenuOpen}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            {userMenuOpen && (
              <div className="profile-dropdown">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    go("/admin");
                  }}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Admin dashboard
                </button>
                <button className="profile-logout" onClick={onAdminLogout}>
                  <span className="material-symbols-outlined">logout</span>Log
                  out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  if (onStaffLogout)
    return (
      <header className="site-header">
        <nav ref={navigationRef}>
          <button className="brand" onClick={() => go("/")}>
            Nomad Wanderers
          </button>
          <div className="nav-links">
            <span className="admin-nav-label">Team workspace</span>
          </div>
          <div className="profile-nav-menu" ref={profileMenuRef}>
            <button
              className={`profile-nav-button ${path === "/staff" ? "active" : ""}`}
              onClick={() => setUserMenuOpen((current) => !current)}
              aria-label="Open team account menu"
              aria-expanded={userMenuOpen}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            {userMenuOpen && (
              <div className="profile-dropdown">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    go("/staff");
                  }}
                >
                  <span className="material-symbols-outlined">work</span>Team
                  workspace
                </button>
                <button className="profile-logout" onClick={onStaffLogout}>
                  <span className="material-symbols-outlined">logout</span>Log
                  out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  if (path === "/admin")
    return (
      <header className="site-header">
        <nav ref={navigationRef}>
          <button className="brand" onClick={() => go("/")}>
            Nomad Wanderers
          </button>
        </nav>
      </header>
    );
  const selectTour = (destination) => {
    closeNavigationMenus();
    setUserMenuOpen(false);
    go(destination);
  };
  const selectTrip = (destination) => {
    closeNavigationMenus();
    setUserMenuOpen(false);
    go(destination);
  };
  const mobileNavigate = (destination) => {
    closeNavigationMenus();
    setUserMenuOpen(false);
    go(destination);
  };
  const activeCity = new URLSearchParams(query).get("city");
  return (
    <header className="site-header public-header">
      <div className="contact-bar">
        <div className="contact-bar-inner">
          <div className="contact-bar-details">
            <a href="tel:+919876543210">
              <span className="material-symbols-outlined" aria-hidden="true">call</span>
              +91 98765 43210
            </a>
            <a href="mailto:hello@nomadwanderers.in">
              <span className="material-symbols-outlined" aria-hidden="true">mail</span>
              hello@nomadwanderers.in
            </a>
            <span className="contact-bar-item">
              <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
              Mumbai
            </span>
            {/* <span className="contact-bar-impact">
              <span className="material-symbols-outlined" aria-hidden="true">volunteer_activism</span>
              Ethical, authentic tours since 2012
            </span> */}
          </div>
          <div className="contact-bar-actions">
            <button className="contact-bar-search" onClick={() => go("/tours")} aria-label="Search tours">
              <span>Search tours...</span>
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
            </button>
            <div className="contact-bar-socials" aria-label="Social media links">
              <a className="facebook" href="https://www.facebook.com/mudavath.ramesh.841066/" target="_blank" rel="noreferrer" aria-label="Follow Nomad Wanderers on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.57 22v-8.74h2.93l.44-3.4h-3.37V7.69c0-.98.27-1.65 1.68-1.65h1.8V3c-.31-.04-1.38-.13-2.63-.13-2.6 0-4.38 1.59-4.38 4.5v2.49H7.1v3.4h2.94V22h3.53Z" /></svg></a>
              <a className="instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Follow Nomad Wanderers on Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.17 2A3.03 3.03 0 0 0 4 7.03v9.94A3.03 3.03 0 0 0 7.03 20h9.94A3.03 3.03 0 0 0 20 16.97V7.03A3.03 3.03 0 0 0 16.97 4H7.03Zm9.25 1.5a1.22 1.22 0 1 1 0 2.44 1.22 1.22 0 0 1 0-2.44ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
              </a>
              <a className="youtube" href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="Follow Nomad Wanderers on YouTube">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.58 12 3.58 12 3.58s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2 31.15 31.15 0 0 0 0 12a31.15 31.15 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.12A31.15 31.15 0 0 0 24 12a31.15 31.15 0 0 0-.5-5.8ZM9.6 15.55v-7.1L15.85 12 9.6 15.55Z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      <nav ref={navigationRef}>
        <button className="brand" onClick={() => go("/")}>
          Nomad Wanderers
        </button>
        <div className="nav-links">
          {link("Home", "/", path === "/")}
          <div
            className="tours-menu"
            onMouseEnter={() => setToursOpen(true)}
            onMouseLeave={() => {
              setToursOpen(false);
              setMumbaiToursOpen(false);
              setDelhiToursOpen(false);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setToursOpen(false);
                setMumbaiToursOpen(false);
                setDelhiToursOpen(false);
              }
            }}
          >
            <button
              className={`nav-link tours-trigger ${path.startsWith("/tours") ? "active" : ""}`}
              onClick={() => selectTour("/tours")}
              onFocus={() => setToursOpen(true)}
              aria-expanded={toursOpen}
              aria-haspopup="true"
            >
              Tours{" "}
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {toursOpen && (
              <div className="tours-dropdown">
                <div
                  className="nested-tour-menu"
                  onMouseEnter={() => setMumbaiToursOpen(true)}
                  onMouseLeave={() => setMumbaiToursOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => selectTour("/tours?city=Mumbai")}
                    onFocus={() => setMumbaiToursOpen(true)}
                    aria-expanded={mumbaiToursOpen}
                  >
                    Mumbai <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  {mumbaiToursOpen && (
                    <div className="nested-tour-dropdown">
                      <button onClick={() => selectTour("/tours?city=Mumbai&category=Community&view=detail")}>Dharavi community tour</button>
                      <button onClick={() => selectTour("/tours?city=Mumbai&category=City&view=detail")}>Mumbai sightseeing</button>
                    </div>
                  )}
                </div>
                <div
                  className="nested-tour-menu"
                  onMouseEnter={() => setDelhiToursOpen(true)}
                  onMouseLeave={() => setDelhiToursOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => selectTour("/tours?city=Delhi")}
                    onFocus={() => setDelhiToursOpen(true)}
                    aria-expanded={delhiToursOpen}
                  >
                    Delhi <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  {delhiToursOpen && (
                    <div className="nested-tour-dropdown">
                      <button onClick={() => selectTour("/tours?city=Delhi&category=Community")}>Delhi community tours</button>
                      <button onClick={() => selectTour("/tours?city=Delhi&category=City")}>Delhi sightseeing</button>
                    </div>
                  )}
                </div>
                <span className="dropdown-divider" />
                <button onClick={() => selectTour("/tours/unique")}>
                  Unique Experiences
                </button>
              </div>
            )}
          </div>
          <div
            className="trips-menu"
            onMouseEnter={() => setTripsOpen(true)}
            onMouseLeave={() => setTripsOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setTripsOpen(false);
              }
            }}
          >
            <button
              className={`nav-link trips-trigger ${path === "/trips" ? "active" : ""}`}
              onClick={() =>
                path === "/trips"
                  ? setTripsOpen((current) => !current)
                  : selectTrip("/trips")
              }
              onFocus={() => setTripsOpen(true)}
              aria-expanded={tripsOpen}
              aria-haspopup="true"
            >
              Multi-day Tours
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {tripsOpen && (
              <div className="trips-dropdown">
                <button onClick={() => selectTrip("/trips?mode=Shared")}>
                  Shared tours
                </button>
                <button onClick={() => selectTrip("/trips?mode=Private")}>
                  Private tours
                </button>
              </div>
            )}
          </div>
          {link("About", "/", false)}
          {link("Contact", "/contact", path === "/contact")}
        </div>
        <div className="mobile-quick-actions" aria-label="Quick contact actions">
          <button onClick={() => go("/tours")} aria-label="Search tours">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
          </button>
          <a href="tel:+919876543210" aria-label="Call Nomad Wanderers">
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
          </a>
          <a href="mailto:hello@nomadwanderers.in" aria-label="Email Nomad Wanderers">
            <span className="material-symbols-outlined" aria-hidden="true">mail</span>
          </a>
        </div>
        <button className="nav-plan-button" onClick={() => go("/contact?intent=custom")}>Plan Your Trip</button>
        {userSession ? (
          <div className="profile-nav-menu" ref={profileMenuRef}>
            <button
              className={`profile-nav-button ${path === "/account" ? "active" : ""}`}
              onClick={() => setUserMenuOpen((current) => !current)}
              aria-label="Open account menu"
              aria-expanded={userMenuOpen}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            {userMenuOpen && (
              <div className="profile-dropdown">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    go("/account");
                  }}
                >
                  <span className="material-symbols-outlined">luggage</span>My
                  journeys
                </button>
                <button className="profile-logout" onClick={onUserLogout}>
                  <span className="material-symbols-outlined">logout</span>Log
                  out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="profile-nav-button"
            onClick={() => go("/login")}
            aria-label="Sign in or create an account"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        )}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileNavOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-navigation"
        >
          <span className="material-symbols-outlined">
            {mobileNavOpen ? "close" : "menu"}
          </span>
        </button>
        {mobileNavOpen && (
          <div id="mobile-navigation" className="mobile-nav-menu">
            <button
              className={path === "/" ? "active" : ""}
              onClick={() => mobileNavigate("/")}
            >
              Home
            </button>
            <span>Tours</span>
            <button
              className={path === "/tours" && !activeCity ? "active" : ""}
              onClick={() => mobileNavigate("/tours")}
            >
              All tours
            </button>
            <button
              className={path === "/tours" && activeCity === "Mumbai" ? "active trip-option" : "trip-option"}
              onClick={() => mobileNavigate("/tours?city=Mumbai")}
            >
              Mumbai
            </button>
            <button
              className="trip-option nested-trip-option"
              onClick={() => mobileNavigate("/tours?city=Mumbai&category=Community&view=detail")}
            >
              Dharavi community tour
            </button>
            <button
              className="trip-option nested-trip-option"
              onClick={() => mobileNavigate("/tours?city=Mumbai&category=City&view=detail")}
            >
              Mumbai sightseeing
            </button>
            <button
              className={path === "/tours" && activeCity === "Delhi" ? "active trip-option" : "trip-option"}
              onClick={() => mobileNavigate("/tours?city=Delhi")}
            >
              Delhi
            </button>
            <button
              className="trip-option nested-trip-option"
              onClick={() => mobileNavigate("/tours?city=Delhi&category=Community")}
            >
              Delhi community tours
            </button>
            <button
              className="trip-option nested-trip-option"
              onClick={() => mobileNavigate("/tours?city=Delhi&category=City")}
            >
              Delhi sightseeing
            </button>
            <button
              className={path === "/tours/unique" ? "active trip-option" : "trip-option"}
              onClick={() => mobileNavigate("/tours/unique")}
            >
              Unique Experiences
            </button>
            <span>Multi-day Tours</span>
            <button
              className={path === "/trips" && !new URLSearchParams(query).get("mode") ? "active trip-option" : "trip-option"}
              onClick={() => mobileNavigate("/trips")}
            >
              All multi-day tours
            </button>
            <button
              className={new URLSearchParams(query).get("mode") === "Shared" ? "active trip-option nested-trip-option" : "trip-option nested-trip-option"}
              onClick={() => mobileNavigate("/trips?mode=Shared")}
            >
              Shared tours
            </button>
            <button
              className={new URLSearchParams(query).get("mode") === "Private" ? "active trip-option nested-trip-option" : "trip-option nested-trip-option"}
              onClick={() => mobileNavigate("/trips?mode=Private")}
            >
              Private tours
            </button>
            <button
              className={path === "/contact" && new URLSearchParams(query).get("intent") === "custom" ? "active trip-option" : "trip-option"}
              onClick={() => mobileNavigate("/contact?intent=custom")}
            >
              Plan Your Trip
            </button>
            <button
              className={path === "/about" ? "active" : ""}
              onClick={() => mobileNavigate("/about")}
            >
              About
            </button>
            <button
              className={path === "/contact" ? "active" : ""}
              onClick={() => mobileNavigate("/contact")}
            >
              Contact
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

function Hero({ children, image = images.gateway, className = "" }) {
  return (
    <section
      className={`hero-section ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(4, 25, 25, .85), rgba(4,25,25,.38)), url(${image})`,
      }}
    >
      {children}
    </section>
  );
}
function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}
function About({ go }) {
  const principles = [
    [
      "verified",
      "Authenticity",
      "We create experiences that go beyond the usual tourist trail, offering genuine insights into India's people, places, and everyday life.",
    ],
    [
      "location_on",
      "Local Expertise",
      "Our passionate local guides bring every destination to life with their knowledge, personal stories, and deep connection to the communities they call home.",
    ],
    [
      "diversity_3",
      "Cultural Respect",
      "We celebrate India's rich diversity through meaningful, respectful exchanges with its traditions, food, and communities.",
    ],
    [
      "volunteer_activism",
      "Community First",
      "We believe tourism should benefit the people who make each destination unique by supporting local businesses, artisans, and communities.",
    ],
    [
      "eco",
      "Responsible Tourism",
      "We are committed to preserving India's cultural and natural heritage while promoting sustainable and ethical tourism practices.",
    ],
    [
      "handshake",
      "Trust & Transparency",
      "From your first inquiry to the end of your journey, we deliver reliable service, transparent communication, and memorable experiences.",
    ],
  ];
  return (
    <main className="top-space">
      <Hero image={images.mumbai} className="about-hero">
        <div className="hero-content">
          <Eyebrow>Our story</Eyebrow>
          <h1>
            India is best met <em>slowly.</em>
          </h1>
          <p>
            Nomad Wanderers creates thoughtful, locally led experiences for
            travellers who want more than a checklist.
          </p>
        </div>
      </Hero>
      <section className="section about-intro">
        <div className="about-photo">
          <img src={images.raj} alt="Raj, founder of Nomad Wanderers" />
        </div>
        <div className="about-copy">
          <Eyebrow>Founded in Mumbai</Eyebrow>
          <h2>Built from a love of showing people the real city.</h2>
          <p>
            Nomad Wanderers began with Raj, a Mumbai local who spent years
            guiding visitors beyond the familiar postcard views. What started as
            one person sharing the streets he knows by heart has grown into a
            close-knit team of hosts, planners, and local experts.
          </p>
          <p>
            We still work the same way: listen closely, recommend honestly, and
            make every journey feel personal. From a first morning in Mumbai to
            a multi-day route across India, we care about the stories that stay
            with you after the photographs are packed away.
          </p>
          <div className="about-stats">
            <div>
              <b>12</b>
              <span>years guiding</span>
            </div>
            <div>
              <b>500+</b>
              <span>journeys shared</span>
            </div>
            <div>
              <b>4.9/5</b>
              <span>traveller rating</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section about-principles">
        <div className="section-heading">
          <Eyebrow>Our core values</Eyebrow>
          <h2>Why Choose Nomad Wanderers?</h2>
          <p className="lead">
            Thoughtful travel starts with real connection, respect, and people
            who know every place by heart.
          </p>
        </div>
        <div className="about-principle-grid">
          {principles.map(([icon, title, text]) => (
            <article key={title}>
              <span className="material-symbols-outlined">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section about-process">
        <div>
          <Eyebrow>How we work</Eyebrow>
          <h2>
            Carefully planned.
            <br />
            <em>Beautifully unplanned.</em>
          </h2>
        </div>
        <div className="about-process-list">
          <article>
            <b>01</b>
            <div>
              <h3>Start with you</h3>
              <p>
                We ask about your interests, energy, timing, and the kind of
                India you hope to find.
              </p>
            </div>
          </article>
          <article>
            <b>02</b>
            <div>
              <h3>Pair you with the right local voice</h3>
              <p>
                Your host brings lived knowledge, context, and the confidence to
                take a side street when it is worth it.
              </p>
            </div>
          </article>
          <article>
            <b>03</b>
            <div>
              <h3>Leave space for discovery</h3>
              <p>
                The best moments are rarely scheduled. We build in room for a
                market stall, a conversation, or a view worth lingering over.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="about-quote">
        <div>
          <span>“</span>
          <blockquote>
            We do not just show you where to go. We help you understand why a
            place matters.
          </blockquote>
          <p>— Raj, Founder</p>
        </div>
      </section>
    </main>
  );
}

function RoadTripNotification({ go }) {
  return (
    <aside className="road-trip-promo" role="status">
      <img src={roadTripCar} alt="Car on a scenic road trip" />
      <div>
        <span>Ready when you are</span>
        <strong>Let’s take the scenic route.</strong>
        <button onClick={() => go("/contact")}>Plan a trip →</button>
      </div>
    </aside>
  );
}

function OfferCountdown({ seconds, onClose }) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  return (
    <aside className="offer-countdown" role="status" aria-live="polite">
      <button onClick={onClose} aria-label="Close offer">
        ×
      </button>
      <span className="material-symbols-outlined">hourglass_top</span>
      <div>
        <small>Offer Ends In</small>
        <strong>
          {hours} <i>:</i> {minutes} <i>:</i> {remainingSeconds}
        </strong>
      </div>
    </aside>
  );
}

function Home({ go, carouselTours = [] }) {
  const [showRoadTrip, setShowRoadTrip] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [welcomeExpanded, setWelcomeExpanded] = useState(false);
  const [offerSeconds, setOfferSeconds] = useState(3 * 60 * 60 + 15 * 60 + 24);
  useEffect(() => {
    let hideRoadTripTimer;
    const roadTripTimer = window.setTimeout(() => {
      setShowRoadTrip(true);
      hideRoadTripTimer = window.setTimeout(
        () => setShowRoadTrip(false),
        6_500,
      );
    }, 24_000);
    return () => {
      window.clearTimeout(roadTripTimer);
      window.clearTimeout(hideRoadTripTimer);
    };
  }, []);
  useEffect(() => {
    const offerTimer = window.setTimeout(() => setShowOffer(true), 12_000);
    return () => window.clearTimeout(offerTimer);
  }, []);
  useEffect(() => {
    if (!showOffer) return undefined;
    const countdownTimer = window.setInterval(
      () => setOfferSeconds((current) => Math.max(0, current - 1)),
      1_000,
    );
    return () => window.clearInterval(countdownTimer);
  }, [showOffer]);
  const values = [
    [
      "verified",
      "Authenticity",
      "We create experiences that go beyond the usual tourist trail, offering genuine insights into India's people, places, and everyday life.",
    ],
    [
      "location_on",
      "Local Expertise",
      "Our passionate local guides bring every destination to life with their knowledge, personal stories, and deep connection to the communities they call home.",
    ],
    [
      "diversity_3",
      "Cultural Respect",
      "We celebrate India's rich diversity by encouraging meaningful, respectful, and immersive cultural exchanges with every experience.",
    ],
    [
      "volunteer_activism",
      "Community First",
      "We believe tourism should benefit the people who make each destination unique by supporting local businesses, artisans, and communities.",
    ],
    [
      "eco",
      "Responsible Tourism",
      "We are committed to preserving India's cultural and natural heritage while promoting sustainable and ethical tourism practices.",
    ],
    [
      "handshake",
      "Trust & Transparency",
      "From your first inquiry to the end of your journey, we are dedicated to reliable service, transparent communication, and memorable experiences.",
    ],
  ];
  return (
    <main className="home-page">
      {showRoadTrip && <RoadTripNotification go={go} />}
      {showOffer && (
        <OfferCountdown
          seconds={offerSeconds}
          onClose={() => setShowOffer(false)}
        />
      )}
      <section className="home-carousel-section">
        <HomeTourCarousel go={go} tours={carouselTours} />
      </section>
      <section className="home-welcome">
        <div className="home-welcome-copy">
          <Eyebrow>Beyond the guidebooks</Eyebrow>
          <h1>
            Feel at home,
            <br />
            <em>wherever you wander.</em>
          </h1>
          <p>
            We create locally led journeys that connect you with India's people,
            places, food, and everyday stories—beyond the guidebooks.
          </p>
          {welcomeExpanded && (
            <>
              <p>
                At Nomad Wanderers, we believe travel is about more than visiting
                landmarks—it's about connecting with the people, stories, and
                everyday life that make India extraordinary. Founded by a passionate
                local guide with years of experience hosting travellers from around
                the world, we combine iconic sights with hidden gems, authentic food,
                cultural encounters, and local perspectives.
              </p>
              <p>
                From the snow-capped valleys of Kashmir to the tranquil backwaters
                of Kerala and the vibrant landscapes of Gujarat and Assam, our vision
                is to showcase India's diversity through thoughtfully curated journeys.
              </p>
              <p>
                Every experience is rooted in genuine local connections. We invite
                you to experience India through the eyes of the people who call it
                home, creating journeys that are immersive, meaningful, and memorable.
              </p>
            </>
          )}
          <button
            className="home-welcome-more"
            type="button"
            onClick={() => setWelcomeExpanded((current) => !current)}
            aria-expanded={welcomeExpanded}
          >
            {welcomeExpanded ? "Less" : "More"}
          </button>
          <button className="primary-button" onClick={() => go("/tours")}>
            Explore our experiences <span>→</span>
          </button>
        </div>
        <div className="home-welcome-moments">
          <span>Made for meaningful journeys</span>
          <article>
            <b>Local stories</b>
            <p>
              Meet the people and neighbourhoods that make every place feel
              alive.
            </p>
          </article>
          <article>
            <b>Unhurried days</b>
            <p>
              Leave room for curiosity, chai stops and the moments you did not
              plan.
            </p>
          </article>
          <article>
            <b>Thoughtful planning</b>
            <p>
              Travel with the comfort of one trusted team from first idea to
              final day.
            </p>
          </article>
        </div>
      </section>
      <section className="section intro">
        <div className="section-heading">
          <Eyebrow>Local Insights</Eyebrow>
          <h2>Why Choose Nomad Wanderers?</h2>
        </div>
        <div className="value-grid">
          {values.map(([icon, title, text]) => (
            <article className="value-card" key={title}>
              <span className="icon-circle material-symbols-outlined">
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section soft">
        <div className="section-heading split-heading">
          <div>
            <Eyebrow>Explore by destination</Eyebrow>
            <h2>Two cities. Countless ways in.</h2>
          </div>
          <button className="text-button" onClick={() => go("/tours")}>
            View all experiences →
          </button>
        </div>
        <div className="city-pair">
          <button className="city-card" onClick={() => go("/tours")}>
            <img src={images.city} alt="Mumbai skyline" />
            <span>
              <b>Mumbai</b>
              <small>Markets, neighbourhoods, food & community</small>
            </span>
          </button>
          <button className="city-card" onClick={() => go("/tours")}>
            <img src={images.delhi} alt="Delhi architecture" />
            <span>
              <b>Delhi</b>
              <small>Heritage, street life, stories & flavours</small>
            </span>
          </button>
        </div>
      </section>
      <section className="section soft experience-strip">
        <div className="section-heading split-heading">
          <div>
            <Eyebrow>The Experiences</Eyebrow>
            <h2>Our Popular Tours</h2>
          </div>
          <button className="text-button" onClick={() => go("/tours")}>
            Browse tours →
          </button>
        </div>
        <div className="feature-grid">
          <TourFeature
            title="City Essentials"
            text="A comprehensive journey through Mumbai's most iconic landmarks and historic narratives."
            image={images.city}
            large
          />
          <TourFeature
            title="Market & Senses"
            text="Explore the vibrant colors of Crawford Market."
            image={images.market}
          />
          <TourFeature
            title="Dharavi Inside"
            text="An educational look at local industry."
            image={images.dharavi}
            onClick={() => go("/tours/dharavi")}
          />
          <TourFeature
            title="Bicycle Dawn"
            text="See the city wake up."
            image={images.bicycle}
          />
        </div>
      </section>
      <section className="section custom-travel">
        <div className="custom-copy">
          <Eyebrow>More than a day trip</Eyebrow>
          <h2>
            Your India,
            <br />
            <em>your itinerary.</em>
          </h2>
          <p>
            Planning a multi-day journey? We manage every detail —
            accommodation, domestic transport, sightseeing, local guides, and
            the experiences that make a route yours.
          </p>
          <button
            className="primary-button"
            onClick={() => go("/contact?intent=custom")}
          >
            Plan Your Trip <span>→</span>
          </button>
        </div>
        <div className="custom-steps">
          {[
            [
              "01",
              "Tell us your story",
              "Your interests, pace, budget, and wish list.",
            ],
            [
              "02",
              "We shape the route",
              "A considered itinerary with the right local moments.",
            ],
            [
              "03",
              "Travel with confidence",
              "One trusted team from first plan to final day.",
            ],
          ].map(([number, title, text]) => (
            <article key={number}>
              <b>{number}</b>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section story" id="story">
        <div className="story-photo">
          <img src={images.raj} alt="Raj, your local guide" />
        </div>
        <div className="story-copy">
          <Eyebrow>The Heart of Nomad Wanderers</Eyebrow>
          <h2>Our Story</h2>
          <p>
            Nomad Wanderers began with a simple idea—to share the real India
            through the eyes of those who call it home. Founded by Rajesh,
            better known as Raj, who was born and raised in Dharavi, Mumbai,
            the journey started with a passion for introducing travellers to
            his community beyond stereotypes and headlines.
          </p>
          <p>
            Over the past 12+ years, that passion has grown into a deep
            understanding of India's history, culture, and diverse traditions.
            From leading immersive experiences through Mumbai to exploring the
            ancient wonders of Ajanta and Ellora and designing journeys across
            North and South India, Raj's vision has remained the same—to help
            travellers experience India beyond the guidebooks.
          </p>
          <p>
            Today, Nomad Wanderers creates thoughtfully curated private
            journeys that connect visitors with India's iconic landmarks,
            hidden gems, local communities, and authentic everyday life. Every
            experience is built on genuine local knowledge, meaningful
            connections, and the stories, people, and traditions that make
            India truly extraordinary.
          </p>
          <div className="stats">
            <div>
              <b>5,000+</b>
              <span>Tours guided</span>
            </div>
            <div>
              <b>★ 5.0</b>
              <span>Star rating</span>
            </div>
            <div>
              <b>12+</b>
              <span>Years of experience</span>
            </div>
          </div>
          <button className="text-button" onClick={() => go("/contact")}>
            Meet the team →
          </button>
        </div>
      </section>
      <section className="section testimonials">
        <Eyebrow>Traveller stories</Eyebrow>
        <h2>Loved by curious travellers</h2>
        <div className="quote-grid">
          {[
            [
              "“Raj’s local knowledge made our Dharavi tour the highlight of our trip.”",
              "Sarah M.",
              "United Kingdom",
            ],
            [
              "“The dawn bicycle tour was magical. Highly professional and truly memorable.”",
              "David L.",
              "Australia",
            ],
            [
              "“Professional, safe, and authentic. We saw the real Mumbai.”",
              "Elena K.",
              "Germany",
            ],
          ].map(([quote, name, place]) => (
            <blockquote key={name}>
              <span>“</span>
              <p>{quote.replaceAll("“", "").replaceAll("”", "")}</p>
              <footer>
                <b>{name}</b>
                <small>{place}</small>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </main>
  );
}

function TourFeature({ title, text, image, large, onClick }) {
  return (
    <button
      className={`tour-feature ${large ? "large" : ""}`}
      onClick={onClick}
    >
      <img src={image} alt="" />
      <span className="tile-overlay" />
      <span className="tile-copy">
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </button>
  );
}

const homeFeaturedTours = [
  {
    title: "Mumbai City Essentials",
    city: "Mumbai",
    description:
      "A locally led introduction to Mumbai’s landmark views, historic streets and everyday stories.",
    image: images.city,
    duration: "8 hours",
    price: "₹3,200",
    highlights: ["Gateway of India", "Marine Drive", "Local lunch"],
  },
  {
    title: "South Mumbai Heritage Walk",
    city: "Mumbai",
    description:
      "Walk through Kala Ghoda, the Fort district and Mumbai’s grand colonial landmarks with a local history guide.",
    image: images.heritage,
    duration: "6 hours",
    price: "₹2,600",
    highlights: ["Kala Ghoda", "Colonial architecture", "Local chai"],
  },
  {
    title: "Dharavi Inside",
    city: "Mumbai",
    description:
      "A respectful, resident-led perspective on local enterprise, craft and community in Dharavi.",
    image: images.dharavi,
    duration: "3 hours",
    price: "₹1,500",
    highlights: ["Resident guide", "Local industry", "Community perspective"],
  },
  {
    title: "Delhi City Discovery",
    city: "Delhi",
    description:
      "Discover the contrast of old and new Delhi, from bustling bazaars to grand avenues.",
    image: images.delhi,
    duration: "8 hours",
    price: "₹3,400",
    highlights: ["Old Delhi", "India Gate", "Private transport"],
  },
];

function HomeTourCarousel({ go, tours = [] }) {
  const carouselItems = tours.length ? tours : homeFeaturedTours;
  const [activeIndex, setActiveIndex] = useState(0);
  const tour = carouselItems[activeIndex % carouselItems.length];
  const changeTour = (direction) =>
    setActiveIndex(
      (current) =>
        (current + direction + carouselItems.length) % carouselItems.length,
    );
  useEffect(() => {
    setActiveIndex(0);
  }, [tours]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % carouselItems.length),
      5_000,
    );
    return () => window.clearInterval(timer);
  }, [carouselItems.length]);
  return (
    <section className="home-tour-carousel" aria-label="Popular tours carousel">
      <div className="home-tour-carousel-card" key={tour.title}>
        <div className="home-tour-carousel-image">
          <img src={tour.image} alt="" />
        </div>
        <div className="home-tour-carousel-content">
          <h3>{tour.title}</h3>
          <button
            className="primary-button"
            onClick={() => tour.id
              ? go(`/tours/${tour.id}`)
              : go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}
          >
            Book this tour →
          </button>
        </div>
        <button
          className="home-carousel-arrow previous"
          onClick={() => changeTour(-1)}
          aria-label="Show previous tour"
        >
          ←
        </button>
        <button
          className="home-carousel-arrow next"
          onClick={() => changeTour(1)}
          aria-label="Show next tour"
        >
          →
        </button>
        <div className="home-carousel-pagination">
          {carouselItems.map((item, index) => (
            <button
              key={item.id || item.title}
              className={index === activeIndex ? "active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.title}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tours({ go, tours }) {
  const [filter, setFilter] = useState("All experiences");
  const filterOptions = [
    "All experiences",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "One-day trip",
    "Weekly trip",
    "Shared",
    "Private",
  ];
  const displayed =
    filter === "All experiences"
      ? tours
      : tours.filter((tour) =>
          [tour.city, tour.trip_type, tour.mode, tour.category].includes(
            filter,
          ),
        );
  return (
    <main className="top-space">
      <section className="section tours-page">
        <Eyebrow>Locally led across India</Eyebrow>
        <h1>Curated Experiences</h1>
        <p className="lead">
          Browse one-day and weekly tours in Mumbai, Delhi and Hyderabad, then
          choose the shared or private format that suits you.
        </p>
        <div className="filters">
          {filterOptions.map((item) => (
            <button
              key={item}
              className={filter === item ? "selected" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="tour-grid">
          {displayed.map((tour) => (
            <article
              className={`tour-card ${tour.featured ? "featured" : ""}`}
              key={tour.title}
            >
              <div className="tour-image">
                <img src={tour.image} alt="" />
                {tour.tag && <span>{tour.tag}</span>}
              </div>
              <div className="tour-body">
                <div className="tour-meta">
                  <span>⌖ {tour.city}</span>
                  <span>
                    {tour.trip_type} · {tour.mode}
                  </span>
                </div>
                <h2>{tour.title}</h2>
                <p>{tour.text}</p>
                <div className="tour-details">
                  <span>◷ {tour.duration}</span>
                  <strong>
                    {tour.price}
                    <small> / person</small>
                  </strong>
                </div>
                <div className="highlight-list">
                  {tour.highlights.map((highlight) => (
                    <span key={highlight}>✓ {highlight}</span>
                  ))}
                </div>
                <button
                  className={tour.dark ? "dark-button" : "outline-button"}
                  onClick={() =>
                    tour.title === "Dharavi Slum Tours"
                      ? go("/tours/dharavi")
                      : go(
                          `/contact?intent=book&tour=${encodeURIComponent(tour.title)}`,
                        )
                  }
                >
                  {tour.featured
                    ? "Book this tour →"
                    : "Book this experience →"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="booking-benefits">
        <div>
          <span className="material-symbols-outlined">verified_user</span>
          <b>Trusted local hosts</b>
          <small>Guides who live the story</small>
        </div>
        <div>
          <span className="material-symbols-outlined">groups</span>
          <b>Small groups</b>
          <small>More time for real connection</small>
        </div>
        <div>
          <span className="material-symbols-outlined">event_available</span>
          <b>Flexible booking</b>
          <small>Free cancellation up to 24h</small>
        </div>
        <div>
          <span className="material-symbols-outlined">support_agent</span>
          <b>Local support</b>
          <small>One team from plan to return</small>
        </div>
      </section>
    </main>
  );
}

function ToursV2({ go, tours }) {
  const [filter, setFilter] = useState("All experiences");
  const [search, setSearch] = useState("");
  const filters = [
    "All experiences",
    "Heritage",
    "Food",
    "Culture",
    "Walking",
    "Adventure",
    "Shared",
    "Private",
  ];
  const normalizedSearch = search.trim().toLowerCase();
  const displayed = tours.filter((tour) => {
    const matchesFilter =
      filter === "All experiences" ||
      tour.mode === filter ||
      tour.category.toLowerCase().includes(filter.toLowerCase());
    const searchableText =
      `${tour.title} ${tour.description} ${tour.category}`.toLowerCase();
    return (
      matchesFilter &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    );
  });
  return (
    <main className="top-space">
      <section className="section tours-page">
        <Eyebrow>Find your kind of day</Eyebrow>
        <h1>Curated Experiences</h1>
        <p className="lead">
          Browse local experiences by the stories you want to take home—from
          heritage streets and food trails to culture-led walks.
        </p>
        <div className="tour-browser-tools">
          <label className="tour-search">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search experiences"
              aria-label="Search experiences"
            />
          </label>
          <div className="filters" aria-label="Filter experiences">
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {displayed.length ? (
          <div className="tour-grid">
            {displayed.map((tour) => (
              <article
                className={`tour-card ${tour.featured ? "featured" : ""}`}
                key={tour.id}
              >
                <div className="tour-image">
                  <img src={tour.image} alt="" />
                  {tour.tag && <span>{tour.tag}</span>}
                </div>
                <div className="tour-body">
                  <div className="tour-meta">
                    <span>{tour.category}</span>
                    <span>{tour.mode}</span>
                  </div>
                  <h2>{tour.title}</h2>
                  <p>{tour.text}</p>
                  <div className="tour-details">
                    <span>{tour.duration}</span>
                    <strong>
                      {tour.price}
                      <small> / person</small>
                    </strong>
                  </div>
                  <div className="highlight-list">
                    {tour.highlights.map((highlight) => (
                      <span key={highlight}>✓ {highlight}</span>
                    ))}
                  </div>
                  <button
                    className={tour.dark ? "dark-button" : "outline-button"}
                    onClick={() =>
                      go(
                        `/contact?intent=book&tour=${encodeURIComponent(tour.title)}`,
                      )
                    }
                  >
                    Book this tour →
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty tour-empty">
            <h2>No experiences found</h2>
            <p>
              Try a different interest or search term, or let us design a
              journey around what you love.
            </p>
            <button
              className="outline-button"
              onClick={() => go("/contact?intent=custom")}
            >
              Plan Your Trip
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function PublicPagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="public-pagination">
      <span>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
        of {total} experiences
      </span>
      <div>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ToursV3({ go, city, category = "", mode = "", tours = [] }) {
  const [filter, setFilter] = useState("All experiences");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const isUniqueExperiencesPage = category === "Unique";
  const useExperienceFilterDropdown = isUniqueExperiencesPage || city === "Delhi";
  const filters = city
    ? ["All experiences", "Shared", "Private"]
    : [
        "All experiences",
        "Heritage",
        "Food",
        "Culture",
        "Walking",
        "Adventure",
        "Shared",
        "Private",
      ];
  const categoryTitle =
    category === "Unique"
      ? "Unique Experiences"
      : category === "Festival"
        ? "Festival Tours"
        : category
          ? `${category} Tours`
          : "Curated Experiences";
  const categoryLead =
    category === "Unique"
      ? "Discover thoughtful, locally led experiences built around the people, places, and stories visitors often miss."
      : category === "Festival"
        ? "Celebrate India through locally led festival experiences, cultural traditions and memorable seasonal moments."
        : category
          ? `Explore our ${category.toLowerCase()} experiences, led by local experts and designed around memorable stories.`
          : "Browse local experiences by the stories you want to take home—from heritage streets and food trails to culture-led walks.";
  useEffect(() => {
    setLoading(true);
    const parameters = new URLSearchParams({
      page: String(page),
      page_size: "9",
    });
    if (city) parameters.set("city", city);
    if (mode) parameters.set("mode", mode);
    if (search.trim()) parameters.set("search", search.trim());
    if (category) parameters.set("category", category);
    if (filter === "Shared" || filter === "Private")
      parameters.set("mode", filter);
    else if (!category && filter !== "All experiences")
      parameters.set("category", filter);
    fetch(`${apiBaseUrl}/api/tours?${parameters}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const apiItems = data.items.map(apiTourToUi);
        if (apiItems.length) setResults({ items: apiItems, total: data.total });
        else {
          const fallback = tours.filter((item) =>
            (!city || item.city === city) &&
            (!category || item.category === category) &&
            (filter === "All experiences" || filter === "Shared" || filter === "Private" || item.category === filter) &&
            (filter !== "Shared" && filter !== "Private" || item.mode === filter),
          );
          setResults({ items: fallback, total: fallback.length });
        }
      })
      .catch(() => {
        const fallback = tours.filter((item) =>
          (!city || item.city === city) &&
          (!category || item.category === category) &&
          (filter === "All experiences" || filter === "Shared" || filter === "Private" || item.category === filter) &&
          (filter !== "Shared" && filter !== "Private" || item.mode === filter),
        );
        setResults({ items: fallback, total: fallback.length });
      })
      .finally(() => setLoading(false));
  }, [filter, search, page, city, category, mode, tours, useExperienceFilterDropdown]);
  useEffect(() => {
    setPage(1);
    setFilter("All experiences");
    setSearch("");
  }, [city, category, mode]);
  const chooseFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };
  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  return (
    <main className="top-space">
      {city && (
        <section className="city-tour-intro">
          <div className="city-tour-intro-image" style={{ backgroundImage: `url(${images[city?.toLowerCase()] || images.heritage})` }} />
          <div className="city-tour-intro-copy">
            <Eyebrow>{city} experiences</Eyebrow>
            <h1>Discover {city}</h1>
            <p>{city === "Mumbai" ? "Explore Mumbai through its iconic landmarks, vibrant markets, coastal roads, and neighbourhood stories. Meet local hosts, taste authentic food, and experience the city beyond the guidebooks. Our Mumbai tours are thoughtfully paced, personal, and designed for curious travellers." : city ? `Discover the history, culture, food, and local stories that make ${city} unforgettable. Join our locally led tours for a thoughtful and memorable experience.` : `Join our specially curated ${category.toLowerCase()} experiences, led by local experts and designed around memorable stories, places, and moments.`}</p>
          </div>
        </section>
      )}
      <section className={`section tours-page ${city ? "city-selected" : ""}`}>
        <Eyebrow>
          {category
            ? category === "Unique" ? "Handpicked experiences" : "Seasonal experiences"
            : city
              ? `Explore ${city}`
              : "Find your kind of day"}
        </Eyebrow>
        <h1>
          {category
            ? categoryTitle
            : city
              ? `${city} Tours`
              : "Curated Experiences"}
        </h1>
        <p className="lead">
          {category
            ? categoryLead
            : city
              ? `Browse every locally led experience currently available in ${city}.`
              : "Browse local experiences by the stories you want to take home—from heritage streets and food trails to culture-led walks."}
        </p>
        <div className="tour-browser-tools">
          <label className="tour-search">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search experiences"
              aria-label="Search experiences"
            />
          </label>
          {useExperienceFilterDropdown ? (
            <label className="experience-filter-select">
              <span className="sr-only">Filter experiences</span>
              <select value={filter} onChange={(event) => chooseFilter(event.target.value)}>
                {filters.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          ) : (
            <div className="filters" aria-label="Filter experiences">
              {filters.map((item) => (
                <button
                  key={item}
                  className={filter === item ? "selected" : ""}
                  onClick={() => chooseFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading ? (
          <p className="lead">Loading experiences...</p>
        ) : results.items.length ? (
          <>
            <div className="tour-grid">
              {results.items.map((tour) => (
                <article
                  className={`tour-card ${tour.featured ? "featured" : ""}`}
                  key={tour.id}
                >
                  <div className="tour-image">
                    <img src={tour.image} alt="" />
                    {tour.tag && <span>{tour.tag}</span>}
                  </div>
                  <div className="tour-body">
                    <div className="tour-meta">
                      <span>{tour.category}</span>
                      <span>{tour.mode}</span>
                    </div>
                    <h2>{tour.title}</h2>
                    <p>{tour.text}</p>
                    <div className="tour-details">
                      <span>{tour.duration}</span>
                      <strong>
                        {tour.price}
                        <small> / person</small>
                      </strong>
                    </div>
                    <div className="highlight-list">
                      {(tour.highlights || []).map((highlight) => (
                        <span key={highlight}>✓ {highlight}</span>
                      ))}
                    </div>
                    <button
                      className={tour.dark ? "dark-button" : "outline-button"}
                      onClick={() => go(`/tours/${tour.id}`)}
                    >
                      Book this tour →
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <PublicPagination
              page={page}
              total={results.total}
              pageSize={9}
              onChange={setPage}
            />
          </>
        ) : (
          <div className="admin-empty tour-empty">
            <h2>No experiences found</h2>
            <p>
              Try another interest or search term, or let us design a journey
              around what you love.
            </p>
            <button
              className="outline-button"
              onClick={() => go("/contact?intent=custom")}
            >
              Plan Your Trip
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function MultiDayToursPage({ go, mode = "", tours = [] }) {
  const [results, setResults] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const selectedMode = ["Shared", "Private"].includes(mode) ? mode : "";
  const multiDayTripType = "Weekly trip";
  const heroImage = images.rajasthanCamelTour;
  useEffect(() => {
    setLoading(true);
    const parameters = new URLSearchParams({
      trip_type: multiDayTripType,
      page: "1",
      page_size: "100",
    });
    if (selectedMode) parameters.set("mode", selectedMode);
    fetch(`${apiBaseUrl}/api/tours?${parameters}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        const apiItems = data.items.map(apiTourToUi);
        if (apiItems.length) {
          setResults({ items: apiItems, total: data.total });
          return;
        }
        const fallback = tours.filter(
          (item) =>
            item.trip_type === multiDayTripType &&
            (!selectedMode || item.mode === selectedMode),
        );
        setResults({ items: fallback, total: fallback.length });
      })
      .catch(() => {
        const fallback = tours.filter(
          (item) =>
            item.trip_type === multiDayTripType &&
            (!selectedMode || item.mode === selectedMode),
        );
        setResults({ items: fallback, total: fallback.length });
      })
      .finally(() => setLoading(false));
  }, [selectedMode, tours]);
  return (
    <main className="top-space multi-day-page">
      <section
        className="multi-day-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(0, 32, 35, .72), rgba(0, 32, 35, .2)), url(${heroImage})` }}
      >
        <div className="multi-day-hero-content">
          <Eyebrow>Longer journeys, deeper connections</Eyebrow>
          <h1>Multi-day Tours</h1>
        </div>
      </section>
      <section className="section multi-day-intro">
        <Eyebrow>{selectedMode ? `${selectedMode} journeys` : "Travel deeper"}</Eyebrow>
        <h2>
          {selectedMode
            ? `${selectedMode} multi-day tours`
            : "More time for the stories that matter"}
        </h2>
        <p className="lead">
          {selectedMode
            ? `Travel with the ease of a ${selectedMode.toLowerCase()} group, with thoughtful pacing, local guides and room to experience each destination properly.`
            : "Take the scenic route through India with thoughtfully planned journeys, local hosts and the freedom to experience more than one destination in a day."}
        </p>
      </section>
      <section className="section multi-day-results">
        <div className="section-heading split-heading">
          <div>
            <Eyebrow>{selectedMode || "Shared & private"} multi-day tours</Eyebrow>
            <h2>{selectedMode ? `${selectedMode} tours` : "Choose your way to travel"}</h2>
          </div>
          <label className="experience-filter-select multi-day-filter-select">
            <span className="sr-only">Filter multi-day tours</span>
            <select
              value={selectedMode}
              onChange={(event) =>
                go(event.target.value ? `/trips?mode=${event.target.value}` : "/trips")
              }
            >
              <option value="">All multi-day tours</option>
              <option value="Shared">Shared tours</option>
              <option value="Private">Private tours</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p className="lead">Loading multi-day tours...</p>
        ) : results.items.length ? (
          <div className="tour-grid trip-grid">
            {results.items.map((tour) => (
              <article className="tour-card multi-day-tour-card" key={tour.id || tour.title}>
                <div className="tour-image">
                  <img src={tour.image || heroImage} alt="" />
                  {tour.tag && <span>{tour.tag}</span>}
                </div>
                <div className="tour-body">
                  <div className="tour-meta">
                    <span>{tour.city}</span>
                    <span>{tour.mode}</span>
                  </div>
                  <h2>{tour.title}</h2>
                  <p>{tour.text || tour.description}</p>
                  <div className="tour-details">
                    <span>{tour.duration}</span>
                    <strong>
                      {tour.price}
                      <small> / person</small>
                    </strong>
                  </div>
                  <div className="highlight-list">
                    {(tour.highlights || []).map((highlight) => (
                      <span key={highlight}>✓ {highlight}</span>
                    ))}
                  </div>
                  <button
                    className="outline-button"
                    onClick={() =>
                      tour.id
                        ? go(`/tours/${tour.id}`)
                        : go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)
                    }
                  >
                    View tour →
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty trip-empty">
            <h2>No {selectedMode ? selectedMode.toLowerCase() : "shared or private"} multi-day tours yet</h2>
            <p>Tell us where you want to go and we will shape a longer journey around you.</p>
            <button className="outline-button" onClick={() => go("/contact?intent=custom")}>Plan Your Trip</button>
          </div>
        )}
      </section>
    </main>
  );
}

function TripsPageV2({ go, type }) {
  const [city, setCity] = useState("Mumbai");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const tripType = tripCatalog[type];
  const selectedTripType = type === "one-day" ? "One-day trip" : "Weekly trip";
  useEffect(() => {
    setLoading(true);
    const parameters = new URLSearchParams({
      city,
      trip_type: selectedTripType,
      page: String(page),
      page_size: "6",
    });
    fetch(`${apiBaseUrl}/api/tours?${parameters}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) =>
        setResults({ items: data.items.map(apiTourToUi), total: data.total }),
      )
      .catch(() => setResults({ items: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [city, selectedTripType, page]);
  const selectCity = (nextCity) => {
    setCity(nextCity);
    setPage(1);
  };
  return (
    <main className="top-space">
      <section className="section trips-page">
        <div className="section-heading">
          <Eyebrow>{tripType.eyebrow}</Eyebrow>
          <h1>{tripType.label}</h1>
          <p className="lead">{tripType.intro}</p>
        </div>
        <div className="trip-city-tabs" aria-label="Choose a city">
          <span>Choose a city</span>
          {["Mumbai", "Delhi"].map((item) => (
            <button
              key={item}
              className={city === item ? "selected" : ""}
              onClick={() => selectCity(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="trip-results-heading">
          <div>
            <Eyebrow>Explore {city}</Eyebrow>
            <h2>
              {city} {type === "one-day" ? "in a day" : "over a week"}
            </h2>
          </div>
          <p>
            {type === "one-day"
              ? "Choose a complete city experience, led by a local who knows where the best stories are hiding."
              : "Each journey can be tailored around your pace, preferred stays and the experiences that matter most to you."}
          </p>
        </div>
        {loading ? (
          <p className="lead">Loading trips...</p>
        ) : results.items.length ? (
          <>
            <div className="tour-grid trip-grid">
              {results.items.map((tour) => (
                <article className="tour-card" key={tour.id}>
                  <div className="tour-image">
                    <img src={tour.image} alt="" />
                  </div>
                  <div className="tour-body">
                    <div className="tour-meta">
                      <span>{tour.city}</span>
                      <span>{tour.mode}</span>
                    </div>
                    <h2>{tour.title}</h2>
                    <p>{tour.text}</p>
                    <div className="tour-details">
                      <span>{tour.duration}</span>
                      <strong>
                        {tour.price}
                        <small> / person</small>
                      </strong>
                    </div>
                    <div className="highlight-list">
                      {tour.highlights.map((highlight) => (
                        <span key={highlight}>✓ {highlight}</span>
                      ))}
                    </div>
                    <button
                      className="outline-button"
                      onClick={() =>
                        go(
                          `/contact?intent=book&tour=${encodeURIComponent(tour.title)}`,
                        )
                      }
                    >
                      Book this tour →
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <PublicPagination
              page={page}
              total={results.total}
              pageSize={6}
              onChange={setPage}
            />
          </>
        ) : (
          <div className="admin-empty trip-empty">
            <h2>
              No {selectedTripType.toLowerCase()} tours in {city} yet
            </h2>
            <p>
              Choose another city or let us design a journey around your dates.
            </p>
            <button
              className="outline-button"
              onClick={() => go("/contact?intent=custom")}
            >
              Plan Your Trip
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

const tripCatalog = {
  "one-day": {
    label: "One-day trips",
    eyebrow: "Make a day of it",
    intro:
      "Unhurried, locally led days built around the stories, flavours and neighbourhoods that make each city unforgettable.",
    Mumbai: [
      {
        title: "Mumbai City Essentials",
        description:
          "A complete introduction to Mumbai, from the Gateway of India and Colaba to Marine Drive and the historic Fort district.",
        image: images.city,
        duration: "8 hours",
        price: "₹3,200",
        highlights: ["Gateway of India", "Marine Drive", "Local lunch"],
      },
      {
        title: "South Mumbai Heritage Walk",
        description:
          "Trace the architecture, trading stories and hidden lanes of one of Mumbai’s most evocative districts.",
        image: images.heritage,
        duration: "6 hours",
        price: "₹2,600",
        highlights: ["Kala Ghoda", "Colonial architecture", "Local chai"],
      },
      {
        title: "Mumbai Street Food Trail",
        description:
          "Taste your way through neighbourhood favourites, family-run stalls and the city’s best-loved snacks.",
        image: images.food,
        duration: "5 hours",
        price: "₹2,400",
        highlights: ["Market tasting", "Regional flavours", "Small groups"],
      },
    ],
    Delhi: [
      {
        title: "Old and New Delhi Essentials",
        description:
          "See Delhi’s contrasting worlds in one rich day, from Jama Masjid and Chandni Chowk to India Gate and Lutyens Delhi.",
        image: images.delhi,
        duration: "8 hours",
        price: "₹3,400",
        highlights: ["Old Delhi", "India Gate", "Private transport"],
      },
      {
        title: "Old Delhi Food and Heritage",
        description:
          "Wander the lanes of Shahjahanabad with a local guide, stopping for stories, street food and centuries-old landmarks.",
        image: images.market,
        duration: "6 hours",
        price: "₹2,700",
        highlights: ["Chandni Chowk", "Jama Masjid", "Food tastings"],
      },
      {
        title: "Mehrauli Monuments Walk",
        description:
          "Explore the leafy archaeological park and the layered history around Qutub Minar at a relaxed pace.",
        image: images.raj,
        duration: "5 hours",
        price: "₹2,500",
        highlights: ["Qutub Minar", "Mehrauli park", "Expert guide"],
      },
    ],
  },
  weekly: {
    label: "Weekly trips",
    eyebrow: "Settle in and explore",
    intro:
      "Seven-day journeys that leave room for landmark moments, local encounters and the pleasure of travelling without rushing.",
    Mumbai: [
      {
        title: "Mumbai and the Konkan Coast",
        description:
          "A seven-day route from Mumbai’s lively neighbourhoods to the quiet beaches, forts and coastal kitchens of the Konkan.",
        image: images.mumbai,
        duration: "7 days",
        price: "₹32,500",
        highlights: ["Mumbai highlights", "Coastal stays", "Konkan cuisine"],
      },
      {
        title: "Mumbai, Nashik and the Western Ghats",
        description:
          "Pair the energy of Mumbai with vineyard landscapes, temple towns and gentle walks through the Western Ghats.",
        image: images.bicycle,
        duration: "7 days",
        price: "₹35,000",
        highlights: ["Mumbai city", "Nashik vineyards", "Hill landscapes"],
      },
    ],
    Delhi: [
      {
        title: "Delhi and the Golden Triangle",
        description:
          "A considered week through Delhi, Agra and Jaipur, balancing iconic monuments with local markets and relaxed evenings.",
        image: images.delhi,
        duration: "7 days",
        price: "₹39,500",
        highlights: ["Delhi heritage", "Agra and the Taj", "Jaipur markets"],
      },
      {
        title: "Delhi, Agra and Rajasthan Stories",
        description:
          "Travel from the capital to Agra and Rajasthan for palaces, craft traditions, regional cuisine and memorable stays.",
        image: images.gateway,
        duration: "7 days",
        price: "₹42,000",
        highlights: ["Old Delhi", "Agra", "Rajasthan culture"],
      },
    ],
  },
};

function TripsPage({ go, type }) {
  const [city, setCity] = useState("Mumbai");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const tripType = tripCatalog[type];
  const selectedTripType = type === "one-day" ? "One-day trip" : "Weekly trip";
  const selectCity = (nextCity) => setCity(nextCity);
  useEffect(() => {
    setLoading(true);
    const search = new URLSearchParams({ city, trip_type: selectedTripType });
    fetch(`${apiBaseUrl}/api/tours?${search}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setTrips(
          data.map((tour) => ({
            ...tour,
            image: tour.image_url,
            price: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(tour.price),
          })),
        );
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [city, selectedTripType]);
  return (
    <main className="top-space">
      <section className="section trips-page">
        <div className="section-heading">
          <Eyebrow>{tripType.eyebrow}</Eyebrow>
          <h1>{tripType.label}</h1>
          <p className="lead">{tripType.intro}</p>
        </div>
        <div className="trip-city-tabs" aria-label="Choose a city">
          <span>Choose a city</span>
          {["Mumbai", "Delhi"].map((item) => (
            <button
              key={item}
              className={city === item ? "selected" : ""}
              onClick={() => selectCity(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="trip-results-heading">
          <div>
            <Eyebrow>Explore {city}</Eyebrow>
            <h2>
              {city} {type === "one-day" ? "in a day" : "over a week"}
            </h2>
          </div>
          <p>
            {type === "one-day"
              ? "Choose a complete city experience, led by a local who knows where the best stories are hiding."
              : "Each journey can be tailored around your pace, preferred stays and the experiences that matter most to you."}
          </p>
        </div>
        <div className="tour-grid trip-grid">
          {trips.map((trip) => (
            <article className="tour-card" key={trip.title}>
              <div className="tour-image">
                <img src={trip.image} alt="" />
              </div>
              <div className="tour-body">
                <div className="tour-meta">
                  <span>⌖ {city}</span>
                  <span>{type === "one-day" ? "One day" : "Weekly trip"}</span>
                </div>
                <h2>{trip.title}</h2>
                <p>{trip.description}</p>
                <div className="tour-details">
                  <span>◷ {trip.duration}</span>
                  <strong>
                    {trip.price}
                    <small> / person</small>
                  </strong>
                </div>
                <div className="highlight-list">
                  {trip.highlights.map((highlight) => (
                    <span key={highlight}>✓ {highlight}</span>
                  ))}
                </div>
                <button
                  className="outline-button"
                  onClick={() =>
                    go(
                      `/contact?intent=book&tour=${encodeURIComponent(trip.title)}`,
                    )
                  }
                >
                  Book this tour →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AdminLogin({ onAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to authenticate.");
      onAuthenticated({ token: body.access_token });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="top-space">
      <section className="section contact-grid">
        <div>
          <Eyebrow>Private management</Eyebrow>
          <h1>Admin Sign In</h1>
          <p className="lead">
            Sign in to manage the public tours collection. This page is not
            shown in the site navigation.
          </p>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <h2>Welcome back</h2>
          <label>
            Username
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in →"}
          </button>
          {status && <p>{status}</p>}
        </form>
      </section>
    </main>
  );
}

function AdminHome({ session, onTourSaved, onTourDeleted }) {
  const [tours, setTours] = useState([]);
  const [screen, setScreen] = useState("list");
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedTourIds, setSelectedTourIds] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${session.token}` };
  const loadTours = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, {
        headers,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Unable to load tours.");
      setTours(body);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTours();
  }, []);
  const removeTour = async (tour) => {
    if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`))
      return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Unable to delete the tour.");
      }
      setTours((current) => current.filter((item) => item.id !== tour.id));
      setSelectedTourIds((current) => current.filter((id) => id !== tour.id));
      onTourDeleted(tour.id);
    } catch (error) {
      setStatus(error.message);
    }
  };
  const toggleTourSelection = (tourId) => {
    setSelectedTourIds((current) =>
      current.includes(tourId)
        ? current.filter((id) => id !== tourId)
        : [...current, tourId],
    );
  };
  const toggleAllVisibleTours = () => {
    const visibleIds = pageRecords.map((tour) => tour.id);
    const allSelected = visibleIds.every((id) => selectedTourIds.includes(id));
    setSelectedTourIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };
  const removeSelectedTours = async () => {
    if (!selectedTourIds.length) return;
    if (!window.confirm(`Permanently delete ${selectedTourIds.length} selected tour(s)? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tour_ids: selectedTourIds }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Unable to delete selected tours.");
      setTours((current) => current.filter((tour) => !selectedTourIds.includes(tour.id)));
      selectedTourIds.forEach(onTourDeleted);
      setStatus(`${body.deleted} tour(s) permanently deleted.`);
      setSelectedTourIds([]);
    } catch (error) {
      setStatus(error.message);
    }
  };
  const saved = (tour) => {
    setTours((current) => [
      tour,
      ...current.filter((item) => item.id !== tour.id),
    ]);
    onTourSaved(tour);
    setScreen("list");
    setSelectedTour(null);
  };
  if (screen !== "list")
    return (
      <TourEditorV2
        tour={selectedTour}
        session={session}
        onCancel={() => {
          setScreen("list");
          setSelectedTour(null);
        }}
        onSaved={saved}
      />
    );
  return (
    <main className="top-space">
      <section className="section admin-dashboard">
        <div className="admin-heading">
          <div>
            <Eyebrow>Private management</Eyebrow>
            <h1>Tour Dashboard</h1>
            <p className="lead">
              Add, edit, publish, or remove your experiences.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setScreen("create")}
          >
            Add a tour <span>→</span>
          </button>
        </div>
        {status && <p className="admin-status">{status}</p>}
        {loading ? (
          <p className="lead">Loading tours…</p>
        ) : tours.length === 0 ? (
          <div className="admin-empty">
            <h2>No tours yet</h2>
            <p>Add your first tour to make it available on the website.</p>
            <button
              className="outline-button"
              onClick={() => setScreen("create")}
            >
              Add your first tour
            </button>
          </div>
        ) : (
          <div className="admin-tour-grid">
            {tours.map((tour) => (
              <article className="admin-tour-card" key={tour.id}>
                <img src={tour.image_url} alt="" />
                <div className="admin-card-copy">
                  <div>
                    <span>{tour.published ? "Published" : "Draft"}</span>
                    <span>{tour.mode}</span>
                  </div>
                  <h2>{tour.title}</h2>
                  <p>
                    {tour.city} · {tour.duration} · ₹
                    {Number(tour.price).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => {
                      setSelectedTour(tour);
                      setScreen("edit");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => removeTour(tour)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TourEditor({ tour, session, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: tour?.title || "",
    description: tour?.description || "",
    image_url: tour?.image_url || "",
    city: tour?.city || "Mumbai",
    mode: tour?.mode || "Shared",
    category: tour?.category || "",
    duration: tour?.duration || "",
    price: tour?.price || "",
    highlights: (tour?.highlights || []).join(", "),
    tag: tour?.tag || "",
    featured: tour?.featured || false,
    dark: tour?.dark || false,
    published: tour?.published ?? true,
  }));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const payload = {
      ...form,
      price: Number(form.price),
      highlights: form.highlights
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      const url = tour
        ? `${apiBaseUrl}/api/admin/tours/${tour.id}`
        : `${apiBaseUrl}/api/admin/tours`;
      const response = await fetch(url, {
        method: tour ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to save the tour.");
      onSaved(body);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="top-space">
      <section className="section admin-editor">
        <div className="admin-heading">
          <div>
            <Eyebrow>Private management</Eyebrow>
            <h1>{tour ? "Edit Tour" : "Add a Tour"}</h1>
          </div>
          <button className="text-button" onClick={onCancel}>
            ← Back to dashboard
          </button>
        </div>
        <form className="contact-form admin-form" onSubmit={submit}>
          <label>
            Tour title
            <input
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              required
              rows="4"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <label>
            Image URL
            <input
              required
              type="url"
              value={form.image_url}
              onChange={(event) => update("image_url", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            City
            <input
              required
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </label>
          <label>
            Format
            <select
              value={form.mode}
              onChange={(event) => update("mode", event.target.value)}
            >
              <option>Shared</option>
              <option>Private</option>
              <option>Multi-day</option>
            </select>
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            />
          </label>
          <label>
            Duration
            <input
              required
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="3 hours"
            />
          </label>
          <label>
            Price per person (₹)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </label>
          <label>
            Highlights <small>(comma-separated)</small>
            <input
              value={form.highlights}
              onChange={(event) => update("highlights", event.target.value)}
            />
          </label>
          <label>
            Inclusions <small>(comma-separated)</small>
            <input value={form.inclusions} onChange={(event) => update("inclusions", event.target.value)} placeholder="Local guide, water, entry fees..." />
          </label>
          <label>
            Gallery images <small>(upload up to 10 JPEG, PNG, or WebP files)</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setGalleryFiles(Array.from(event.target.files || []).slice(0, 10))} />
            <small>{galleryFiles.length ? `${galleryFiles.length} image(s) ready to upload.` : tour?.gallery_images?.length ? `${tour.gallery_images.length} saved image(s). Choose files to replace them.` : "Choose up to 10 images."}</small>
          </label>
          <label>
            Traveller experience video <small>(upload MP4, WebM, or MOV; maximum 100 MB)</small>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
            <small>{videoFile ? videoFile.name : tour?.traveller_video_url ? "A video is already saved. Choose a file to replace it." : "Choose one traveller experience video."}</small>
          </label>
          <label>
            Meeting details
            <textarea rows="3" value={form.meeting_details} onChange={(event) => update("meeting_details", event.target.value)} placeholder="Meeting point, start time and end point..." />
          </label>
          <label>
            Private-tour price (INR) <small>(optional)</small>
            <input type="number" min="1" step="1" value={form.private_price} onChange={(event) => update("private_price", event.target.value)} />
          </label>
          <label>
            FAQs <small>(JSON array: [{'{'}"question":"...","answer":"..."{'}'}])</small>
            <textarea rows="5" value={form.faq_items} onChange={(event) => update("faq_items", event.target.value)} />
          </label>
          <label>
            Reviews <small>(JSON array: [{'{'}"name":"...","review":"..."{'}'}])</small>
            <textarea rows="5" value={form.review_items} onChange={(event) => update("review_items", event.target.value)} />
          </label>
          <label>
            Badge <small>(optional)</small>
            <input
              value={form.tag}
              onChange={(event) => update("tag", event.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update("featured", event.target.checked)}
            />{" "}
            Feature this tour
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.dark}
              onChange={(event) => update("dark", event.target.checked)}
            />{" "}
            Use dark booking button
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => update("published", event.target.checked)}
            />{" "}
            Publish immediately
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : tour ? "Update Tour →" : "Save Tour →"}
          </button>
          {status && <p>{status}</p>}
        </form>
      </section>
    </main>
  );
}

function Admin({ go, onTourCreated, session }) {
  const [username] = useState("admin");
  const [password, setPassword] = useState("authenticated");
  const [authenticated, setAuthenticated] = useState(true);
  const adminKey = password;
  const setAdminKey = setPassword;
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    city: "Mumbai",
    mode: "Shared",
    category: "",
    duration: "",
    price: "",
    highlights: "",
    tag: "",
    featured: false,
    published: true,
  });
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setSaving(true);
    if (!authenticated) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.detail || "Unable to authenticate.");
        setAuthenticated(true);
        setStatus("Authenticated. You can now save the tour.");
      } catch (error) {
        setStatus(error.message);
      } finally {
        setSaving(false);
      }
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      highlights: form.highlights
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to save the tour.");
      onTourCreated(body);
      setForm({
        title: "",
        description: "",
        image_url: "",
        city: "Mumbai",
        mode: "Shared",
        category: "",
        duration: "",
        price: "",
        highlights: "",
        tag: "",
        featured: false,
        published: true,
      });
      setStatus("Tour saved. It is now available on the tours page.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="top-space">
      <section className="section contact-grid">
        <div>
          <Eyebrow>Private management</Eyebrow>
          <h1>Add a Tour</h1>
          <p className="lead">
            Create a new experience for the public tours collection. This page
            is deliberately accessible only by its direct URL and is not linked
            in the site navigation.
          </p>
          <button className="text-button" onClick={() => go("/tours")}>
            ← View public tours
          </button>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <h2>Tour details</h2>
          <label>
            Admin key
            <input
              required
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Your admin key"
              autoComplete="current-password"
            />
          </label>
          <label>
            Tour title
            <input
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Old Delhi Food Walk"
            />
          </label>
          <label>
            Description
            <textarea
              required
              rows="4"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="What guests will experience..."
            />
          </label>
          <label>
            Image URL
            <input
              required
              type="url"
              value={form.image_url}
              onChange={(event) => update("image_url", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            City
            <input
              required
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </label>
          <label>
            Format
            <select
              value={form.mode}
              onChange={(event) => update("mode", event.target.value)}
            >
              <option>Shared</option>
              <option>Private</option>
              <option>Multi-day</option>
            </select>
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              placeholder="Food, Heritage, Walking..."
            />
          </label>
          <label>
            Duration
            <input
              required
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="3 hours"
            />
          </label>
          <label>
            Price per person (₹)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </label>
          <label>
            Highlights <small>(comma-separated)</small>
            <input
              value={form.highlights}
              onChange={(event) => update("highlights", event.target.value)}
              placeholder="Local guide, Tastings, Small group"
            />
          </label>
          <label>
            Badge <small>(optional)</small>
            <input
              value={form.tag}
              onChange={(event) => update("tag", event.target.value)}
              placeholder="TOP RATED"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update("featured", event.target.checked)}
            />{" "}
            Feature this tour
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => update("published", event.target.checked)}
            />{" "}
            Publish immediately
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Tour →"}
          </button>
          {status && (
            <p className={status.startsWith("Tour saved") ? "success" : ""}>
              {status}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

function Dharavi({ go, tours, session = null, siteSettings = defaultSiteSettings, initialBooking = false, tourId = null, city = "Mumbai", category = "Community" }) {
  const [activeTourTab, setActiveTourTab] = useState("tour-info");
  const [bookingOpen, setBookingOpen] = useState(initialBooking && Boolean(session?.token));
  const tour = tourId
    ? tours.find((item) => item.id === tourId)
    : tours.find((item) => item.city === city && item.category === category);
  const tourCity = tour?.city || city;
  const tourCategory = tour?.category || category;
  const fallbackTourTitle =
    category === "Community"
      ? "Dharavi Community Experience"
      : `${tourCity || "Local"} ${category || "Tour"}`;
  const tourTitle = tour?.title || fallbackTourTitle;
  const tourDescription =
    tour?.description ||
    `Discover the people, places, and stories that make ${tourCity || "this destination"} unforgettable.`;
  const bookingPrices = getTourBookingPrices(tour);
  const openBooking = () => {
    if (!session?.token) {
      const destination = new URL(window.location.href);
      destination.searchParams.set("booking", "1");
      go(`${destination.pathname}${destination.search}${destination.hash}`);
      return;
    }
    setBookingOpen(true);
  };
  const closeBooking = () => {
    setBookingOpen(false);
    const destination = new URL(window.location.href);
    if (destination.searchParams.has("booking")) {
      destination.searchParams.delete("booking");
      window.history.replaceState(
        {},
        "",
        `${destination.pathname}${destination.search}${destination.hash}`,
      );
    }
  };
  const galleryImages = tour?.gallery_images || [];
  const tourTabs = [
    ["tour-info", "Tour info"],
    ["price-inclusions", "Price & inclusions"],
    ["tour-highlights", "Highlights"],
    galleryImages.length > 0 && ["tour-gallery", "Gallery"],
    tour?.meeting_details && ["meeting-map", "Meeting & map"],
    ["tour-reviews", "Reviews"],
    tour?.faq_items?.length > 0 && ["tour-faqs", "FAQs"],
  ].filter(Boolean);
  const tourTabKey = tourTabs.map(([id]) => id).join("|");
  const isDharaviTour = tour
    ? /dharavi/i.test(tourTitle) || tour.category === "Community"
    : !tourId && category === "Community";
  useEffect(() => {
    const updateActiveTab = () => {
      const readingLine = window.scrollY + 245;
      const tabIds = tourTabKey.split("|").filter(Boolean);
      let current = tabIds[0];
      tabIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= readingLine) current = id;
      });
      setActiveTourTab(current);
    };
    updateActiveTab();
    window.addEventListener("scroll", updateActiveTab, { passive: true });
    window.addEventListener("hashchange", updateActiveTab);
    return () => {
      window.removeEventListener("scroll", updateActiveTab);
      window.removeEventListener("hashchange", updateActiveTab);
    };
  }, [tourTabKey]);
  const items = [
    [
      "eco",
      "Living industry",
      "Observe the $1B annual turnover ecosystem of recycling and manufacturing.",
    ],
    [
      "palette",
      "Kumbharwada pottery",
      "Visit the oldest settlement of potters and see their ancient techniques.",
    ],
    [
      "groups",
      "Community and culture",
      "Experience the harmonious blend of diverse cultures and faiths.",
    ],
    [
      "volunteer_activism",
      "Meaningful impact",
      "A portion of every tour fee supports local community educational projects.",
    ],
    ["storefront", "Small businesses", "Meet the makers, workshops and family businesses that keep Dharavi moving."],
    ["recycling", "Recycling expertise", "Follow the remarkable journey of materials being sorted, reused and transformed."],
    ["restaurant", "Local flavours", "Hear the food stories and everyday rituals that bring this neighbourhood together."],
    ["history_edu", "Stories from residents", "Discover Dharavi through lived experience, not headlines or assumptions."],
  ];
  const fallbackReviews = [
    ["Stephane, France", "A thoughtful, eye-opening introduction to Dharavi. Our guide explained the community with warmth, knowledge and respect."],
    ["Maya, United Kingdom", "The highlight of our Mumbai visit—personal, well paced and full of stories we would never have found alone."],
    ["Daniel, Australia", "Professional from start to finish. We came away with a much deeper understanding of the people and industries here."],
    ["Priya, India", "A meaningful experience for our family. The guide answered every question with honesty and care."],
    ["Elena, Spain", "A memorable tour led by someone who genuinely knows and loves the neighbourhood."],
  ];
  const reviews = (tour?.review_items?.length ? tour.review_items : fallbackReviews).map((item, index) => {
    if (Array.isArray(item)) return item;
    return [
      item?.name || item?.author || `Traveller ${index + 1}`,
      item?.review || item?.text || String(item || "A memorable locally led experience."),
    ];
  });
  const recommendedTours = [
    ...tours.filter(
      (item) =>
        item.city === tourCity &&
        item.id !== tour?.id,
    ).sort((a, b) => Number(b.category === tourCategory) - Number(a.category === tourCategory)),
    { title: "Mumbai Street Food Tour", city: "Mumbai", category: "Food", duration: "3.5 hours", price: "₹3,050", image: images.food },
    { title: "Mumbai Heritage Walk", city: "Mumbai", category: "Heritage", duration: "3 hours", price: "₹2,500", image: images.heritage },
    { title: "Dharavi Pottery Workshop", city: "Mumbai", category: "Community", duration: "3 hours", price: "₹2,200", image: images.pottery },
    { title: "Delhi City Discovery", city: "Delhi", category: "City", duration: "8 hours", price: "₹3,400", image: images.delhi },
    { title: "Delhi Heritage & Haveli Walk", city: "Delhi", category: "Heritage", duration: "4.5 hours", price: "₹2,300", image: images.heritage },
    { title: "Delhi Food & Bazaar Trail", city: "Delhi", category: "Food", duration: "4 hours", price: "₹2,600", image: images.food },
  ]
    .filter((item, index, list) =>
      item.city === tourCity &&
      item.title !== tourTitle &&
      list.findIndex((candidate) => candidate.title === item.title) === index,
    )
    .slice(0, 3);
  return (
    <main className="top-space">
      <Hero image={tour?.image || images.dharavi} className="detail-hero">
        <div className="hero-content">
          <Eyebrow>{tourCity || "India"} Experiences</Eyebrow>
          <h1>{tourTitle}</h1>
          <p>{tourDescription}</p>
          <div className="hero-facts">
            <span>★ 4.9 (124 reviews)</span>
            <span>◷ 2 Hours</span>
          </div>
        </div>
      </Hero>
      <nav className="tour-section-tabs" aria-label="Dharavi tour sections">
        {tourTabs.map(([id, label]) => (
          <a className={activeTourTab === id ? "active" : ""} href={`#${id}`} key={id} onClick={() => setActiveTourTab(id)}>{label}</a>
        ))}
      </nav>
      <section className="section detail-layout" id="tour-info">
        <div className="detail-content">
          <Eyebrow>Tour info</Eyebrow>
          <h2>{isDharaviTour ? "Discover the Real Dharavi" : `Discover ${tourTitle}`}</h2>
          <p className="lead">
            {tourDescription}
          </p>
          {tour?.traveller_video_url && (
            <div className="tour-video-wrap">
              <video src={tour.traveller_video_url} controls preload="metadata">Your browser does not support video playback.</video>
            </div>
          )}
          <p>{isDharaviTour ? "Our walk isn't just about observation; it's about connection. You'll witness the intricate processes of the leather industry, the delicate craftsmanship of the Kumbharwada pottery colony, and the remarkable recycling ecosystem that processes Mumbai's plastic and metal." : "Your local guide will share the stories, context, and everyday details that make this experience memorable."}</p>
          <div className="experience-grid">
            {items.map(([icon, title, text]) => (
              <article key={title}>
                <span className="material-symbols-outlined">{icon}</span>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="booking-card">
          <span>What's Included</span>
          <h3>Walk with a local</h3>
          <ul>
            <li>
              2-hour guided walk through residential and industrial areas.
            </li>
            <li>Deep local insights from guides who live in the community.</li>
            <li>Bottled water and sanitization supplies.</li>
          </ul>
          <div className="price">
            <small>Price starts from</small>
            <b className="booking-price-by-mode">{formatInr(bookingPrices.shared)}</b>
            <b>₹1,500</b>
            <span>per person</span>
          </div>
          <button
            className="primary-button"
            onClick={openBooking}
          >
            Book this tour →
          </button>
          <p className="cancel">
            ✓ Secure booking & local support
            <br />✓ Free cancellation up to 24h before
          </p>
        </aside>
      </section>
      {bookingOpen && (
        <BookingRequestModal
          tour={tour}
          title={tourTitle}
          session={session}
          siteSettings={siteSettings}
          prices={bookingPrices}
          onClose={closeBooking}
        />
      )}
      <section className="section tour-reference-section" id="price-inclusions">
        <Eyebrow>Price & inclusions</Eyebrow>
        <h2>Choose the tour that suits you</h2>
        <div className="tour-price-grid">
          <article><span className="material-symbols-outlined">group</span><div><h3>Shared tour</h3><p>Meet fellow curious travellers in a small group.</p></div><b>From ₹1,500 <small>per person</small></b><ul><li>Resident local guide</li><li>2-hour walking tour</li><li>Community contribution included</li></ul></article>
          <article><span className="material-symbols-outlined">lock</span><div><h3>Private tour</h3><p>A flexible experience exclusively for your group.</p></div><b>From ₹3,500 <small>per group</small></b><ul><li>Private local guide</li><li>Flexible start time</li><li>Personalised pace</li></ul></article>
        </div>
      </section>
      <section className="section tour-reference-section" id="tour-highlights">
        <Eyebrow>Highlights</Eyebrow>
        <h2>What you will experience</h2>
        <div className="tour-highlight-list">
          {items.map(([icon, title, text]) => <details key={title}><summary><span className="material-symbols-outlined">{icon}</span>{title}<span className="material-symbols-outlined">add</span></summary><p>{text}</p></details>)}
        </div>
      </section>
      {galleryImages.length > 0 && (
        <section className="section gallery" id="tour-gallery">
          <Eyebrow>Visual journey</Eyebrow>
          <h2>Moments from {tourTitle}</h2>
          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <img className={index === 0 ? "gallery-main" : ""} src={image} alt="" key={image} />
            ))}
          </div>
        </section>
      )}
      <section className="section tour-reference-section tour-meeting" id="meeting-map">
        <Eyebrow>Meeting & map</Eyebrow>
        <h2>Meet your guide in Mumbai</h2>
        <div className="meeting-grid"><div><h3>Starting point</h3><p>Churchgate Railway Station, Mumbai. Your guide will confirm the exact meeting point and time after booking.</p><h3>Ending point</h3><p>Dharavi, near Mahim Station. Your guide can help you with onward transport.</p></div><div className="meeting-map-card"><span className="material-symbols-outlined">location_on</span><b>Mumbai · Churchgate to Dharavi</b><small>Meeting details are sent with your confirmation.</small></div></div>
      </section>
      <section className="section tour-reference-section tour-reviews" id="tour-reviews">
        <Eyebrow>Guest experiences</Eyebrow>
        <h2>What travellers say</h2>
        <div className="tour-reviews-grid">
          {reviews.map(([name, review]) => (
            <blockquote key={name}>“{review}”<footer>— {name} · <span>★★★★★</span></footer></blockquote>
          ))}
        </div>
        <blockquote>“A thoughtful, eye-opening introduction to Dharavi. Our guide explained the community with warmth, knowledge and respect.”<footer>— Stephane, France · <span>★★★★★</span></footer></blockquote>
      </section>
      <section className="section tour-reference-section" id="tour-faqs">
        <Eyebrow>FAQs</Eyebrow>
        <h2>Before you go</h2>
        <div className="tour-highlight-list tour-extra-faqs">
          <details><summary>How much walking is involved?<span className="material-symbols-outlined">add</span></summary><p>The tour lasts around two hours at a relaxed pace, with plenty of time to pause and ask questions.</p></details>
          <details><summary>What should I wear?<span className="material-symbols-outlined">add</span></summary><p>Wear comfortable walking shoes and light clothing suitable for Mumbai’s weather.</p></details>
          <details><summary>Can I book a private guide?<span className="material-symbols-outlined">add</span></summary><p>Yes. Select a private tour when requesting your booking and we will confirm guide availability.</p></details>
        </div>
        <div className="tour-highlight-list"><details><summary>Is the tour respectful and ethical?<span className="material-symbols-outlined">add</span></summary><p>Yes. Tours are led by local guides and focus on Dharavi’s people, enterprise and culture with respect for residents’ privacy.</p></details><details><summary>Can I take photographs?<span className="material-symbols-outlined">add</span></summary><p>Photography is limited in residential areas. Your guide will explain where photos are appropriate.</p></details><details><summary>Is the tour suitable for children?<span className="material-symbols-outlined">add</span></summary><p>Families are welcome. Please contact us for guidance on the best format for your group.</p></details></div>
      </section>
      {recommendedTours.length > 0 && <section className="section recommended-tours" aria-labelledby="recommended-tours-title">
        <Eyebrow>Recommended</Eyebrow>
        <h2 id="recommended-tours-title">Other Tours You May Like</h2>
        <div className="recommended-tour-grid">
          {recommendedTours.map((item) => (
            <article key={item.title}>
              <img src={item.image} alt="" />
              <div>
                <span>{item.mode || "Shared"} / group</span>
                <h3>{item.title}</h3>
                <p><span className="material-symbols-outlined">location_on</span>Departure: {item.city || tourCity}</p>
                <p><span className="material-symbols-outlined">schedule</span>Duration: {item.duration}</p>
                <strong>From {item.price}</strong>
                <button
                  onClick={() => go(
                    item.id
                      ? `/tours/${item.id}`
                      : `/tours?city=${encodeURIComponent(item.city || tourCity)}&category=${encodeURIComponent(item.category)}&view=detail`,
                  )}
                >
                  View tour
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>}
    </main>
  );
}

function getTourBookingPrices(tour) {
  const basePrice = Number(tour?.price) || 1500;
  const existingMode = String(tour?.mode || "").toLowerCase();
  const sharedPrice =
    Number(tour?.shared_price) > 0
      ? Number(tour.shared_price)
      : existingMode === "private"
        ? Math.max(1, Math.round(basePrice * 0.6))
        : basePrice;
  const privatePrice =
    Number(tour?.private_price) > 0
      ? Number(tour.private_price)
      : existingMode === "private"
        ? basePrice
        : Math.round(basePrice * 1.8);
  return { shared: sharedPrice, private: privatePrice };
}

function BookingRequestModal({ tour, title, session, siteSettings = defaultSiteSettings, prices, onClose }) {
  const [bookingMode, setBookingMode] = useState("Shared");
  const [travellers, setTravellers] = useState(2);
  const [travellerDetails, setTravellerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const unitPrice = bookingMode === "Private" ? prices.private : prices.shared;
  const total = unitPrice * travellers;
  const selectedTourTitle = title || tour?.title || "Tour enquiry";
  const upiId = siteSettings?.upi_id || defaultSiteSettings.upi_id;
  const upiNumber = siteSettings?.upi_number || defaultSiteSettings.upi_number;
  const qrData = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Nomad%20Wanderers&am=${total.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrData)}`;
  const today = new Date().toISOString().slice(0, 10);
  const startTimeSlot = tour?.start_time
    ? `${tour.schedule_type === "Daily" ? "Daily" : tour.trip_type === "Festival special" ? "Festival" : "Tour"} · ${formatTourTime(tour.start_time)}`
    : "";
  useEffect(() => {
    if (!session?.token) return undefined;
    let cancelled = false;
    fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.detail || "Unable to load your profile details.");
        if (!cancelled) {
          setTravellerDetails((current) => ({
            name: body.name || current.name,
            email: body.email || current.email,
            phone: body.phone || current.phone,
          }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.token]);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const requestDetails = [
      `Tour style: ${bookingMode}`,
      `Preferred date: ${values.date}`,
      startTimeSlot && `Start time slot: ${startTimeSlot}`,
      `Travellers: ${travellers}`,
      `Estimated amount: ${formatInr(total)}`,
      values.message?.trim(),
    ].filter(Boolean).join("\n");
    try {
      if (!session?.token) throw new Error("Please sign in before booking this tour.");
      if (!tour?.id) throw new Error("Tour details are still loading. Please try again.");
      const response = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          tour_id: tour.id,
          travel_date: values.date,
          travellers,
          special_requests: `Guest: ${values.name}; Email: ${values.email}; Phone: ${values.phone}\n${requestDetails}`,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || "Unable to book this tour.");
      setBookingId(body.id || null);
      setSubmitted(true);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="booking-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="booking-modal-close" type="button" onClick={onClose} aria-label="Close booking form">×</button>
        <div className="booking-modal-header">
          <Eyebrow>Reserve your place</Eyebrow>
          <h2 id="booking-modal-title">Book this tour</h2>
          <p>Choose your preferences. We will confirm final availability with you.</p>
        </div>
        {submitted ? (
          <div className="booking-modal-success">
            <span className="material-symbols-outlined">check_circle</span>
            <h3>Booking saved</h3>
            <p>Your booking{bookingId ? ` #${bookingId}` : ""} has been added. Our team will contact you shortly to confirm availability and payment.</p>
            <div className="booking-upi-card">
              <b>UPI payment after confirmation</b>
              <span>UPI ID: {upiId}</span>
              <span>UPI number: {upiNumber}</span>
              <img src={qrCodeUrl} alt={`UPI QR scanner for ${upiId}`} />
            </div>
            <button className="primary-button" type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="booking-modal-form" onSubmit={submit}>
            <label>Selected tour<input value={selectedTourTitle} readOnly /></label>
            <div className="booking-modal-style-picker">
              <span>How would you like to travel?</span>
              <div>
                {["Shared", "Private"].map((option) => (
                  <label className={bookingMode === option ? "selected" : ""} key={option}>
                    <input name="booking_mode" type="radio" value={option} checked={bookingMode === option} onChange={() => setBookingMode(option)} />
                    <span><b>{option} tour</b><small>{option === "Shared" ? "Join fellow travellers" : "Just your group"}</small></span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-row">
              <label>Preferred date<input name="date" required type="date" min={today} /></label>
              <label>Travellers<select name="travellers" value={travellers} onChange={(event) => setTravellers(Number(event.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option value={count} key={count}>{count} {count === 1 ? "traveller" : "travellers"}</option>)}
              </select></label>
            </div>
            {startTimeSlot && (
              <label>Start time slot<input value={startTimeSlot} readOnly /></label>
            )}
            <label>Your name<input name="name" required value={travellerDetails.name} onChange={(event) => setTravellerDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Your full name" /></label>
            <div className="form-row">
              <label>Email address<input name="email" required type="email" value={travellerDetails.email} onChange={(event) => setTravellerDetails((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" /></label>
              <label>Phone or WhatsApp<input name="phone" required type="tel" value={travellerDetails.phone} onChange={(event) => setTravellerDetails((current) => ({ ...current, phone: event.target.value }))} placeholder="+91 98765 43210" /></label>
            </div>
            <label>Anything we should know?<textarea name="message" rows="3" placeholder="Accessibility needs, celebration plans, or questions..." /></label>
            <div className="booking-modal-bottom">
              <div className="booking-price-summary">
                <span>{formatInr(unitPrice)} × {travellers} {bookingMode.toLowerCase()}</span>
                <b>{formatInr(total)}</b>
                <small>Estimated total; final amount is confirmed with availability.</small>
              </div>
              <div className="booking-upi-card">
                <b>Pay by UPI after confirmation</b>
                <span>UPI ID: {upiId}</span>
                <span>UPI number: {upiNumber}</span>
                <img src={qrCodeUrl} alt={`UPI QR scanner for ${upiId}`} />
              </div>
            </div>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Booking tour…" : "Book this tour →"}</button>
            {status && <p className="admin-status">{status}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

function formatTourTime(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatInr(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function Contact() {
  const [sent, setSent] = useState(false);
  const requestedTour =
    new URLSearchParams(window.location.search).get("tour") || "";
  return (
    <main className="top-space">
      <Hero
        image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85"
        className="contact-hero"
      >
        <div className="hero-content center">
          <Eyebrow>Get in Touch</Eyebrow>
          <h1>Let's Plan Your Journey</h1>
          <p>
            Expertly guided adventures across India, tailored to your nomadic
            spirit. Reach out to Raj and the team to begin your story.
          </p>
          <div className="contact-links">
            <a href="https://wa.me/919876543210">◉ +91 98765 43210</a>
            <a href="tel:+919876543210">☎ +91 98765 43210</a>
            <a href="mailto:hello@nomadwanderers.in">
              ✉ hello@nomadwanderers.in
            </a>
          </div>
        </div>
      </Hero>
      <section className="section contact-grid">
        <div>
          <Eyebrow>We are here</Eyebrow>
          <h2>Get in Touch with Our Team</h2>
          <p className="lead">
            We're here to help you design the perfect Indian adventure. Whether
            you're looking for a private tour, a corporate event, or a custom
            itinerary, reach out and let's start the conversation.
          </p>
          <div className="office-card">
            <b>Main Office</b>
            <p>
              ⌖ Colaba Causeway, Mumbai
              <br />
              Maharashtra 400001, India
            </p>
            <p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>
        <form
          className="contact-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <h2>Send a Message</h2>
          <p>
            Fill out the form below and we'll start crafting your experience.
          </p>
          <label>
            Your name
            <input required placeholder="Your full name" />
          </label>
          <label>
            Email address
            <input required type="email" placeholder="you@example.com" />
          </label>
          <label>
            I'm interested in
            <select defaultValue={requestedTour}>
              <option value="" disabled>
                Select an experience
              </option>
              <option>Mumbai City Tours</option>
              <option>Market Tours</option>
              <option>Heritage Walking Tours</option>
              <option>Bicycle Tours</option>
              <option>Dharavi Slum Tours</option>
              <option>Custom multi-day itinerary</option>
            </select>
          </label>
          <label>
            Preferred date
            <input required type="date" />
          </label>
          <label>
            Number of travellers
            <select defaultValue="2">
              <option value="1">1 traveller</option>
              <option value="2">2 travellers</option>
              <option value="3-5">3–5 travellers</option>
              <option value="6+">6+ travellers</option>
            </select>
          </label>
          <label>
            Tell us about your trip
            <textarea
              rows="4"
              placeholder="Dates, group size, and anything you have in mind..."
            />
          </label>
          <button className="primary-button" type="submit">
            Send Booking Request <span>→</span>
          </button>
          {sent && (
            <p className="success">
              Thank you! Your request has been sent. Raj will reach out shortly.
            </p>
          )}
        </form>
      </section>
      <section className="newsletter">
        <div>
          <Eyebrow>Community</Eyebrow>
          <h2>Join the Nomad Community</h2>
          <p>
            Get curated travel stories, seasonal guidebooks, and exclusive early
            access to our tours.
          </p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <input
            type="email"
            aria-label="Email address"
            placeholder="Your email address"
          />
          <button>Subscribe</button>
        </form>
      </section>
    </main>
  );
}

function ContactFlow() {
  const [sent, setSent] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const requestedTour = query.get("tour") || "";
  const intent = query.get("intent") || "contact";
  const isCustom = intent === "custom";
  const isBooking = intent === "book" || Boolean(requestedTour);
  const title = isCustom
    ? "Plan Your Trip"
    : isBooking
      ? "Book Your Tour"
      : "Contact Our Team";
  const description = isCustom
    ? "Tell us how you like to travel and we will create a considered India itinerary around you."
    : isBooking
      ? "Share your preferred date and group size. Our team will confirm availability and the next steps."
      : "Questions, ideas, or a quick hello — send us a message and our local team will be glad to help.";
  const buttonText = isCustom
    ? "Send Journey Request →"
    : isBooking
      ? "Book this tour →"
      : "Send Message →";
  const successMessage = isCustom
    ? "Thank you! We will be in touch to shape your journey."
    : isBooking
      ? "Thank you! We will confirm your booking request shortly."
      : "Thank you! Your message has been sent.";
  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };
  return (
    <main className="top-space">
      <Hero
        image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85"
        className="contact-hero"
      >
        <div className="hero-content center">
          <Eyebrow>
            {isCustom
              ? "Tailored travel"
              : isBooking
                ? "Tour booking"
                : "Get in touch"}
          </Eyebrow>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="contact-links">
            <a href="https://wa.me/919876543210">◉ Chat on WhatsApp</a>
            <a href="tel:+919876543210">☎ +91 98765 43210</a>
            <a href="mailto:hello@nomadwanderers.in">
              ✉ hello@nomadwanderers.in
            </a>
          </div>
        </div>
      </Hero>
      <section className="section contact-grid">
        <div>
          <Eyebrow>
            {isCustom
              ? "Your trip, your way"
              : isBooking
                ? "A few final details"
                : "We are here"}
          </Eyebrow>
          <h2>
            {isCustom
              ? "A journey built around you."
              : isBooking
                ? "Reserve your place with confidence."
                : "How can we help?"}
          </h2>
          <p className="lead">
            {isCustom
              ? "Share your dates, cities, interests and travel style. We will come back with a thoughtfully paced route and clear recommendations."
              : isBooking
                ? "This is a booking request, not a payment. We will check the details with you before confirming anything."
                : "Use this form for general questions, partnerships, support or anything else you would like to discuss."}
          </p>
          <div className="office-card">
            <b>Main Office</b>
            <p>
              ⌖ Colaba Causeway, Mumbai
              <br />
              Maharashtra 400001, India
            </p>
            <p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>
        <form className="contact-form journey-form" onSubmit={submit}>
          <h2>{title}</h2>
          <p>
            {isCustom
              ? "The more you share, the more personal your itinerary can be."
              : isBooking
                ? "Your selected tour is held below for this request."
                : "We normally reply within one business day."}
          </p>
          <label>
            Your name
            <input required placeholder="Your full name" />
          </label>
          <div className="form-row">
            <label>
              Email address
              <input required type="email" placeholder="you@example.com" />
            </label>
            <label>
              Phone or WhatsApp
              <input required type="tel" placeholder="+91 98765 43210" />
            </label>
          </div>
          {isBooking && (
            <>
              <label>
                Selected tour
                <input
                  value={tourDetails?.title || requestedTour || "Tour enquiry"}
                  readOnly
                />
              </label>
              <label>
                Tour style
                <select name="tour_style" defaultValue="shared">
                  <option value="shared">Shared tour</option>
                  <option value="private">Private tour</option>
                </select>
                <small>
                  Private tours are subject to guide and vehicle availability.
                </small>
              </label>
              {tourDetails && (
                <div className="tour-auto-fields">
                  <span>
                    <b>City</b>
                    {tourDetails.city}
                  </span>
                  <span>
                    <b>Duration</b>
                    {tourDetails.duration}
                  </span>
                  <span>
                    <b>Capacity</b>Up to {tourDetails.capacity} guests
                  </span>
                  <span>
                    <b>Guide</b>
                    {tourDetails.guide_name || "Local guide"}
                  </span>
                </div>
              )}
              <div className="form-row">
                <label>
                  Preferred date
                  <input required type="date" />
                </label>
                <label>
                  Number of travellers
                  <select defaultValue="2">
                    <option value="1">1 traveller</option>
                    <option value="2">2 travellers</option>
                    <option value="3">3 travellers</option>
                    <option value="4">4 travellers</option>
                    <option value="5">5 travellers</option>
                    <option value="6">6 travellers</option>
                  </select>
                </label>
              </div>
              <label>
                Anything we should know?
                <textarea
                  rows="4"
                  placeholder="Accessibility needs, celebration plans, questions or other details..."
                />
              </label>
            </>
          )}
          {isCustom && (
            <>
              <label>
                Places you would like to visit
                <input
                  required
                  placeholder="e.g. Mumbai, Delhi, Jaipur, Kerala"
                />
              </label>
              <div className="form-row">
                <label>
                  Approximate start date
                  <input required type="date" />
                </label>
                <label>
                  Trip length
                  <select defaultValue="">
                    <option value="" disabled>
                      Select duration
                    </option>
                    <option>3–5 days</option>
                    <option>6–8 days</option>
                    <option>9–14 days</option>
                    <option>15+ days</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Number of travellers
                  <select defaultValue="2">
                    <option value="1">1 traveller</option>
                    <option value="2">2 travellers</option>
                    <option value="3-5">3–5 travellers</option>
                    <option value="6+">6+ travellers</option>
                  </select>
                </label>
                <label>
                  Budget per person
                  <select defaultValue="">
                    <option value="" disabled>
                      Select a range
                    </option>
                    <option>Under ₹25,000</option>
                    <option>₹25,000–₹50,000</option>
                    <option>₹50,000–₹1,00,000</option>
                    <option>₹1,00,000+</option>
                  </select>
                </label>
              </div>
              <label>
                What would make this trip special?
                <textarea
                  required
                  rows="5"
                  placeholder="Your interests, preferred pace, stay style, food preferences and any must-see experiences..."
                />
              </label>
            </>
          )}
          {!isBooking && !isCustom && (
            <>
              <label>
                Subject
                <input required placeholder="How can we help?" />
              </label>
              <label>
                Your message
                <textarea
                  required
                  rows="6"
                  placeholder="Tell us what you have in mind..."
                />
              </label>
            </>
          )}
          <button className="primary-button" type="submit">
            {buttonText}
          </button>
          {sent && <p className="success">{successMessage}</p>}
        </form>
      </section>
    </main>
  );
}

function ContactFlowV2({ session }) {
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tourDetails, setTourDetails] = useState(null);
  const query = new URLSearchParams(window.location.search);
  const requestedTour = query.get("tour") || "";
  const intent = query.get("intent") || "contact";
  const isCustom = intent === "custom";
  const isBooking = intent === "book" || Boolean(requestedTour);
  const title = isCustom
    ? "Plan Your Trip"
    : isBooking
      ? "Book Your Tour"
      : "Contact Our Team";
  const customerToken =
    session?.token || sessionStorage.getItem("nomad_user_token");
  useEffect(() => {
    if (!isBooking || !requestedTour) return;
    fetch(
      `${apiBaseUrl}/api/tours?search=${encodeURIComponent(requestedTour)}&page_size=20`,
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.detail || "Unable to load this tour.");
        setTourDetails(
          body.items?.find((item) => item.title === requestedTour) ||
            body.items?.[0] ||
            null,
        );
      })
      .catch(() => setTourDetails(null));
  }, [isBooking, requestedTour]);
  useEffect(() => {
    if ((!isBooking && !isCustom) || !customerToken) return;
    fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.detail || "Unable to load your profile details.",
          );
        const form = document.querySelector(".journey-form");
        if (!form) return;
        form.elements.name.value = body.name || "";
        form.elements.email.value = body.email || "";
        form.elements.phone.value = body.phone || "";
      })
      .catch((error) => setStatus(error.message));
  }, [customerToken, isBooking, isCustom]);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (isBooking) {
      if (!customerToken) {
        setStatus("Please sign in before creating a booking.");
        setSubmitting(false);
        return;
      }
      if (!tourDetails?.id) {
        setStatus(
          "Tour details are still loading. Please try again in a moment.",
        );
        setSubmitting(false);
        return;
      }
      try {
        const specialRequests = [
          `Tour style: ${values.tour_style || "shared"}`,
          values.message?.trim(),
        ]
          .filter(Boolean)
          .join("\n");
        const response = await fetch(`${apiBaseUrl}/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            tour_id: tourDetails.id,
            travel_date: values.date,
            travellers: Number(values.travellers),
            special_requests: specialRequests,
          }),
        });
        const booking = await response.json();
        if (!response.ok)
          throw new Error(booking.detail || "Unable to create your booking.");
        window.location.assign(`/payment?booking_id=${booking.id}`);
      } catch (error) {
        setStatus(error.message);
        setSubmitting(false);
      }
      return;
    }
    const payload = isCustom
      ? {
          name: values.name,
          email: values.email,
          phone: values.phone,
          destinations: values.destinations,
          start_date: values.start_date || null,
          duration: values.duration,
          travellers: values.travellers,
          budget: values.budget,
          interests: values.interests,
        }
      : {
          name: values.name,
          email: values.email,
          phone: values.phone,
          subject: values.subject,
          message: values.message,
        };
    try {
      const response = await fetch(
        `${apiBaseUrl}${isCustom ? "/api/custom-journeys" : "/api/contact-enquiries"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to send your request.");
      setSent(true);
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (isBooking) {
    return (
      <BookingExperiencePage
        tour={tourDetails}
        requestedTour={requestedTour}
        onSubmit={submit}
        status={status}
        submitting={submitting}
      />
    );
  }
  return (
    <main className="top-space">
      <Hero
        image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85"
        className="contact-hero"
      >
        <div className="hero-content center">
          <Eyebrow>
            {isCustom
              ? "Tailored travel"
              : isBooking
                ? "Tour booking"
                : "Get in touch"}
          </Eyebrow>
          <h1>{title}</h1>
          <p>
            {isCustom
              ? "Tell us how you like to travel and we will create a considered India itinerary around you."
              : isBooking
                ? "Share your preferred date and group size. Our team will confirm availability and the next steps."
                : "Questions, ideas, or a quick hello — send us a message and our local team will be glad to help."}
          </p>
          <div className="contact-links">
            <a href="https://wa.me/919876543210">◉ Chat on WhatsApp</a>
            <a href="tel:+919876543210">☎ +91 98765 43210</a>
            <a href="mailto:hello@nomadwanderers.in">
              ✉ hello@nomadwanderers.in
            </a>
          </div>
        </div>
      </Hero>
      <section className="section contact-grid">
        <div>
          <Eyebrow>
            {isCustom
              ? "Your trip, your way"
              : isBooking
                ? "A few final details"
                : "We are here"}
          </Eyebrow>
          <h2>
            {isCustom
              ? "A journey built around you."
              : isBooking
                ? "Reserve your place with confidence."
                : "How can we help?"}
          </h2>
          <p className="lead">
            {isCustom
              ? "Share your dates, cities, interests and travel style. We will return with a thoughtfully paced route and clear recommendations."
              : isBooking
                ? "This is a booking request, not a payment. We will check the details with you before confirming anything."
                : "Use this form for general questions, partnerships, support or anything else you would like to discuss."}
          </p>
          {isBooking && (
            <BookingTourSummary
              tour={tourDetails}
              requestedTour={requestedTour}
            />
          )}
          <div className="office-card">
            <b>Main Office</b>
            <p>
              ⌖ Colaba Causeway, Mumbai
              <br />
              Maharashtra 400001, India
            </p>
            <p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>
        <form className="contact-form journey-form" onSubmit={submit}>
          <h2>{title}</h2>
          <p>
            {isCustom
              ? "The more you share, the more personal your itinerary can be."
              : isBooking
                ? "Your selected tour is included in this request."
                : "We normally reply within one business day."}
          </p>
          <label>
            Your name
            <input name="name" required placeholder="Your full name" />
          </label>
          <div className="form-row">
            <label>
              Email address
              <input
                name="email"
                required
                type="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone or WhatsApp
              <input
                name="phone"
                required
                type="tel"
                placeholder="+91 98765 43210"
              />
            </label>
          </div>
          {isBooking && (
            <>
              <label>
                Selected tour
                <input
                  value={tourDetails?.title || requestedTour || "Tour enquiry"}
                  readOnly
                />
              </label>
              <label>
                Tour style
                <select name="tour_style" defaultValue="shared">
                  <option value="shared">Shared tour</option>
                  <option value="private">Private tour</option>
                </select>
                <small>
                  Private tours are subject to guide and vehicle availability.
                </small>
              </label>
              {tourDetails && (
                <div className="tour-auto-fields">
                  <span>
                    <b>City</b>
                    {tourDetails.city}
                  </span>
                  <span>
                    <b>Duration</b>
                    {tourDetails.duration}
                  </span>
                  <span>
                    <b>Capacity</b>Up to {tourDetails.capacity} guests
                  </span>
                  <span>
                    <b>Guide</b>
                    {tourDetails.guide_name || "Local guide"}
                  </span>
                </div>
              )}
              <div className="form-row">
                <label>
                  Preferred date
                  <input name="date" required type="date" />
                </label>
                <label>
                  Number of travellers
                  <select name="travellers" defaultValue="2">
                    <option value="1">1 traveller</option>
                    <option value="2">2 travellers</option>
                    <option value="3">3 travellers</option>
                    <option value="4">4 travellers</option>
                    <option value="5">5 travellers</option>
                    <option value="6">6 travellers</option>
                    <option value="7">7 travellers</option>
                    <option value="8">8 travellers</option>
                  </select>
                </label>
              </div>
              <label>
                Anything we should know?
                <textarea
                  name="message"
                  rows="4"
                  placeholder="Accessibility needs, celebration plans, questions or other details..."
                />
              </label>
            </>
          )}
          {isCustom && (
            <>
              <label>
                Places you would like to visit
                <input
                  name="destinations"
                  required
                  placeholder="e.g. Mumbai, Delhi, Jaipur, Kerala"
                />
              </label>
              <div className="form-row">
                <label>
                  Approximate start date
                  <input name="start_date" type="date" />
                </label>
                <label>
                  Trip length
                  <select name="duration" required defaultValue="">
                    <option value="" disabled>
                      Select duration
                    </option>
                    <option>3–5 days</option>
                    <option>6–8 days</option>
                    <option>9–14 days</option>
                    <option>15+ days</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Number of travellers
                  <select name="travellers" defaultValue="2">
                    <option value="1">1 traveller</option>
                    <option value="2">2 travellers</option>
                    <option value="3-5">3–5 travellers</option>
                    <option value="6+">6+ travellers</option>
                  </select>
                </label>
                <label>
                  Budget per person
                  <select name="budget" required defaultValue="">
                    <option value="" disabled>
                      Select a range
                    </option>
                    <option>Under ₹25,000</option>
                    <option>₹25,000–₹50,000</option>
                    <option>₹50,000–₹1,00,000</option>
                    <option>₹1,00,000+</option>
                  </select>
                </label>
              </div>
              <label>
                What would make this trip special?
                <textarea
                  name="interests"
                  required
                  rows="5"
                  placeholder="Your interests, preferred pace, stay style, food preferences and must-see experiences..."
                />
              </label>
            </>
          )}
          {!isBooking && !isCustom && (
            <>
              <label>
                Subject
                <input name="subject" required placeholder="How can we help?" />
              </label>
              <label>
                Your message
                <textarea
                  name="message"
                  required
                  rows="6"
                  placeholder="Tell us what you have in mind..."
                />
              </label>
            </>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Sending…"
              : isCustom
                ? "Send Journey Request →"
                : isBooking
                  ? "Book this tour →"
                  : "Send Message →"}
          </button>
          {sent && (
            <p className="success">Thank you! We have received your request.</p>
          )}
          {status && <p className="admin-status">{status}</p>}
        </form>
      </section>
    </main>
  );
}

function BookingExperiencePage({ tour, requestedTour, onSubmit, status, submitting }) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [travellers, setTravellers] = useState(2);
  const [bookingMode, setBookingMode] = useState("Shared");
  const bookingPrices = getTourBookingPrices(tour);
  const price = bookingMode === "Private" ? bookingPrices.private : bookingPrices.shared;
  const total = price * travellers;
  const highlights = tour?.highlights || [];

  return (
    <main className="top-space booking-experience-shell">
      <section className="section booking-experience-page">
        <div className="booking-experience-content">
          {!tour ? (
            <article className="booking-tour-loading">
              <span className="material-symbols-outlined">hourglass_top</span>
              <div>
                <Eyebrow>Your selected experience</Eyebrow>
                <h1>Loading tour details</h1>
                <p>We are preparing {requestedTour || "your selected tour"}.</p>
              </div>
            </article>
          ) : (
            <>
              <article className="booking-hero-card">
                <img src={tour.image_url} alt="" />
                <div className="booking-hero-overlay">
                  <span>{tour.city}</span>
                  <span>{tour.trip_type}</span>
                </div>
              </article>
              <header className="booking-tour-intro">
                <Eyebrow>Selected experience</Eyebrow>
                <h1>{tour.title}</h1>
                <div className="booking-social-proof">
                  <span aria-label="Guest-loved experience score">★★★★★</span>
                  <b>4.9</b>
                  <span>Guest-loved experience</span>
                </div>
                <p className={descriptionExpanded ? "booking-full-description expanded" : "booking-full-description"}>
                  {tour.description}
                </p>
                {tour.description?.length > 220 && (
                  <button
                    className="booking-read-more"
                    type="button"
                    onClick={() => setDescriptionExpanded((current) => !current)}
                  >
                    {descriptionExpanded ? "Show less" : "Read more about this tour"}
                  </button>
                )}
                <div className="booking-facts">
                  <span><i className="material-symbols-outlined">schedule</i>{tour.duration}</span>
                  <span><i className="material-symbols-outlined">directions_walk</i>{tour.mode}</span>
                  <span><i className="material-symbols-outlined">group</i>Up to {tour.capacity} guests</span>
                  <span><i className="material-symbols-outlined">person_pin_circle</i>{tour.guide_name || "Local expert guide"}</span>
                </div>
              </header>
              <section className="booking-details-card">
                <div className="booking-section-heading">
                  <Eyebrow>What you will experience</Eyebrow>
                  <h2>Thoughtful moments, led by a local.</h2>
                </div>
                <div className="booking-itinerary-list">
                  {highlights.map((highlight, index) => (
                    <div className="booking-itinerary-item" key={highlight}>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      <p>{highlight}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="booking-assurance-card">
                <div><i className="material-symbols-outlined">verified</i><span><b>Request first</b> We confirm availability before any payment.</span></div>
                <div><i className="material-symbols-outlined">support_agent</i><span><b>Local support</b> Our team is here to help with your plans.</span></div>
              </section>
            </>
          )}
        </div>
        <aside className="booking-reservation-card">
          <Eyebrow>Reserve your place</Eyebrow>
          <h2>Book this experience</h2>
          <p className="booking-card-copy">Choose your preferences. We will confirm the final availability with you.</p>
          <form className="journey-form booking-reservation-form" onSubmit={onSubmit}>
            <label>Selected tour<input value={tour?.title || requestedTour || "Tour enquiry"} readOnly /></label>
            <div className="booking-style-picker">
              <span>How would you like to travel?</span>
              <div>
                <label><input name="tour_style" type="radio" value="shared" checked={bookingMode === "Shared"} onChange={() => setBookingMode("Shared")} /><b>Shared tour</b><small>Join fellow travellers</small></label>
                <label><input name="tour_style" type="radio" value="private" checked={bookingMode === "Private"} onChange={() => setBookingMode("Private")} /><b>Private tour</b><small>Just your group</small></label>
              </div>
            </div>
            <div className="form-row">
              <label>Preferred date<input name="date" required type="date" /></label>
              <label>Travellers<select name="travellers" value={travellers} onChange={(event) => setTravellers(Number(event.target.value))}><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3">3 travellers</option><option value="4">4 travellers</option><option value="5">5 travellers</option><option value="6">6 travellers</option></select></label>
            </div>
            <label>Your name<input name="name" required placeholder="Your full name" /></label>
            <div className="form-row">
              <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
              <label>Phone or WhatsApp<input name="phone" required type="tel" placeholder="+91 98765 43210" /></label>
            </div>
            <label>Anything we should know?<textarea name="message" rows="3" placeholder="Accessibility needs, celebration plans, or questions..." /></label>
            <div className="booking-price-summary"><span>From ₹{price.toLocaleString("en-IN")} × {travellers}</span><b>₹{total.toLocaleString("en-IN")}</b><small>Final amount is confirmed with availability.</small></div>
            <button className="primary-button" type="submit" disabled={submitting || !tour}>{submitting ? "Booking tour…" : "Book this tour →"}</button>
            {status && <p className="admin-status">{status}</p>}
          </form>
        </aside>
      </section>
    </main>
  );
}

function BookingTourSummary({ tour, requestedTour }) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  if (!tour)
    return (
      <article className="booking-tour-preview loading">
        <span className="material-symbols-outlined">hourglass_top</span>
        <p>Loading {requestedTour || "selected tour"} details...</p>
      </article>
    );
  return (
    <article className="booking-tour-preview">
      <img src={tour.image_url} alt="" />
      <span className="eyebrow">Your selected experience</span>
      <h3>{tour.title}</h3>
      <p
        className={
          descriptionExpanded
            ? "booking-description expanded"
            : "booking-description"
        }
      >
        {tour.description}
      </p>
      {tour.description.length > 220 && (
        <button
          className="booking-read-more"
          type="button"
          onClick={() => setDescriptionExpanded((current) => !current)}
        >
          {descriptionExpanded ? "Show less" : "Read more about this tour"}
        </button>
      )}
      <div className="booking-rating">
        <span>★★★★★</span>
        <b>4.9</b>
        <small> Guest-loved experience</small>
      </div>
      <p className="booking-preview-meta">
        <b>{tour.city}</b> · {tour.duration} · ₹
        {Number(tour.price).toLocaleString("en-IN")} / person
      </p>
      <div className="booking-preview-highlights">
        {tour.highlights?.slice(0, 4).map((item) => (
          <span key={item}>✓ {item}</span>
        ))}
      </div>
    </article>
  );
}

function AdminDashboardV2({
  session,
  siteSettings = defaultSiteSettings,
  onSiteSettingsSaved = () => {},
  onCarouselSaved = () => {},
  onSessionExpired,
  onManageTeam,
  onTourSaved,
  onTourDeleted,
}) {
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [report, setReport] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [carouselTours, setCarouselTours] = useState([]);
  const [selectedCarouselIds, setSelectedCarouselIds] = useState([]);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    upi_id: siteSettings?.upi_id || defaultSiteSettings.upi_id,
    upi_number: siteSettings?.upi_number || defaultSiteSettings.upi_number,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [totals, setTotals] = useState({
    tours: 0,
    enquiries: 0,
    journeys: 0,
    payments: 0,
    bookings: 0,
    carousel: 0,
    reports: 0,
  });
  const [screen, setScreen] = useState("list");
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedTourIds, setSelectedTourIds] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const headers = { Authorization: `Bearer ${session.token}` };
  const pageSize = 6;
  const loadDashboard = async () => {
    setLoading(true);
    setStatus("");
    try {
      const parameters = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search.trim()) parameters.set("search", search.trim());
      const paths = [
        "/api/admin/tours",
        "/api/admin/contact-enquiries",
        "/api/admin/custom-journeys",
        "/api/admin/demo-payments",
      ].map((path) => `${path}?${parameters}`);
      paths.push("/api/staff/bookings");
      paths.push("/api/admin/reports");
      paths.push("/api/admin/me");
      paths.push("/api/admin/settings");
      paths.push("/api/admin/carousel");
      const responses = await Promise.all(
        paths.map((path) => fetch(`${apiBaseUrl}${path}`, { headers })),
      );
      const bodies = await Promise.all(
        responses.map((response) => response.json()),
      );
      if (responses.some((response) => response.status === 401)) {
        onSessionExpired();
        return;
      }
      if (responses.some((response) => !response.ok))
        throw new Error(
          bodies.find((body) => body.detail)?.detail ||
            "Unable to load the dashboard.",
        );
      setTours(bodies[0].items);
      setEnquiries(bodies[1].items);
      setJourneys(bodies[2].items);
      setPayments(bodies[3].items);
      setBookings(bodies[4]);
      setReport(bodies[5]);
      setAdminProfile(bodies[6]);
      setSettingsForm({
        upi_id: bodies[7].upi_id || defaultSiteSettings.upi_id,
        upi_number: bodies[7].upi_number || defaultSiteSettings.upi_number,
      });
      setCarouselTours(bodies[8].tours || []);
      setSelectedCarouselIds(bodies[8].tour_ids || []);
      setTotals({
        tours: bodies[0].total,
        enquiries: bodies[1].total,
        journeys: bodies[2].total,
        payments: bodies[3].total,
        bookings: bodies[4].length,
        reports: 1,
        carousel: (bodies[8].tour_ids || []).length,
      });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadDashboard();
  }, [page, search, activeTab]);
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);
  const recordsByTab = {
    tours,
    enquiries,
    journeys,
    payments,
    bookings,
    carousel: carouselTours,
    reports: report ? [report] : [],
  };
  const currentRecords = recordsByTab[activeTab];
  const totalItems = totals[activeTab];
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords =
    activeTab === "bookings"
      ? currentRecords.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize,
        )
      : currentRecords;
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setPage(1);
  };
  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/settings`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          upi_id: settingsForm.upi_id.trim(),
          upi_number: settingsForm.upi_number.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (!response.ok) throw new Error(body.detail || "Unable to save UPI details.");
      setSettingsForm(body);
      onSiteSettingsSaved(body);
      setStatus("UPI details updated successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSavingSettings(false);
    }
  };
  const toggleCarouselTour = (tourId) => {
    setSelectedCarouselIds((current) => {
      if (current.includes(tourId)) return current.filter((id) => id !== tourId);
      if (current.length >= 5) return current;
      return [...current, tourId];
    });
  };
  const saveCarousel = async () => {
    if (selectedCarouselIds.length !== 5) {
      setStatus("Select exactly 5 published tours for the home carousel.");
      return;
    }
    setSavingCarousel(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/carousel`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tour_ids: selectedCarouselIds }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        onSessionExpired();
        return;
      }
      if (!response.ok) throw new Error(body.detail || "Unable to save carousel tours.");
      setCarouselTours(body.tours || []);
      setSelectedCarouselIds(body.tour_ids || []);
      const toursById = new Map((body.tours || []).map((tour) => [tour.id, tour]));
      onCarouselSaved((body.tour_ids || []).map((id) => toursById.get(id)).filter(Boolean));
      setStatus("Home carousel tours updated successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSavingCarousel(false);
    }
  };
  const saved = (tour) => {
    setTours((current) => [
      tour,
      ...current.filter((item) => item.id !== tour.id),
    ]);
    onTourSaved(tour);
    setScreen("list");
    setSelectedTour(null);
  };
  const removeTour = async (tour) => {
    if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`))
      return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) throw new Error("Unable to delete the tour.");
      setTours((current) => current.filter((item) => item.id !== tour.id));
      setSelectedTourIds((current) => current.filter((id) => id !== tour.id));
      setSelectedCarouselIds((current) => current.filter((id) => id !== tour.id));
      onTourDeleted(tour.id);
    } catch (error) {
      setStatus(error.message);
    }
  };
  const toggleTourSelection = (tourId) => {
    setSelectedTourIds((current) =>
      current.includes(tourId)
        ? current.filter((id) => id !== tourId)
        : [...current, tourId],
    );
  };
  const toggleAllVisibleTours = () => {
    const visibleIds = pageRecords.map((tour) => tour.id);
    const allSelected = visibleIds.every((id) => selectedTourIds.includes(id));
    setSelectedTourIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };
  const removeSelectedTours = async () => {
    if (!selectedTourIds.length) return;
    if (!window.confirm(`Permanently delete ${selectedTourIds.length} selected tour(s)? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tour_ids: selectedTourIds }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Unable to delete selected tours.");
      setTours((current) => current.filter((tour) => !selectedTourIds.includes(tour.id)));
      selectedTourIds.forEach(onTourDeleted);
      setSelectedTourIds([]);
      await loadDashboard();
      setStatus(`${body.deleted} tour(s) permanently deleted.`);
    } catch (error) {
      setStatus(error.message);
    }
  };
  const updateBooking = async (booking, changes) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/staff/bookings/${booking.id}`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to update booking.");
      setBookings((current) =>
        current.map((item) => (item.id === body.id ? body : item)),
      );
    } catch (error) {
      setStatus(error.message);
    }
  };
  if (screen !== "list")
    return (
      <TourEditorV2
        tour={selectedTour}
        session={session}
        onCancel={() => {
          setScreen("list");
          setSelectedTour(null);
        }}
        onSaved={saved}
      />
    );
  const tabs = [
    ["tours", "Tours", totals.tours],
    ["carousel", "Home carousel", selectedCarouselIds.length],
    ["bookings", "Bookings", totals.bookings],
    ["enquiries", "Enquiries", totals.enquiries],
    ["journeys", "Custom journeys", totals.journeys],
    ["payments", "Demo payments", totals.payments],
    ["reports", "Reports", null],
  ];
  const emptyLabel =
    activeTab === "tours"
      ? "tours"
      : activeTab === "bookings"
        ? "bookings"
        : activeTab === "enquiries"
          ? "contact enquiries"
          : activeTab === "journeys"
            ? "custom journeys"
            : activeTab === "payments"
              ? "demo payments"
              : activeTab === "carousel"
                ? "home carousel tours"
              : "report data";
  return (
    <main className="top-space">
      <section className="section admin-dashboard">
        <div className="admin-heading">
          <div>
            <Eyebrow>Private management</Eyebrow>
            <h1>Welcome back, {adminProfile?.name || "Administrator"}.</h1>
            <p className="lead">
              Manage tours, bookings, payments, traveller requests, staff
              access, and operational reporting from one place.
            </p>
          </div>
          <div className="admin-card-actions">
            <button onClick={onManageTeam}>Team access</button>
            {activeTab === "tours" && (
              <button
                className="primary-button"
                onClick={() => setScreen("create")}
              >
                Add a tour →
              </button>
            )}
          </div>
        </div>
        <section className="admin-settings-card" aria-labelledby="payment-settings-title">
          <div className="admin-settings-copy">
            <Eyebrow>Payment settings</Eyebrow>
            <h2 id="payment-settings-title">UPI details</h2>
            <p>These details appear in the booking confirmation and generate the amount-aware UPI scanner.</p>
          </div>
          <form className="admin-settings-form" onSubmit={saveSettings}>
            <label>
              UPI ID
              <input
                required
                value={settingsForm.upi_id}
                onChange={(event) => setSettingsForm((current) => ({ ...current, upi_id: event.target.value }))}
                placeholder="yourname@upi"
              />
            </label>
            <label>
              UPI number
              <input
                required
                value={settingsForm.upi_number}
                onChange={(event) => setSettingsForm((current) => ({ ...current, upi_number: event.target.value }))}
                placeholder="+91 98765 43210"
              />
            </label>
            <button className="primary-button" type="submit" disabled={savingSettings}>
              {savingSettings ? "Saving…" : "Save UPI details →"}
            </button>
          </form>
        </section>
        <div className="admin-tabs">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => changeTab(id)}
            >
              {label}
              {count !== null && <span>{count}</span>}
            </button>
          ))}
        </div>
        {status && <p className="admin-status">{status}</p>}
        {loading ? (
          <p className="lead">Loading dashboard...</p>
        ) : (
          <>
            {activeTab !== "reports" && activeTab !== "carousel" && (
              <AdminCollectionToolbar
                value={search}
                onChange={setSearch}
                label={tabs.find(([id]) => id === activeTab)?.[1]}
                count={totalItems}
              />
            )}
            <div className="admin-collection-content">
              {activeTab === "carousel" ? (
                <AdminCarouselPanel
                  tours={carouselTours}
                  selectedIds={selectedCarouselIds}
                  onToggle={toggleCarouselTour}
                  onSave={saveCarousel}
                  saving={savingCarousel}
                />
              ) : pageRecords.length ? (
                activeTab === "tours" ? (
                  <>
                    <div className="admin-bulk-actions">
                      <label><input type="checkbox" checked={pageRecords.every((tour) => selectedTourIds.includes(tour.id))} onChange={toggleAllVisibleTours} /> Select all on this page</label>
                      <span>{selectedTourIds.length} selected</span>
                      <button className="delete-button" disabled={!selectedTourIds.length} onClick={removeSelectedTours}>Delete selected permanently</button>
                    </div>
                    <div className="admin-tour-grid">
                    {pageRecords.map((tour) => (
                      <article className="admin-tour-card" key={tour.id}>
                        <label className="admin-tour-select"><input type="checkbox" checked={selectedTourIds.includes(tour.id)} onChange={() => toggleTourSelection(tour.id)} aria-label={`Select ${tour.title}`} /></label>
                        <img src={tour.image_url} alt="" />
                        <div className="admin-card-copy">
                          <div>
                            <span>
                              {tour.published ? "Published" : "Draft"}
                            </span>
                            <span>{tour.mode}</span>
                            <span>{tour.trip_type}</span>
                          </div>
                          <h2>{tour.title}</h2>
                          <p>
                            {tour.city} · {tour.duration} · ₹
                            {Number(tour.price).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="admin-card-actions">
                          <button
                            onClick={() => {
                              setSelectedTour(tour);
                              setScreen("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => removeTour(tour)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                    </div>
                  </>
                ) : activeTab === "reports" ? (
                  <AdminReportPanel report={report} />
                ) : activeTab === "bookings" ? (
                  <AdminBookingList
                    bookings={pageRecords}
                    onUpdate={updateBooking}
                  />
                ) : activeTab === "enquiries" ? (
                  <AdminRequestList
                    type="enquiries"
                    items={pageRecords}
                    headers={headers}
                    onChanged={setEnquiries}
                  />
                ) : activeTab === "journeys" ? (
                  <AdminRequestList
                    type="journeys"
                    items={pageRecords}
                    headers={headers}
                    onChanged={setJourneys}
                  />
                ) : (
                  <AdminPaymentList payments={pageRecords} />
                )
              ) : (
                <div className="admin-empty">
                  <h2>No {emptyLabel} found</h2>
                  <p>
                    {search
                      ? "Try another search term."
                      : `New ${emptyLabel} will appear here.`}
                  </p>
                </div>
              )}
            </div>
            {activeTab !== "reports" && activeTab !== "carousel" && (
              <AdminPagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onChange={setPage}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function AdminCarouselPanel({
  tours = [],
  selectedIds = [],
  onToggle,
  onSave,
  saving = false,
}) {
  const orderById = new Map(
    selectedIds.map((tourId, index) => [Number(tourId), index + 1]),
  );
  return (
    <section className="admin-carousel-panel">
      <div className="admin-carousel-heading">
        <div>
          <Eyebrow>Homepage spotlight</Eyebrow>
          <h2>Choose your carousel tours</h2>
          <p>
            Select exactly five published tours. They appear on the homepage
            in the order you choose. Draft tours are shown for reference and
            cannot be selected.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={saving || selectedIds.length !== 5}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save carousel →"}
        </button>
      </div>
      <div className="admin-carousel-count" aria-live="polite">
        {selectedIds.length} of 5 selected
      </div>
      <div className="admin-carousel-table-wrap">
        {tours.length ? (
          <table className="admin-carousel-table">
            <thead>
              <tr>
                <th scope="col">Select</th>
                <th scope="col">Order</th>
                <th scope="col">Tour</th>
                <th scope="col">City / category</th>
                <th scope="col">Type</th>
                <th scope="col">Visibility</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => {
                const checked = selectedIds.includes(tour.id);
                const disabled =
                  !tour.published || (!checked && selectedIds.length >= 5);
                return (
                  <tr className={checked ? "selected" : ""} key={tour.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(tour.id)}
                        aria-label={`Add ${tour.title} to home carousel`}
                      />
                    </td>
                    <td>{orderById.get(Number(tour.id)) || "—"}</td>
                    <td>
                      <div className="admin-carousel-tour">
                        <img src={tour.image_url} alt="" />
                        <b>{tour.title}</b>
                      </div>
                    </td>
                    <td>
                      {tour.city}
                      <small>{tour.category}</small>
                    </td>
                    <td>
                      {tour.trip_type}
                      <small>{tour.mode}</small>
                    </td>
                    <td>{tour.published ? "Published" : "Draft"}</td>
                    <td>₹{Number(tour.price).toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="lead">No tours are available to add to the carousel.</p>
        )}
      </div>
    </section>
  );
}

function AdminReportPanel({ report }) {
  if (!report)
    return (
      <div className="admin-empty">
        <h2>Report data is loading</h2>
        <p>Please try again in a moment.</p>
      </div>
    );
  const paymentTotal = Number(report.demo_payment_total || 0).toLocaleString(
    "en-IN",
    { maximumFractionDigits: 0 },
  );
  return (
    <section className="admin-report-panel">
      <div className="admin-report-heading">
        <div>
          <span className="eyebrow">Business overview</span>
          <h2>Travel operations at a glance</h2>
          <p>
            Live counts from customer accounts, bookings, confirmations, and
            demo payment records.
          </p>
        </div>
        <span className="material-symbols-outlined">insights</span>
      </div>
      <div className="admin-report-grid">
        <article>
          <span className="material-symbols-outlined">groups</span>
          <small>Travellers</small>
          <b>{report.customers}</b>
          <p>Registered customer accounts</p>
        </article>
        <article>
          <span className="material-symbols-outlined">confirmation_number</span>
          <small>Total bookings</small>
          <b>{report.bookings}</b>
          <p>All saved travel requests</p>
        </article>
        <article>
          <span className="material-symbols-outlined">verified</span>
          <small>Confirmed trips</small>
          <b>{report.confirmed_bookings}</b>
          <p>Ready for operations</p>
        </article>
        <article>
          <span className="material-symbols-outlined">payments</span>
          <small>Demo payments</small>
          <b>₹{paymentTotal}</b>
          <p>Recorded payment value</p>
        </article>
      </div>
      <p className="admin-report-note">
        <span className="material-symbols-outlined">info</span>Payment data is
        marked as demo until a live payment provider is connected.
      </p>
    </section>
  );
}

function AdminCollectionToolbar({ value, onChange, label, count }) {
  const [tourView, setTourView] = useState("grid");
  const changeTourView = (nextView) => {
    setTourView(nextView);
    document
      .querySelector(".admin-dashboard")
      ?.classList.toggle("admin-tour-row-mode", nextView === "rows");
  };
  return (
    <div className="admin-collection-toolbar">
      <label>
        <span className="material-symbols-outlined">search</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          aria-label={`Search ${label}`}
        />
      </label>
      <div className="admin-toolbar-end">
        <span>
          {count} result{count === 1 ? "" : "s"}
        </span>
        {label === "Tours" && (
          <div className="admin-view-toggle" aria-label="Tour display style">
            <button
              className={tourView === "grid" ? "active" : ""}
              onClick={() => changeTourView("grid")}
              title="Card grid view"
              aria-label="Card grid view"
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              className={tourView === "rows" ? "active" : ""}
              onClick={() => changeTourView("rows")}
              title="Table row view"
              aria-label="Table row view"
            >
              <span className="material-symbols-outlined">table_rows</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPagination({ page, totalPages, totalItems, pageSize, onChange }) {
  if (totalItems === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return (
    <div className="admin-pagination">
      <span>
        Showing {first}–{last} of {totalItems}
      </span>
      <div>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TourEditorV2({ tour, session, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: tour?.title || "",
    description: tour?.description || "",
    image_url: tour?.image_url || "",
    city: tour?.city || "Mumbai",
    mode: tour?.mode || "Shared",
    trip_type: tour?.trip_type || "One-day trip",
    category: tour?.category || "",
    duration: tour?.duration || "",
    price: tour?.price || "",
    capacity: tour?.capacity || 20,
    schedule_type: tour?.schedule_type || "Specific date",
    departure_date: tour?.departure_date || "",
    start_time: tour?.start_time || "",
    guide_name: tour?.guide_name || "",
    highlights: (tour?.highlights || []).join(", "),
    inclusions: (tour?.inclusions || []).join(", "),
    gallery_images: (tour?.gallery_images || []).join("\n"),
    meeting_details: tour?.meeting_details || "",
    traveller_video_url: tour?.traveller_video_url || "",
    private_price: tour?.private_price || "",
    faq_items: JSON.stringify(tour?.faq_items || [], null, 2),
    review_items: JSON.stringify(tour?.review_items || [], null, 2),
    tag: tour?.tag || "",
    featured: tour?.featured || false,
    dark: tour?.dark || false,
    published: tour?.published ?? true,
  }));
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const payload = {
      ...form,
      price: Number(form.price),
      capacity: Number(form.capacity),
      departure_date:
        form.schedule_type === "Daily" ? null : form.departure_date || null,
      start_time: form.start_time || null,
      guide_name: form.guide_name.trim() || null,
      highlights: form.highlights
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      inclusions: form.inclusions.split(",").map((item) => item.trim()).filter(Boolean),
      gallery_images: form.gallery_images
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      meeting_details: form.meeting_details.trim(),
      traveller_video_url: form.traveller_video_url.trim() || null,
      private_price: form.private_price ? Number(form.private_price) : null,
      faq_items: JSON.parse(form.faq_items || "[]"),
      review_items: JSON.parse(form.review_items || "[]"),
    };
    try {
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploadResponse = await fetch(
          `${apiBaseUrl}/api/admin/tour-images`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${session.token}` },
            body: uploadData,
          },
        );
        const uploadBody = await uploadResponse.json();
        if (!uploadResponse.ok)
          throw new Error(
            uploadBody.detail || "Unable to upload the tour image.",
          );
        payload.image_url = uploadBody.image_url;
      } else if (!tour) {
        throw new Error("Please choose a tour image.");
      }
      if (galleryFiles.length) {
        const uploadedImages = await Promise.all(galleryFiles.map(async (file) => {
          const data = new FormData();
          data.append("image", file);
          const response = await fetch(`${apiBaseUrl}/api/admin/tour-images`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, body: data });
          const body = await response.json();
          if (!response.ok) throw new Error(body.detail || "Unable to upload a gallery image.");
          return body.image_url;
        }));
        payload.gallery_images = uploadedImages;
      }
      if (videoFile) {
        const data = new FormData();
        data.append("video", videoFile);
        const response = await fetch(`${apiBaseUrl}/api/admin/tour-videos`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` }, body: data });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || "Unable to upload the traveller video.");
        payload.traveller_video_url = body.video_url;
      }
      const response = await fetch(
        `${apiBaseUrl}/api/admin/tours${tour ? `/${tour.id}` : ""}`,
        {
          method: tour ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.detail || "Unable to save the tour.");
      onSaved(body);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="top-space">
      <section className="section admin-editor">
        <div className="admin-heading">
          <div>
            <Eyebrow>Private management</Eyebrow>
            <h1>{tour ? "Edit tour" : "Add a tour"}</h1>
            <p className="lead">
              Add every detail travellers need to make a confident booking.
            </p>
          </div>
          <button className="text-button" onClick={onCancel}>
            Back to dashboard
          </button>
        </div>
        <form className="contact-form admin-form" onSubmit={submit}>
          <label>
            Tour title
            <input
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label>
            City
            <select
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            >
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Hyderabad</option>
            </select>
          </label>
          <label>
            Trip type
            <select
              value={form.trip_type}
              onChange={(event) => update("trip_type", event.target.value)}
            >
              <option>Morning trip</option>
              <option>Evening trip</option>
              <option>Half-day trip</option>
              <option>One-day trip</option>
              <option>Weekly trip</option>
              <option>Festival special</option>
            </select>
          </label>
          <label>
            Experience mode
            <input
              required
              value={form.mode}
              onChange={(event) => update("mode", event.target.value)}
              placeholder="Car + Walking, Bicycle, Shared..."
            />
          </label>
          <label>
            Description
            <textarea
              required
              rows="4"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <label>
            Tour image
            <input
              required={!tour}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] || null)
              }
            />
            <small>
              {imageFile
                ? imageFile.name
                : tour
                  ? "Leave empty to keep the current image."
                  : "JPEG, PNG, or WebP, up to 5 MB."}
            </small>
            {tour?.image_url && !imageFile && (
              <img className="admin-media-preview admin-main-image-preview" src={tour.image_url} alt="" />
            )}
          </label>
          <label>
            Category
            <input
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              placeholder="City Sightseeing, Food & Culture..."
            />
          </label>
          <label>
            Duration
            <input
              required
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="4 hours"
            />
          </label>
          <label>
            Price per person (INR)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </label>
          <label>
            Group capacity
            <input
              required
              type="number"
              min="1"
              max="500"
              value={form.capacity}
              onChange={(event) => update("capacity", event.target.value)}
            />
          </label>
          <label>
            Availability
            <select
              value={form.schedule_type}
              onChange={(event) => update("schedule_type", event.target.value)}
            >
              <option>Daily</option>
              <option>Specific date</option>
            </select>
            <small>
              Use Daily for recurring departures; otherwise select the tour date
              below.
            </small>
          </label>
          <label>
            Start time
            <input
              required
              type="time"
              value={form.start_time}
              onChange={(event) => update("start_time", event.target.value)}
            />
          </label>
          {form.schedule_type === "Specific date" && (
            <label>
              Departure date
              <input
                required
                type="date"
                value={form.departure_date}
                onChange={(event) =>
                  update("departure_date", event.target.value)
                }
              />
            </label>
          )}
          <label>
            Lead guide <small>(optional)</small>
            <input
              value={form.guide_name}
              onChange={(event) => update("guide_name", event.target.value)}
              placeholder="Aarav Mehta"
            />
          </label>
          <label>
            Highlights <small>(comma-separated)</small>
            <input
              value={form.highlights}
              onChange={(event) => update("highlights", event.target.value)}
              placeholder="Gateway of India, Marine Drive..."
            />
          </label>
          <label>
            Inclusions <small>(comma-separated)</small>
            <input value={form.inclusions} onChange={(event) => update("inclusions", event.target.value)} placeholder="Local guide, water, entry fees..." />
          </label>
          <label>
            Gallery image URLs <small>(one URL per line, up to 10)</small>
            <textarea rows="4" value={form.gallery_images} onChange={(event) => update("gallery_images", event.target.value)} placeholder="https://..." />
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setGalleryFiles(Array.from(event.target.files || []).slice(0, 10))} />
            <small>{galleryFiles.length ? `${galleryFiles.length} new gallery image(s) ready to upload.` : "Add URLs above or choose replacement images."}</small>
            {tour?.gallery_images?.length > 0 && !galleryFiles.length && (
              <div className="admin-gallery-preview">
                {tour.gallery_images.map((image) => <img src={image} alt="" key={image} />)}
              </div>
            )}
          </label>
          <label>
            Traveller experience video URL <small>(YouTube embed or video URL)</small>
            <input type="url" value={form.traveller_video_url} onChange={(event) => update("traveller_video_url", event.target.value)} placeholder="https://www.youtube.com/embed/..." />
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
            <small>{videoFile ? videoFile.name : "Add a video URL above or choose a replacement video."}</small>
            {tour?.traveller_video_url && !videoFile && (
              <a className="admin-saved-video-link" href={tour.traveller_video_url} target="_blank" rel="noreferrer">View saved traveller video</a>
            )}
          </label>
          <label>
            Meeting details
            <textarea rows="3" value={form.meeting_details} onChange={(event) => update("meeting_details", event.target.value)} placeholder="Meeting point, start time and end point..." />
          </label>
          <label>
            Private-tour price (INR) <small>(optional)</small>
            <input type="number" min="1" step="1" value={form.private_price} onChange={(event) => update("private_price", event.target.value)} />
          </label>
          <label>
            FAQs <small>(JSON array: [{'{'}"question":"...","answer":"..."{'}'}])</small>
            <textarea rows="5" value={form.faq_items} onChange={(event) => update("faq_items", event.target.value)} />
          </label>
          <label>
            Reviews <small>(JSON array: [{'{'}"name":"...","review":"..."{'}'}])</small>
            <textarea rows="5" value={form.review_items} onChange={(event) => update("review_items", event.target.value)} />
          </label>
          <label>
            Badge <small>(optional)</small>
            <input
              value={form.tag}
              onChange={(event) => update("tag", event.target.value)}
              placeholder="Best Seller"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => update("featured", event.target.checked)}
            />{" "}
            Feature this tour
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.dark}
              onChange={(event) => update("dark", event.target.checked)}
            />{" "}
            Use dark booking button
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => update("published", event.target.checked)}
            />{" "}
            Publish immediately
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : tour ? "Update tour" : "Save tour"}
          </button>
          {status && <p>{status}</p>}
        </form>
      </section>
    </main>
  );
}

function AdminDashboard({ session, onTourSaved, onTourDeleted }) {
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [payments, setPayments] = useState([]);
  const [screen, setScreen] = useState("list");
  const [selectedTour, setSelectedTour] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${session.token}` };
  const loadDashboard = async () => {
    setLoading(true);
    setStatus("");
    try {
      const responses = await Promise.all(
        [
          "/api/admin/tours",
          "/api/admin/contact-enquiries",
          "/api/admin/custom-journeys",
          "/api/admin/demo-payments",
        ].map((path) => fetch(`${apiBaseUrl}${path}`, { headers })),
      );
      const bodies = await Promise.all(
        responses.map((response) => response.json()),
      );
      if (responses.some((response) => !response.ok))
        throw new Error(
          bodies.find((body) => body.detail)?.detail ||
            "Unable to load the dashboard.",
        );
      setTours(bodies[0]);
      setEnquiries(bodies[1]);
      setJourneys(bodies[2]);
      setPayments(bodies[3]);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadDashboard();
  }, []);
  const saved = (tour) => {
    setTours((current) => [
      tour,
      ...current.filter((item) => item.id !== tour.id),
    ]);
    onTourSaved(tour);
    setScreen("list");
    setSelectedTour(null);
  };
  const removeTour = async (tour) => {
    if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`))
      return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, {
        method: "DELETE",
        headers,
      });
      if (!response.ok) throw new Error("Unable to delete the tour.");
      setTours((current) => current.filter((item) => item.id !== tour.id));
      onTourDeleted(tour.id);
    } catch (error) {
      setStatus(error.message);
    }
  };
  if (screen !== "list")
    return (
      <TourEditorV2
        tour={selectedTour}
        session={session}
        onCancel={() => {
          setScreen("list");
          setSelectedTour(null);
        }}
        onSaved={saved}
      />
    );
  const tabs = [
    ["tours", "Tours", tours.length],
    ["enquiries", "Enquiries", enquiries.length],
    ["journeys", "Custom journeys", journeys.length],
    ["payments", "Demo payments", payments.length],
  ];
  return (
    <main className="top-space">
      <section className="section admin-dashboard">
        <div className="admin-heading">
          <div>
            <Eyebrow>Private management</Eyebrow>
            <h1>Admin Dashboard</h1>
            <p className="lead">
              Manage tours, traveller enquiries and tailor-made journeys from
              one place.
            </p>
          </div>
          {activeTab === "tours" && (
            <button
              className="primary-button"
              onClick={() => setScreen("create")}
            >
              Add a tour →
            </button>
          )}
        </div>
        <div className="admin-tabs">
          {tabs.map(([id, label, count]) => (
            <button
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => setActiveTab(id)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        {status && <p className="admin-status">{status}</p>}
        {loading ? (
          <p className="lead">Loading dashboard…</p>
        ) : activeTab === "tours" ? (
          tours.length === 0 ? (
            <div className="admin-empty">
              <h2>No tours yet</h2>
              <p>Add your first tour to make it available on the website.</p>
              <button
                className="outline-button"
                onClick={() => setScreen("create")}
              >
                Add your first tour
              </button>
            </div>
          ) : (
            <div className="admin-tour-grid">
              {tours.map((tour) => (
                <article className="admin-tour-card" key={tour.id}>
                  <img src={tour.image_url} alt="" />
                  <div className="admin-card-copy">
                    <div>
                      <span>{tour.published ? "Published" : "Draft"}</span>
                      <span>{tour.mode}</span>
                      <span>{tour.trip_type}</span>
                    </div>
                    <h2>{tour.title}</h2>
                    <p>
                      {tour.city} · {tour.duration} · ₹
                      {Number(tour.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      onClick={() => {
                        setSelectedTour(tour);
                        setScreen("edit");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => removeTour(tour)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : activeTab === "enquiries" ? (
          <AdminRequestList
            type="enquiries"
            items={enquiries}
            headers={headers}
            onChanged={setEnquiries}
          />
        ) : activeTab === "journeys" ? (
          <AdminRequestList
            type="journeys"
            items={journeys}
            headers={headers}
            onChanged={setJourneys}
          />
        ) : (
          <AdminPaymentList payments={payments} />
        )}
      </section>
    </main>
  );
}

function AdminBookingList({ bookings, onUpdate }) {
  return (
    <div className="admin-request-list">
      {bookings.map((booking) => (
        <article className="admin-request-card" key={booking.id}>
          <div className="request-summary">
            <div>
              <span className="request-type">
                Booking #{booking.id} · {booking.booking_status}
              </span>
              <h2>{booking.tour_title}</h2>
              <p>
                {booking.customer_name} · {booking.customer_email}
              </p>
              <p>
                {booking.travel_date} · {booking.travellers} travellers
              </p>
            </div>
            <small>Payment: {booking.payment_status}</small>
          </div>
          {booking.special_requests && (
            <div className="request-details admin-booking-notes">
              <p>{booking.special_requests}</p>
            </div>
          )}
          <div className="admin-card-actions">
            <button
              onClick={() => onUpdate(booking, { booking_status: "confirmed" })}
            >
              Confirm
            </button>
            <button
              onClick={() => onUpdate(booking, { booking_status: "completed" })}
            >
              Complete
            </button>
            <button
              onClick={() => onUpdate(booking, { payment_status: "paid" })}
            >
              Mark paid
            </button>
            <button
              className="delete-button"
              onClick={() => onUpdate(booking, { booking_status: "cancelled" })}
            >
              Cancel
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminPaymentList({ payments }) {
  return payments.length === 0 ? (
    <div className="admin-empty">
      <h2>No demo payments yet</h2>
      <p>Completed dummy checkout payments will appear here for review.</p>
    </div>
  ) : (
    <div className="admin-request-list">
      {payments.map((payment) => (
        <article className="admin-request-card" key={payment.id}>
          <div className="request-summary">
            <div>
              <span className="request-type">
                Demo payment · {payment.status}
              </span>
              <h2>{payment.tour_title}</h2>
              <a href={`mailto:${payment.email}`}>
                {payment.name} · {payment.email}
              </a>
              <a href={`tel:${payment.phone}`}>{payment.phone}</a>
            </div>
            <small>
              {new Date(payment.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </small>
          </div>
          <div className="request-details">
            <p>
              <b>Amount:</b> ₹{Number(payment.amount).toLocaleString("en-IN")} ·{" "}
              <b>Method:</b> {payment.payment_method.replace("_", " ")}
            </p>
            <p>
              <b>Reference:</b> {payment.transaction_reference}
            </p>
            <p>This is a simulated payment record. No money was collected.</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminRequestList({ type, items, headers, onChanged }) {
  const isJourney = type === "journeys";
  const resource = isJourney ? "custom-journeys" : "contact-enquiries";
  const updateItem = async (item, changes) => {
    const response = await fetch(
      `${apiBaseUrl}/api/admin/${resource}/${item.id}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      },
    );
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.detail || "Unable to update request.");
    onChanged((current) =>
      current.map((entry) => (entry.id === item.id ? body : entry)),
    );
  };
  const deleteItem = async (item) => {
    if (!window.confirm("Delete this request? This cannot be undone.")) return;
    const response = await fetch(
      `${apiBaseUrl}/api/admin/${resource}/${item.id}`,
      { method: "DELETE", headers },
    );
    if (!response.ok) throw new Error("Unable to delete request.");
    onChanged((current) => current.filter((entry) => entry.id !== item.id));
  };
  return items.length === 0 ? (
    <div className="admin-empty">
      <h2>No {isJourney ? "custom journeys" : "contact enquiries"} yet</h2>
      <p>
        New traveller requests will appear here as soon as they are submitted.
      </p>
    </div>
  ) : (
    <div className="admin-request-list">
      {items.map((item) => (
        <AdminRequestCard
          key={item.id}
          item={item}
          isJourney={isJourney}
          onSave={updateItem}
          onDelete={deleteItem}
        />
      ))}
    </div>
  );
}

function AdminRequestCard({ item, isJourney, onSave, onDelete }) {
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.admin_notes || "");
  const [quote, setQuote] = useState(item.quote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await onSave(
        item,
        isJourney
          ? { status, admin_notes: notes, quote }
          : { status, admin_notes: notes },
      );
      setMessage("Saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <article className="admin-request-card">
      <div className="request-summary">
        <div>
          <span className="request-type">
            {isJourney ? "Custom journey" : "Contact enquiry"}
          </span>
          <h2>{item.name}</h2>
          <a href={`mailto:${item.email}`}>{item.email}</a>
          <a href={`tel:${item.phone}`}>{item.phone}</a>
        </div>
        <small>
          {new Date(item.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </small>
      </div>
      {isJourney ? (
        <div className="request-details">
          <p>
            <b>Destinations:</b> {item.destinations}
          </p>
          <p>
            <b>Timing:</b> {item.start_date || "Flexible"} · {item.duration}
          </p>
          <p>
            <b>Travellers:</b> {item.travellers} · <b>Budget:</b> {item.budget}
          </p>
          <p>
            <b>Interests:</b> {item.interests}
          </p>
        </div>
      ) : (
        <div className="request-details">
          <p>
            <b>{item.subject}</b>
          </p>
          <p>{item.message}</p>
        </div>
      )}
      <div className="request-admin-fields">
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        {isJourney && (
          <label>
            Quote
            <textarea
              rows="3"
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              placeholder="Price, itinerary or quote details..."
            />
          </label>
        )}
        <label>
          Admin notes
          <textarea
            rows="3"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Private follow-up notes..."
          />
        </label>
      </div>
      <div className="request-actions">
        <button className="primary-button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button className="delete-button" onClick={() => onDelete(item)}>
          Delete
        </button>
        {message && <span>{message}</span>}
      </div>
    </article>
  );
}

function Footer({ go }) {
  return (
    <footer className="site-footer reference-footer">
      <div className="footer-skyline" aria-hidden="true"><img src={footerCitySkyline} alt="" /></div>
      <div className="footer-brand-row"><button className="brand" onClick={() => go("/")}>Nomad Wanderers</button></div>
      <div className="footer-reference-grid">
      <div>
        <button className="brand" onClick={() => go("/")}>
          Nomad Wanderers
        </button>
        <p>
          Experience Mumbai's soul through expert eyes. Ethical, professional,
          and authentic tours since 2012.
        </p>
      </div>
      <div>
        <b>About us</b>
        <button onClick={() => go("/about")}>Why choose us</button>
        <button onClick={() => go("/tours")}>Tours</button>
        <button onClick={() => go("/contact")}>Contact</button>
      </div>
      <div>
        <b>Top destinations</b>
        <button onClick={() => go("/tours?city=Mumbai")}>Mumbai</button>
        <button onClick={() => go("/tours?city=Delhi")}>Delhi</button>
        <button onClick={() => go("/tours?city=Mumbai&category=Community")}>Dharavi</button>
        <button onClick={() => go("/tours/unique")}>Unique experiences</button>
      </div>
      <div className="footer-contact">
        <b>Contact & updates</b>
        <a href="mailto:hello@nomadwanderers.in">hello@nomadwanderers.in</a>
        <a href="tel:+919876543210">+91 98765 43210</a>
        <span>Colaba Causeway, Mumbai</span>
        <div className="footer-socials">
          <a
            className="facebook"
            href="https://www.facebook.com/mudavath.ramesh.841066/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Nomad Wanderers on Facebook"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.04C6.48 2.04 2 6.52 2 12.04c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.19 2.24.19V8.6H15.2c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.89h-2.33v6.99C18.34 21.17 22 17.03 22 12.04c0-5.52-4.48-10-10-10Z" />
            </svg>
          </a>
          <a
            className="instagram"
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Nomad Wanderers on Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.17 2A3.03 3.03 0 0 0 4 7.03v9.94A3.03 3.03 0 0 0 7.03 20h9.94A3.03 3.03 0 0 0 20 16.97V7.03A3.03 3.03 0 0 0 16.97 4H7.03Zm9.25 1.5a1.22 1.22 0 1 1 0 2.44 1.22 1.22 0 0 1 0-2.44ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            </svg>
          </a>
          <a
            className="youtube"
            href="https://www.youtube.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Nomad Wanderers on YouTube"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.58 12 3.58 12 3.58s-7.55 0-9.4.5A3 3 0 0 0 .5 6.2 31.15 31.15 0 0 0 0 12a31.15 31.15 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.85.5 9.4.5 9.4.5s7.55 0 9.4-.5a3 3 0 0 0 2.1-2.12A31.15 31.15 0 0 0 24 12a31.15 31.15 0 0 0-.5-5.8ZM9.6 15.55v-7.1L15.85 12 9.6 15.55Z" />
            </svg>
          </a>
        </div>
      </div>
      </div>
      <div className="footer-bottom"><small>© 2026 Nomad Wanderers. All Rights Reserved.</small></div>
    </footer>
  );
}

export default App;
