import { useState } from 'react'

export default function UnifiedLogin({ apiBaseUrl, onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '' })
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true); setStatus('')
    try {
      if (mode === 'register') {
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const body = await response.json()
        if (!response.ok) throw new Error(body.detail || 'Unable to create your account.')
        setMode('login'); setForm(current => ({ ...current, password: '' })); setStatus('Account created. Sign in with your username and password.')
        return
      }
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, password: form.password }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Incorrect username or password.')
      onAuthenticated({ token: body.access_token, role: body.role })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="auth-page"><section className="auth-showcase"><div className="auth-showcase-content"><button className="eyebrow auth-showcase-brand" onClick={() => window.location.assign('/')}>Nomad Wanderers</button><h1><span className="auth-desktop-title">Every journey begins with a welcome.</span><span className="auth-mobile-title">Welcome back</span></h1><p>Sign in to manage your journeys or access your team workspace.</p><div className="auth-role-list"><span><i className="material-symbols-outlined">person</i> Traveller bookings</span><span><i className="material-symbols-outlined">map</i> Tour operations</span><span><i className="material-symbols-outlined">support_agent</i> Guest support</span></div></div></section><section className="auth-panel"><div className="auth-card"><button className="brand auth-brand" onClick={() => window.location.assign('/')}>Nomad Wanderers</button><span className="eyebrow">Secure access</span><h2>{mode === 'login' ? 'Welcome back' : 'Create traveller account'}</h2><p>{mode === 'login' ? 'Sign in with your username and password.' : 'Create an account to book, pay for, and manage your tours.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Full name<input required autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} /></label>}<label>Username<input required minLength="3" autoComplete="username" value={form.username} onChange={event => update('username', event.target.value)} placeholder="e.g. priya.shah" /></label>{mode === 'register' && <><label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} /></label><label>Phone / WhatsApp number<input required type="tel" autoComplete="tel" value={form.phone} onChange={event => update('phone', event.target.value)} /></label></>}<label>Password<input required type="password" minLength="8" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={event => update('password', event.target.value)} /></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in securely' : 'Create account'}</button></form>{status && <p className="auth-status">{status}</p>}<div className="auth-switch">{mode === 'login' ? <><span>New traveller?</span><button onClick={() => { setMode('register'); setStatus('') }}>Create an account</button></> : <><span>Already have an account?</span><button onClick={() => { setMode('login'); setStatus('') }}>Sign in</button></>}</div><small className="auth-note">Team members use the same sign-in form. Accounts are created by an administrator.</small></div></section></main>
}
