import { useEffect, useMemo, useState } from 'react'

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` })
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function UserPortal({ apiBaseUrl, session, onLogout }) {
  const [account, setAccount] = useState(null)
  const [bookings, setBookings] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadDashboard = async () => {
    if (!session?.token) return
    setLoading(true)
    try {
      const [accountResponse, bookingResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/auth/me`, { headers: authHeaders(session.token) }),
        fetch(`${apiBaseUrl}/api/bookings/me`, { headers: authHeaders(session.token) }),
      ])
      if (accountResponse.status === 401 || bookingResponse.status === 401) { onLogout(); return }
      const [accountBody, bookingBody] = await Promise.all([accountResponse.json(), bookingResponse.json()])
      if (!accountResponse.ok || !bookingResponse.ok) throw new Error(accountBody.detail || bookingBody.detail || 'Unable to load your journeys.')
      setAccount(accountBody); setProfile({ name: accountBody.name, email: accountBody.email, phone: accountBody.phone || '' }); setBookings(bookingBody)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [session?.token])

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = bookings.filter(item => item.travel_date >= today && item.booking_status !== 'cancelled')
    return { upcoming, paid: bookings.filter(item => item.payment_status === 'paid').length }
  }, [bookings])

  const saveProfile = async (event) => {
    event.preventDefault(); setSubmitting(true); setStatus('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, { method: 'PUT', headers: { ...authHeaders(session.token), 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update profile.')
      setAccount(body); setProfile({ name: body.name, email: body.email, phone: body.phone || '' }); setStatus('Your profile has been updated.')
    } catch (error) { setStatus(error.message) } finally { setSubmitting(false) }
  }

  const downloadConfirmation = async (bookingId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/${bookingId}/confirmation`, { headers: authHeaders(session.token) })
      if (!response.ok) { const body = await response.json(); throw new Error(body.detail || 'Unable to download confirmation.') }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = url; link.download = `nomad-booking-${bookingId}.txt`; link.click(); URL.revokeObjectURL(url)
    } catch (error) { setStatus(error.message) }
  }

  if (loading) return <main className="top-space traveller-dashboard"><section className="section"><p className="lead">Preparing your journeys…</p></section></main>
  if (!account) return null

  const initials = account.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return <main className="top-space traveller-dashboard"><section className="traveller-hero"><div className="traveller-welcome"><div className="traveller-avatar">{initials}</div><div><span className="eyebrow">Your Nomad account</span><h1>Hello, {account.name.split(' ')[0]}.</h1><p>Keep every upcoming experience, payment, and travel detail in one calm place.</p></div></div><div className="traveller-hero-actions"><button className="outline-button" onClick={() => window.location.assign('/tours')}>Explore tours</button></div></section><section className="traveller-stats"><article><span className="material-symbols-outlined">luggage</span><div><b>{summary.upcoming.length}</b><small>Upcoming journeys</small></div></article><article><span className="material-symbols-outlined">confirmation_number</span><div><b>{bookings.length}</b><small>Total bookings</small></div></article><article><span className="material-symbols-outlined">verified</span><div><b>{summary.paid}</b><small>Payments complete</small></div></article></section><section className="traveller-content"><nav className="traveller-tabs" aria-label="Traveller account"><button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button><button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>My bookings <span>{bookings.length}</span></button><button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button></nav>{status && <p className="traveller-status">{status}</p>}{activeTab === 'overview' && <section className="traveller-section"><div className="traveller-section-heading"><div><span className="eyebrow">Coming up</span><h2>Your next journeys</h2></div><button className="text-button" onClick={() => setActiveTab('bookings')}>View all</button></div>{summary.upcoming.length ? <div className="journey-list">{summary.upcoming.slice(0, 2).map(item => <JourneyCard key={item.id} item={item} onDownload={downloadConfirmation} />)}</div> : <div className="traveller-empty"><span className="material-symbols-outlined">explore</span><h3>Your next story is waiting.</h3><p>Explore local experiences and save your first journey.</p><button className="primary-button" onClick={() => window.location.assign('/tours')}>Browse experiences</button></div>}</section>}{activeTab === 'bookings' && <section className="traveller-section"><div className="traveller-section-heading"><div><span className="eyebrow">Your travel plans</span><h2>My bookings</h2></div><button className="outline-button" onClick={() => window.location.assign('/tours')}>Explore more tours</button></div>{bookings.length ? <div className="journey-list">{bookings.map(item => <JourneyCard key={item.id} item={item} onDownload={downloadConfirmation} expanded />)}</div> : <div className="traveller-empty"><span className="material-symbols-outlined">map</span><h3>No bookings yet</h3><p>Find an experience that feels like your kind of India.</p></div>}</section>}{activeTab === 'profile' && <div className="traveller-grid profile-grid"><section className="traveller-section"><span className="eyebrow">Personal details</span><h2>Your traveller profile</h2><p className="traveller-intro">Keep your contact details current so we can share booking updates and confirmations.</p><form className="traveller-form" onSubmit={saveProfile}><label>Full name<input required value={profile.name} onChange={event => setProfile(current => ({ ...current, name: event.target.value }))} /></label><label>Email address<input required type="email" value={profile.email} onChange={event => setProfile(current => ({ ...current, email: event.target.value }))} /></label><label>Phone / WhatsApp number<input type="tel" value={profile.phone} onChange={event => setProfile(current => ({ ...current, phone: event.target.value }))} /></label><button className="primary-button" disabled={submitting}>{submitting ? 'Saving…' : 'Save changes'}</button></form></section><aside className="traveller-profile-note"><span className="material-symbols-outlined">mail</span><h3>Account email</h3><p>{account.email}</p><small>Your sign-in username: <b>{account.username}</b></small></aside></div>}</section></main>
}

function JourneyCard({ item, onDownload, expanded = false }) {
  const isUnpaid = item.payment_status === 'unpaid'
  return <article className="journey-card"><img src={item.image_url} alt={item.tour_title} /><div className="journey-card-body"><div className="journey-card-topline"><span className={`journey-status ${item.booking_status}`}>{item.booking_status}</span><span className={`journey-payment ${item.payment_status}`}>{item.payment_status === 'paid' ? 'Payment complete' : `Payment: ${item.payment_status}`}</span></div><h3>{item.tour_title}</h3><p>{item.city} · {item.duration}</p><div className="journey-details"><span><i className="material-symbols-outlined">calendar_month</i>{formatDate(item.travel_date)}</span><span><i className="material-symbols-outlined">group</i>{item.travellers} traveller{item.travellers > 1 ? 's' : ''}</span></div>{expanded && item.special_requests && <p className="journey-note"><b>Your note:</b> {item.special_requests}</p>}<div className="journey-actions">{isUnpaid && item.booking_status !== 'cancelled' && <button className="primary-button" onClick={() => window.location.assign(`/payment?booking_id=${item.id}`)}>Pay now (Demo)</button>}<button className="text-button" onClick={() => onDownload(item.id)}>Download confirmation</button></div></div></article>
}
