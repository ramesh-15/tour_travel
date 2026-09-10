import { useState } from "react";
import { formatApiError } from "./apiError";

export default function UnifiedLogin({ apiBaseUrl, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setStatus("");
    setForm((current) => ({ ...current, password: "" }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      if (mode === "reset") {
        const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            new_password: form.password,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            formatApiError(body.detail, "Unable to reset your password."),
          );
        }
        setMode("login");
        setForm((current) => ({
          ...current,
          username: "",
          email: "",
          password: "",
        }));
        setStatus("Password updated. Please sign in with your new password.");
        return;
      }
      if (mode === "register") {
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            formatApiError(body.detail, "Unable to create your account."),
          );
        }
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
        setStatus("Account created. Sign in with your username and password.");
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          formatApiError(body.detail, "Incorrect username or password."),
        );
      }
      onAuthenticated({ token: body.access_token, role: body.role });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isReset = mode === "reset";
  const isRegister = mode === "register";
  const title = isReset
    ? "Reset your password"
    : isRegister
      ? "Create traveller account"
      : "Welcome back";
  const description = isReset
    ? "Enter the email address on your account and choose a new password."
    : isRegister
      ? "Create an account to book, pay for, and manage your tours."
      : "Sign in with your username and password.";

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="auth-showcase-content">
          <button
            className="eyebrow auth-showcase-brand"
            onClick={() => window.location.assign("/")}
          >
            Nomad Wanderers
          </button>
          <h1>
            <span className="auth-desktop-title">
              Every journey begins with a welcome.
            </span>
            <span className="auth-mobile-title">Welcome back</span>
          </h1>
          <p>Sign in to manage your journeys, bookings and travel details.</p>
          <div className="auth-role-list">
            <span><i className="material-symbols-outlined">person</i>Traveller bookings</span>
            <span><i className="material-symbols-outlined">calendar_month</i>Upcoming journeys</span>
            <span><i className="material-symbols-outlined">verified_user</i>Secure account access</span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <button className="brand auth-brand" onClick={() => window.location.assign("/")}>
            Nomad Wanderers
          </button>
          <span className="eyebrow">Secure access</span>
          <h2>{title}</h2>
          <p>{description}</p>
          <form onSubmit={submit}>
            {isRegister && (
              <label>
                Full name
                <input required autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} />
              </label>
            )}
            {!isReset && (
              <label>
                Username
                <input required minLength="3" autoComplete="username" value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="e.g. priya.shah" />
              </label>
            )}
            {(isRegister || isReset) && (
              <label>
                Email address
                <input required type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              </label>
            )}
            {isRegister && (
              <label>
                Phone / WhatsApp number
                <input required type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              </label>
            )}
            <label>
              {isReset ? "New password" : "Password"}
              <input required type="password" minLength="8" autoComplete={isReset || isRegister ? "new-password" : "current-password"} value={form.password} onChange={(event) => update("password", event.target.value)} />
            </label>
            {mode === "login" && (
              <button className="auth-forgot-password" type="button" onClick={() => changeMode("reset")}>
                Forgot password?
              </button>
            )}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting
                ? "Please wait…"
                : isReset
                  ? "Save new password"
                  : isRegister
                    ? "Create account"
                    : "Sign in securely"}
            </button>
          </form>
          {status && <p className="auth-status">{status}</p>}
          <div className="auth-switch">
            {isReset ? (
              <><span>Remembered your password?</span><button onClick={() => changeMode("login")}>Sign in</button></>
            ) : mode === "login" ? (
              <><span>New traveller?</span><button onClick={() => changeMode("register")}>Create an account</button></>
            ) : (
              <><span>Already have an account?</span><button onClick={() => changeMode("login")}>Sign in</button></>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
