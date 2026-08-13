import { useEffect, useState } from 'react'

const headers = (token) => ({ Authorization: `Bearer ${token}` })

export function StaffPortal({ apiBaseUrl, session, onAuthenticated, onLogout }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [account, setAccount] = useState(null)
  const [bookings, setBookings] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [tours, setTours] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const loadWorkspace = async () => {
    if (!session?.token) return
    setLoading(true)
    try {
      const me = await fetch(`${apiBaseUrl}/api/auth/me`, { headers: headers(session.token) })
      if (me.status === 401) { onLogout(); return }
      const profile = await me.json()
      if (!me.ok) throw new Error(profile.detail || 'Unable to load the staff account.')
      setAccount(profile)
      if (!['admin', 'operations', 'support'].includes(profile.role)) throw new Error('This is a traveller account. Use the profile icon to access your bookings.')
      const requests = [fetch(`${apiBaseUrl}/api/staff/bookings`, { headers: headers(session.token) })]
      if (profile.role !== 'operations') requests.push(fetch(`${apiBaseUrl}/api/staff/contact-enquiries?page=1&page_size=100`, { headers: headers(session.token) }))
      if (profile.role !== 'support') requests.push(fetch(`${apiBaseUrl}/api/operations/tours`, { headers: headers(session.token) }))
      const responses = await Promise.all(requests)
      const bodies = await Promise.all(responses.map(response => response.json()))
      if (responses.some(response => !response.ok)) throw new Error(bodies.find(body => body.detail)?.detail || 'Unable to load the workspace.')
      setBookings(bodies[0])
      let offset = 1
      if (profile.role !== 'operations') setEnquiries(bodies[offset++].items || [])
      if (profile.role !== 'support') setTours(bodies[offset] || [])
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWorkspace() }, [session?.token])

  const signIn = async (event) => {
    event.preventDefault()
    setLoading(true); setStatus('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to sign in.')
      onAuthenticated({ token: body.access_token })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateBooking = async (booking, booking_status) => {
    setStatus('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff/bookings/${booking.id}`, { method: 'PATCH', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_status }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update booking.')
      setBookings(current => current.map(item => item.id === body.id ? body : item))
    } catch (error) { setStatus(error.message) }
  }

  const queueConfirmation = async (booking) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff/bookings/${booking.id}/confirmations`, { method: 'POST', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify({ channels: ['email', 'whatsapp'] }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to queue confirmation.')
      setStatus(`Booking #${booking.id}: ${body.message}`)
    } catch (error) { setStatus(error.message) }
  }

  const saveSchedule = async (tour, form) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/operations/tours/${tour.id}/schedule`, { method: 'PATCH', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify({ capacity: Number(form.capacity), departure_date: form.departure_date || null, guide_name: form.guide_name || null }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update schedule.')
      setTours(current => current.map(item => item.id === body.id ? body : item))
      setStatus(`Schedule updated for ${body.title}.`)
    } catch (error) { setStatus(error.message) }
  }

  const updateEnquiry = async (enquiry, statusValue) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff/contact-enquiries/${enquiry.id}`, { method: 'PUT', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify({ status: statusValue, admin_notes: enquiry.admin_notes || '' }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update enquiry.')
      setEnquiries(current => current.map(item => item.id === body.id ? body : item))
    } catch (error) { setStatus(error.message) }
  }

  if (!session) return <main className="top-space"><section className="section contact-grid"><div><span className="eyebrow">Team access</span><h1>Operations and support workspace.</h1><p className="lead">Staff accounts are created by an administrator. Traveller accounts should use the profile icon.</p></div><form className="contact-form" onSubmit={signIn}><h2>Staff sign in</h2><label>Username<input required value={credentials.username} onChange={event => setCredentials(current => ({ ...current, username: event.target.value }))} /></label><label>Password<input required type="password" value={credentials.password} onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))} /></label><button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>{status && <p className="admin-status">{status}</p>}</form></section></main>

  if (account && !['admin', 'operations', 'support'].includes(account.role)) return <main className="top-space"><section className="section admin-empty"><h1>Traveller account detected</h1><p>Please use the profile icon to manage your bookings.</p><button className="primary-button" onClick={onLogout}>Log out</button></section></main>

  const canOperate = account?.role === 'admin' || account?.role === 'operations'
  const canSupport = account?.role === 'admin' || account?.role === 'support'
  return <main className="top-space"><section className="section admin-dashboard"><div className="admin-heading"><div><span className="eyebrow">{account?.role || 'Staff'} workspace</span><h1>Welcome back, {account?.name?.split(' ')[0] || 'there'}.</h1><p className="lead">{account?.role === 'support' ? 'Traveller support workspace — manage enquiries, cancellations, and confirmations.' : account?.role === 'operations' ? 'Tour operations workspace — manage schedules, capacity, guides, and bookings.' : 'Team workspace — coordinate operations and traveller support.'}</p></div></div>{status && <p className="admin-status">{status}</p>}{loading ? <p className="lead">Loading workspace…</p> : <>{canOperate && <section><h2>Booking operations</h2><div className="admin-request-list">{bookings.map(booking => <article className="admin-request-card" key={booking.id}><div className="request-summary"><div><span className="request-type">Booking #{booking.id} · {booking.booking_status}</span><h2>{booking.tour_title}</h2><p>{booking.customer_name} · {booking.customer_email}</p><p>{booking.travel_date} · {booking.travellers} travellers · Guide: {booking.guide_name || 'Unassigned'}</p></div><small>Payment: {booking.payment_status}</small></div><div className="admin-card-actions"><button onClick={() => updateBooking(booking, 'confirmed')}>Confirm</button><button onClick={() => updateBooking(booking, 'completed')}>Complete</button><button className="delete-button" onClick={() => updateBooking(booking, 'cancelled')}>Cancel</button></div></article>)}</div></section>}{canOperate && <section><h2>Schedules, capacity and guides</h2><div className="admin-request-list">{tours.map(tour => <ScheduleCard key={tour.id} tour={tour} onSave={saveSchedule} />)}</div></section>}{canSupport && <section><h2>Support bookings</h2><div className="admin-request-list">{bookings.map(booking => <article className="admin-request-card" key={booking.id}><div className="request-summary"><div><span className="request-type">Booking #{booking.id} · {booking.booking_status}</span><h2>{booking.tour_title}</h2><p>{booking.customer_name} · {booking.customer_email}</p></div><small>Payment: {booking.payment_status}</small></div><div className="admin-card-actions"><button onClick={() => queueConfirmation(booking)}>Resend confirmation</button><button className="delete-button" onClick={() => updateBooking(booking, 'cancelled')}>Cancel booking</button></div></article>)}</div></section>}{canSupport && <section><h2>Contact enquiries</h2><div className="admin-request-list">{enquiries.map(enquiry => <article className="admin-request-card" key={enquiry.id}><div className="request-summary"><div><span className="request-type">{enquiry.status}</span><h2>{enquiry.subject}</h2><p>{enquiry.name} · {enquiry.email}</p><p>{enquiry.message}</p></div></div><div className="admin-card-actions"><button onClick={() => updateEnquiry(enquiry, 'in_progress')}>Mark in progress</button><button onClick={() => updateEnquiry(enquiry, 'closed')}>Close</button></div></article>)}</div></section>}</>}</section></main>
}

function ScheduleCard({ tour, onSave }) {
  const [form, setForm] = useState({ capacity: tour.capacity, departure_date: tour.departure_date || '', guide_name: tour.guide_name || '' })
  return <article className="admin-request-card"><div className="request-summary"><div><span className="request-type">{tour.published ? 'Published' : 'Draft'}</span><h2>{tour.title}</h2><p>{tour.city} · {tour.duration}</p></div></div><div className="form-row"><label>Capacity<input type="number" min="1" max="500" value={form.capacity} onChange={event => setForm(current => ({ ...current, capacity: event.target.value }))} /></label><label>Departure date<input type="date" value={form.departure_date} onChange={event => setForm(current => ({ ...current, departure_date: event.target.value }))} /></label></div><label>Guide<input value={form.guide_name} onChange={event => setForm(current => ({ ...current, guide_name: event.target.value }))} /></label><button onClick={() => onSave(tour, form)}>Save schedule</button></article>
}

export function AdminTeamPortal({ apiBaseUrl, session, onLogout, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'operations' })
  const [status, setStatus] = useState('')
  const loadAccounts = async () => {
    const response = await fetch(`${apiBaseUrl}/api/admin/users`, { headers: headers(session.token) })
    const body = await response.json()
    if (response.status === 401) { onLogout(); return }
    if (!response.ok) throw new Error(body.detail || 'Unable to load accounts.')
    setAccounts(body)
  }
  useEffect(() => { loadAccounts().catch(error => setStatus(error.message)) }, [])
  const createAccount = async (event) => {
    event.preventDefault(); setStatus('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, { method: 'POST', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const body = await response.json()
      const validationMessage = Array.isArray(body.detail) ? body.detail.map(issue => `${issue.loc.at(-1)}: ${issue.msg}`).join('. ') : body.detail
      if (!response.ok) throw new Error(validationMessage || 'Unable to create staff account.')
      setAccounts(current => [body, ...current]); setForm({ name: '', username: '', email: '', password: '', role: 'operations' }); setStatus('Staff account created.')
    } catch (error) { setStatus(error.message) }
  }
  const setActive = async (account) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${account.id}`, { method: 'PATCH', headers: { ...headers(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !account.is_active }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update account.')
      setAccounts(current => current.map(item => item.id === body.id ? body : item))
    } catch (error) { setStatus(error.message) }
  }
  return <main className="top-space"><section className="section admin-dashboard"><div className="admin-heading"><div><span className="eyebrow">Administrator</span><h1>Team access</h1><p className="lead">Create operations and support accounts, or disable access when a team member leaves.</p></div><div className="admin-card-actions"><button onClick={onBack}>Back to dashboard</button></div></div><form className="contact-form admin-form" onSubmit={createAccount}><h2>Add staff member</h2><label>Name<input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label><label>Username<input required minLength="3" value={form.username} onChange={event => setForm(current => ({ ...current, username: event.target.value }))} /></label><label>Email<input required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label><label>Temporary password<input required type="password" minLength="8" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} /></label><label>Role<select value={form.role} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}><option value="operations">Tour Manager / Operations</option><option value="support">Support Executive</option><option value="admin">Administrator</option></select></label><button className="primary-button">Create staff account</button></form>{status && <p className="admin-status">{status}</p>}<div className="admin-request-list">{accounts.map(account => <article className="admin-request-card" key={account.id}><div className="request-summary"><div><span className="request-type">{account.role} · {account.is_active ? 'active' : 'disabled'}</span><h2>{account.name}</h2><p>{account.username} · {account.email}</p></div></div><div className="admin-card-actions"><button className={account.is_active ? 'delete-button' : ''} onClick={() => setActive(account)}>{account.is_active ? 'Disable' : 'Enable'}</button></div></article>)}</div></section></main>
}
