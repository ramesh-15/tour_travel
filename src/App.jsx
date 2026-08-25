import { useEffect, useRef, useState } from 'react'
import delhiIndiaGate from './assets/delhi-india-gate.png'
import roadTripCar from './assets/road-trip-car.png'
import UserPortal from './UserPortal'
import { AdminTeamPortal, StaffPortal } from './StaffPortal'
import UnifiedLogin from './UnifiedLogin'
import './App.css'

const images = {
  gateway: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-yhTTTbmF0KufK5ozjDj4PNlvBoQAu7iNtm4bpSGB_zXNA4g1yQ51n4DpBDI6njI6WOL7GwgnudU8CqyFFx_iDWP47QesT6aj_X8DE8Ui6lFPGFMuc1b3cVI_-NCLVsJD5Op8m01UydADUuHg7yK6Lpf2i3eZ1M-M3IrBXiixTid4MhE58PYaVqh_NrORQJ7UvYYOngCrX7G3bYA3yJPYjpRHUI5xkmlrvhgbJY9NIFowjmv1l7tvSIuBNLbhTtnNY9G3SLYOFeY',
  city: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBspkPMgCN5jsVWpGox3fRwy3yYDWRFI73UA-qvgp6koUZnfJVzMJyw_6Hj86v9TShHaAEtP7VJeJUl9wJJtmRPDKK9Y8jd4aPGvF-hGpCzIUVzRgpJHMsRp17EQXw5BmJoSTd86LyoCcZSA8ujybsOrbclkem65KVjzGuNqLEOY8IWU-hG9P9O-lIODvP1nF2BaG5Q9k_XQsOed_zbg3K157XsNZFniD_x951eROY-uIhJagrUkrKGBf9w175TXfAv-07UTeEfOwI',
  market: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNIEcBKu8CEgpI3k2fF9Va76UeKL0Gkm4J9sjhDsfNDWhMxi6beUClfNE3WmfvrUMhWVqDV59jBMFn7rBTeK7JywQrgyz3ZSkfxcnDqtDvBgMj5sco6zhMW7gT0LaKd7oLL-ThzS45eJSaEHdndTV5ZjngPhm27ToEmytb4bm85Iz2Aqc-dMHKHA2BATtDIm_1yOViGReMG1g2uIk1jf7y5uDUh2zAXia5g1c5pYtsp1mz0Kw-stOd1iaRQjoAZoV-u2e_v4uitYs',
  heritage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeYew-RKEsoL0xHcWw-Yl9hRR5e7zmXXniIqMAmLhd1deGngA4PsZJKurpSXapcyQKFqv_BBy3h_LsK2hB3Xva1B9Th3VvlE-r8FkdR95b1JhJ-TWCxAX0af-LdiIdqUQGlwP9j9CdRAkwS3j3CxQupgXnfrgUWNRpUqi-Z4M8LXftw3QixaZyW67KZkiOHU_XE6CTQccoJODSR2JWE2yXTVG3AKa7adWOEhVSOcQOdFYxXMjO0Nsl8wsiL8UHTps8deP0hW6i9l4',
  bicycle: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDo_ABCi6Ne30XhC2OrEpEHacwtpRY2Hvbf4mp7Hn8X4Nc0lCc7mkB3I0jiK3QmmV_EIfanNzd3cUDQgsOQqbOUnKwjOktGmjhIgNk7nixMgZfT0sN4SM3EDaFkZQhnwoDIgDGRH4iT4qeYXVwdDX7WlbqIgPb_o-QL1xBB5gKGUWGVVTZGNeHpvsOZLDgJV7P8vL-H3TO72IXY2O0O8A5DLrzop3tFsXZiF2bcKtjewVPKyIH4xOgglIZqLNAPoy3YrXgYGBjWOE',
  dharavi: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKAa0AXXbC30oPrGCc3rEEGKm0sJSMUHg-jmxt5xThEEhcC6RXO6qZ2TtKTfsMAecpqJusBhzK0GWsg9g4WAD5TW2t51WRtbm5Qwm6qvgSZz-wfZmjUcd9ScG9qZDzin99thuXNrfSsndDBOJZrVWkWRKzvwW_YNZL9NJRAtbWsyr5HrplYJTdYJ496AGQTasAG5s1XJIGHiydx3AwEdU6Sd_UU6Bi9XkYbFZBcNWDtP_bpYr-kCXst4zExRCQERY62rRPPqVoOlk',
  pottery: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjtPZMOZUsCg8SEYnzpCmRg74EXBsaqdQASHv9vfmXpfZhO32Sx7kEiGN3b7HvTT5g_U-LigK8ESuVeTN5ZbSaUOyuAKnKlMBRvAC3afEtQxu682lZ7vBJW4O_12c5tnb5KHjzYgXJVpifnlxoF88dGhcHcwFtCwK6nhEOs9PCJdaqmqYdliMIR07IFAJ9k34S4jYottOZlYqnluv1xLjOsw6MvcRmkgss7j2c05gsW7ey5GfJ--3cGexdawNVOYP7u96-VRh5iXE',
  mumbai: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHu7SLyVWPjAXmffTqNx_h_ezBkUrG38RxSs0CpIBQszOI-VenY0kTf5TIU_-bbkDgeX0sqm8a_GxZFGqmN4hYCJlTLfTGVYZeinuQOLeu4Eu6cm5HKcC5_fo6W18yJy7fX1ccwNWvuXVskrqjlF0lt8rYEPPEh-P6nuVRP1K8maiMgPQsab-Lwuwtn8khW1gkiY3xFKCTqbE6wSh3d-2uLPPLn_tq-QzBsY0VdAMh7X56N0du7mazjPRhKhyzCMfYQ4jJPfN8n7s',
  raj: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgSdhMQ05ee1HfAGqwZjXDlL50w9fbZZo3PThmQGqg_XV1iGf1upc02TWeaFj3r5CVINxZ2vuj-mPpG0-IRow-vuuwwpr44jCeS1pSMBxHu519ecICpjTltsE6ihMliyhZjlNKRR896349I96jyPuBlM9ITwFtNdYSZAxCmRXMBQD1DuECmUie2K4CvkJSFzXzRO_sCBMXk6i8LR5vTHfGV09agMLynoUwBGeUAP-gAJWSy4Vj8TZrcyX84fP7tUcfldOOPPljWrA',
  delhi: delhiIndiaGate,
  food: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNIEcBKu8CEgpI3k2fF9Va76UeKL0Gkm4J9sjhDsfNDWhMxi6beUClfNE3WmfvrUMhWVqDV59jBMFn7rBTeK7JywQrgyz3ZSkfxcnDqtDvBgMj5sco6zhMW7gT0LaKd7oLL-ThzS45eJSaEHdndTV5ZjngPhm27ToEmytb4bm85Iz2Aqc-dMHKHA2BATtDIm_1yOViGReMG1g2uIk1jf7y5uDUh2zAXia5g1c5pYtsp1mz0Kw-stOd1iaRQjoAZoV-u2e_v4uitYs',
}

const fallbackTours = []
/*
  { title: 'Mumbai City Tours', text: "A comprehensive journey through Mumbai's most iconic landmarks, from the majestic Gateway of India to the vibrant Marine Drive. Perfect for first-time visitors seeking the soul of the city.", image: images.city, tag: 'TOP RATED', city: 'Mumbai', mode: 'Shared', category: 'City', duration: '4 hours', price: '₹2,500', highlights: ['Gateway of India', 'Marine Drive', 'Local stories'], featured: true },
  { title: 'Market Tours', text: 'Navigate the chaotic beauty of Crawford Market and Chor Bazaar. Discover exotic spices, textiles, and antique treasures hidden in plain sight.', image: images.market, city: 'Mumbai', mode: 'Shared', category: 'Market', duration: '3 hours', price: '₹1,800', highlights: ['Crawford Market', 'Chor Bazaar', 'Spice tasting'] },
  { title: 'Heritage Walking Tours', text: "A journey back in time through the Victorian Gothic and Indo-Saracenic architecture of South Mumbai's historic district.", image: images.heritage, city: 'Mumbai', mode: 'Shared', category: 'Walking', duration: '2.5 hours', price: '₹1,500', highlights: ['Historic district', 'Architecture', 'Local guide'] },
  { title: 'Bicycle Tours', text: "Experience the city's awakening. Pedal through quiet lanes and watch the morning bustle of fish markets and newspaper depots.", image: images.bicycle, city: 'Mumbai', mode: 'Shared', category: 'Cycling', duration: '3 hours', price: '₹1,900', highlights: ['Early morning', 'Quiet lanes', 'Bicycle included'] },
  { title: 'Dharavi Slum Tours', text: "A respectful perspective on Asia's largest informal economy. See the incredible resilience and industry that fuels this vibrant community.", image: images.dharavi, city: 'Mumbai', mode: 'Private', category: 'Community', duration: '2 hours', price: '₹1,500', highlights: ['Resident guide', 'Pottery colony', 'Community impact'], dark: true },
]
*/

const apiBaseUrl = import.meta.env.VITE_API_URL
const businessWhatsAppNumber = '919876543210'

function requiresCustomerAuth(destination) {
  const url = new URL(destination, window.location.origin)
  const protectedIntent = url.pathname === '/contact' && ['book', 'custom'].includes(url.searchParams.get('intent'))
  return protectedIntent || url.pathname === '/payment'
}

function AuthRequiredModal({ destination, onCancel, onContinue }) {
  const intent = new URL(destination, window.location.origin).searchParams.get('intent')
  const action = intent === 'custom' ? 'plan your trip' : 'book this experience'
  return <div className="auth-required-backdrop" role="presentation" onMouseDown={onCancel}><section className="auth-required-modal" role="dialog" aria-modal="true" aria-labelledby="auth-required-title" onMouseDown={event => event.stopPropagation()}><button className="auth-required-close" onClick={onCancel} aria-label="Close">×</button><span className="material-symbols-outlined auth-required-icon">lock</span><Eyebrow>Account required</Eyebrow><h2 id="auth-required-title">Sign in to continue</h2><p>Please log in or create an account before you {action}. We’ll bring you straight back here afterward.</p><div className="auth-required-actions"><button className="primary-button" onClick={onContinue}>Continue to login →</button><button className="text-button" onClick={onCancel}>Not now</button></div></section></div>
}

function apiTourToUi(tour) {
  return {
    ...tour,
    text: tour.description,
    image: tour.image_url,
    price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tour.price),
  }
}

function DummyPayment({ session }) {
  const query = new URLSearchParams(window.location.search)
  const [method, setMethod] = useState('upi')
  const [payment, setPayment] = useState(null)
  const [status, setStatus] = useState('')
  const [paying, setPaying] = useState(false)
  const tour = query.get('tour') || 'Tour booking'
  const name = query.get('name') || 'Traveller'
  const email = query.get('email') || ''
  const phone = query.get('phone') || ''
  const bookingId = query.get('booking_id')
  const amount = 499
  const completePayment = async (event) => {
    event.preventDefault()
    setPaying(true)
    setStatus('')
    try {
      const endpoint = bookingId ? `/api/bookings/${bookingId}/demo-payment` : '/api/demo-payments'
      const paymentHeaders = bookingId ? { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token || ''}` } : { 'Content-Type': 'application/json' }
      const paymentPayload = bookingId ? { payment_method: method } : { name, email, phone, tour_title: tour, amount, payment_method: method }
      const response = await fetch(`${apiBaseUrl}${endpoint}`, { method: 'POST', headers: paymentHeaders, body: JSON.stringify(paymentPayload) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to complete the demo payment.')
      setPayment(body)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setPaying(false)
    }
  }
  if (payment) return <main className="top-space"><section className="section payment-screen"><div className="payment-confirmation"><span className="material-symbols-outlined">check_circle</span><Eyebrow>Demo payment successful</Eyebrow><h1>Your booking request is recorded.</h1><p>This is a test payment only. No money was transferred and no live messages were sent.</p><div className="payment-receipt"><div><span>Tour</span><b>{payment.payment.tour_title}</b></div><div><span>Demo reference</span><b>{payment.payment.transaction_reference}</b></div><div><span>Amount</span><b>₹{Number(payment.payment.amount).toLocaleString('en-IN')}</b></div><div><span>Method</span><b>{payment.payment.payment_method.replace('_', ' ')}</b></div></div><div className="confirmation-previews"><article><span className="material-symbols-outlined">mail</span><div><b>Email confirmation preview</b><p>{payment.email_confirmation}</p></div></article><article><span className="material-symbols-outlined">chat</span><div><b>WhatsApp template preview</b><p>{payment.whatsapp_confirmation}</p></div></article></div><button className="primary-button" onClick={() => window.location.assign('/')}>Back to home</button></div></section></main>
  return <main className="top-space"><section className="section payment-screen"><div className="payment-intro"><Eyebrow>Demo checkout</Eyebrow><h1>Complete your test payment</h1><p>This Razorpay-style screen is a safe simulation for the booking flow. No payment details are processed and no money moves.</p><div className="payment-order"><span>Booking deposit</span><b>₹{amount.toLocaleString('en-IN')}</b><small>{tour}</small></div></div><form className="contact-form payment-form" onSubmit={completePayment}><div className="payment-form-heading"><span className="material-symbols-outlined">lock</span><div><h2>Choose a payment method</h2><p>Demo mode only</p></div></div><div className="payment-methods">{[['upi', 'UPI'], ['credit_card', 'Credit card'], ['debit_card', 'Debit card']].map(([value, label]) => <label key={value} className={method === value ? 'selected' : ''}><input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} /><span className="material-symbols-outlined">{value === 'upi' ? 'qr_code_2' : 'credit_card'}</span><b>{label}</b></label>)}</div><div className="payment-demo-note"><span className="material-symbols-outlined">info</span><p>For this demo, click the button below to simulate a successful payment.</p></div><button className="primary-button" type="submit" disabled={paying}>{paying ? 'Processing demo payment...' : `Pay ₹${amount.toLocaleString('en-IN')} (Demo)`}</button>{status && <p className="admin-status">{status}</p>}</form></section></main>
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [query, setQuery] = useState(window.location.search)
  const [tours, setTours] = useState(fallbackTours)
  const [userSession, setUserSession] = useState(() => {
    const token = sessionStorage.getItem('nomad_user_token')
    return token ? { token } : null
  })
  const [adminSession, setAdminSession] = useState(() => {
    const token = sessionStorage.getItem('nomad_admin_token')
    return token ? { token } : null
  })
  const [staffSession, setStaffSession] = useState(() => {
    const token = sessionStorage.getItem('nomad_staff_token')
    return token ? { token } : null
  })
  const [pendingAuthDestination, setPendingAuthDestination] = useState('')
  const go = (to, customerAuthenticated = false) => {
    const requested = new URL(to, window.location.origin)
    if (!userSession && !customerAuthenticated && requiresCustomerAuth(requested.href)) {
      const destination = `${requested.pathname}${requested.search}${requested.hash}`
      sessionStorage.setItem('nomad_after_login', destination)
      setPendingAuthDestination(destination)
      return
    }
    const next = requested
    window.history.pushState({}, '', `${next.pathname}${next.search}${next.hash}`)
    setPath(next.pathname)
    setQuery(next.search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const clearAdminSession = () => {
    sessionStorage.removeItem('nomad_admin_token')
    setAdminSession(null)
  }
  const clearUserSession = () => {
    sessionStorage.removeItem('nomad_user_token')
    setUserSession(null)
  }
  const clearStaffSession = () => {
    sessionStorage.removeItem('nomad_staff_token')
    setStaffSession(null)
  }
  const logoutUser = async () => {
    try {
      if (userSession) await fetch(`${apiBaseUrl}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${userSession.token}` } })
    } finally {
      clearUserSession()
    }
  }
  const logoutAdmin = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/admin/logout`, { method: 'POST', headers: { Authorization: `Bearer ${adminSession.token}` } })
    } finally {
      // Remove the local token even if it has already expired or was revoked.
      clearAdminSession()
    }
  }
  const logoutStaff = async () => {
    try {
      if (staffSession) await fetch(`${apiBaseUrl}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${staffSession.token}` } })
    } finally {
      clearStaffSession()
    }
  }
  const authenticateByRole = ({ token, role }) => {
    if (role === 'customer') {
      const currentDestination = `${path}${query}`
      const pendingDestination = sessionStorage.getItem('nomad_after_login')
      const destination = pendingDestination || (requiresCustomerAuth(currentDestination) ? currentDestination : '/')
      sessionStorage.removeItem('nomad_after_login')
      setPendingAuthDestination('')
      sessionStorage.setItem('nomad_user_token', token); setUserSession({ token }); go(destination, true)
    } else if (role === 'admin') {
      sessionStorage.setItem('nomad_admin_token', token); setAdminSession({ token }); go('/admin')
    } else {
      sessionStorage.setItem('nomad_staff_token', token); setStaffSession({ token }); go('/staff')
    }
  }
  useEffect(() => { const onPop = () => { setPath(window.location.pathname); setQuery(window.location.search) }; window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/tours`).then(response => response.ok ? response.json() : Promise.reject()).then(data => {
      setTours(data.items.map(apiTourToUi))
    }).catch(() => {})
  }, [])
  const loginPage = <UnifiedLogin apiBaseUrl={apiBaseUrl} onAuthenticated={authenticateByRole} />
  const customerRouteIsProtected = requiresCustomerAuth(`${path}${query}`)
  const showingLogin = path === '/login' || (customerRouteIsProtected && !userSession)
  const page = showingLogin ? loginPage : path === '/admin/team' ? (adminSession ? <AdminTeamPortal apiBaseUrl={apiBaseUrl} session={adminSession} onLogout={logoutAdmin} onBack={() => go('/admin')} /> : loginPage) : path === '/admin' ? (adminSession ? <AdminDashboardV2 session={adminSession} onSessionExpired={clearAdminSession} onManageTeam={() => go('/admin/team')} onTourSaved={(tour) => setTours(current => tour.published ? [apiTourToUi(tour), ...current.filter(item => item.id !== tour.id)] : current.filter(item => item.id !== tour.id))} onTourDeleted={(tourId) => setTours(current => current.filter(tour => tour.id !== tourId))} /> : loginPage) : path === '/staff' ? (staffSession ? <StaffPortal apiBaseUrl={apiBaseUrl} session={staffSession} onAuthenticated={(nextSession) => { sessionStorage.setItem('nomad_staff_token', nextSession.token); setStaffSession(nextSession) }} onLogout={logoutStaff} /> : loginPage) : path === '/account' ? (userSession ? <UserPortal apiBaseUrl={apiBaseUrl} session={userSession} onAuthenticated={(nextSession) => { sessionStorage.setItem('nomad_user_token', nextSession.token); setUserSession(nextSession) }} onLogout={logoutUser} /> : loginPage) : path === '/about' ? <About go={go} /> : path === '/tours/festival' ? <ToursV3 go={go} city="" category="Festival" /> : path === '/tours' ? <ToursV3 go={go} city={new URLSearchParams(query).get('city') || ''} /> : path === '/trips/one-day' ? <TripsPageV2 go={go} type="one-day" /> : path === '/trips/weekly' ? <TripsPageV2 go={go} type="weekly" /> : path === '/tours/dharavi' ? <Dharavi go={go} /> : path === '/payment' ? <DummyPayment session={userSession} /> : path === '/contact' ? <ContactFlowV2 /> : <Home go={go} />
  const closeAuthPrompt = () => { sessionStorage.removeItem('nomad_after_login'); setPendingAuthDestination('') }
  const continueToLogin = () => { setPendingAuthDestination(''); go('/login') }
  return <>{!showingLogin && <Header path={path} go={go} userSession={userSession} onUserLogout={userSession ? logoutUser : null} onStaffLogout={path === '/staff' && staffSession ? logoutStaff : null} onAdminLogout={path.startsWith('/admin') && adminSession ? logoutAdmin : null} />}{page}{!showingLogin && <><Footer go={go} /><a className="floating-whatsapp" href={`https://wa.me/${businessWhatsAppNumber}?text=Hello%20Nomad%20Wanderers%2C%20I%20would%20like%20to%20plan%20a%20tour.`} target="_blank" rel="noreferrer" aria-label="Chat with Nomad Wanderers on WhatsApp"><span className="material-symbols-outlined">chat</span><span>WhatsApp</span></a></>}{pendingAuthDestination && <AuthRequiredModal destination={pendingAuthDestination} onCancel={closeAuthPrompt} onContinue={continueToLogin} />}</>
}

function Header({ path, go, userSession, onUserLogout, onStaffLogout, onAdminLogout }) {
  const [toursOpen, setToursOpen] = useState(false)
  const [tripsOpen, setTripsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  useEffect(() => {
    if (!userMenuOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setUserMenuOpen(false)
    }
    const closeOnEscape = (event) => { if (event.key === 'Escape') setUserMenuOpen(false) }
    const closeOnScroll = () => setUserMenuOpen(false)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [userMenuOpen])
  const link = (label, to, active) => { const destination = label === 'About' ? '/about' : to; return <button className={`nav-link ${label === 'About' ? path === '/about' : active ? 'active' : ''}`} onClick={() => go(destination)}>{label}</button> }
  if (onAdminLogout) return <header className="site-header"><nav><button className="brand" onClick={() => go('/')}>Nomad Wanderers</button><div className="nav-links"><span className="admin-nav-label">Admin workspace</span></div><div className="profile-nav-menu" ref={profileMenuRef}><button className={`profile-nav-button admin-profile-button ${path.startsWith('/admin') ? 'active' : ''}`} onClick={() => setUserMenuOpen(current => !current)} aria-label="Open admin account menu" aria-expanded={userMenuOpen}><span className="material-symbols-outlined">account_circle</span></button>{userMenuOpen && <div className="profile-dropdown"><button onClick={() => { setUserMenuOpen(false); go('/admin') }}><span className="material-symbols-outlined">dashboard</span>Admin dashboard</button><button className="profile-logout" onClick={onAdminLogout}><span className="material-symbols-outlined">logout</span>Log out</button></div>}</div></nav></header>
  if (onStaffLogout) return <header className="site-header"><nav><button className="brand" onClick={() => go('/')}>Nomad Wanderers</button><div className="nav-links"><span className="admin-nav-label">Team workspace</span></div><div className="profile-nav-menu" ref={profileMenuRef}><button className={`profile-nav-button ${path === '/staff' ? 'active' : ''}`} onClick={() => setUserMenuOpen(current => !current)} aria-label="Open team account menu" aria-expanded={userMenuOpen}><span className="material-symbols-outlined">account_circle</span></button>{userMenuOpen && <div className="profile-dropdown"><button onClick={() => { setUserMenuOpen(false); go('/staff') }}><span className="material-symbols-outlined">work</span>Team workspace</button><button className="profile-logout" onClick={onStaffLogout}><span className="material-symbols-outlined">logout</span>Log out</button></div>}</div></nav></header>
  if (path === '/admin') return <header className="site-header"><nav><button className="brand" onClick={() => go('/')}>Nomad Wanderers</button></nav></header>
  const selectTour = (destination) => { setToursOpen(false); go(destination) }
  const selectTrip = (destination) => { setTripsOpen(false); go(destination) }
  const mobileNavigate = (destination) => { setMobileNavOpen(false); go(destination) }
  return <header className="site-header"><nav><button className="brand" onClick={() => go('/')}>Nomad Wanderers</button><div className="nav-links">{link('Home', '/', path === '/')}<div className="tours-menu" onMouseEnter={() => setToursOpen(true)} onMouseLeave={() => setToursOpen(false)}><button className={`nav-link tours-trigger ${path.startsWith('/tours') ? 'active' : ''}`} onClick={() => selectTour('/tours')} onFocus={() => setToursOpen(true)} onBlur={() => setToursOpen(false)} aria-expanded={toursOpen} aria-haspopup="true">Tours <span className="material-symbols-outlined">expand_more</span></button>{toursOpen && <div className="tours-dropdown"><button onClick={() => selectTour('/tours?city=Mumbai')}>Mumbai</button><button onClick={() => selectTour('/tours?city=Delhi')}>Delhi</button><span className="dropdown-divider" /><button onClick={() => selectTour('/tours/festival')}>Festival Tours</button></div>}</div><div className="trips-menu" onMouseEnter={() => setTripsOpen(true)} onMouseLeave={() => setTripsOpen(false)}><button className={`nav-link trips-trigger ${path.startsWith('/trips') ? 'active' : ''}`} onFocus={() => setTripsOpen(true)} onBlur={() => setTripsOpen(false)} aria-expanded={tripsOpen} aria-haspopup="true">Trips</button>{tripsOpen && <div className="trips-dropdown"><button onClick={() => selectTrip('/trips/one-day')}>One-day trips</button><button onClick={() => selectTrip('/trips/weekly')}>Weekly trips</button><button onClick={() => selectTrip('/contact?intent=custom')}>Plan Your Trip</button></div>}</div>{link('About', '/', false)}{link('Contact', '/contact', path === '/contact')}</div>{userSession ? <div className="profile-nav-menu" ref={profileMenuRef}><button className={`profile-nav-button ${path === '/account' ? 'active' : ''}`} onClick={() => setUserMenuOpen(current => !current)} aria-label="Open account menu" aria-expanded={userMenuOpen}><span className="material-symbols-outlined">account_circle</span></button>{userMenuOpen && <div className="profile-dropdown"><button onClick={() => { setUserMenuOpen(false); go('/account') }}><span className="material-symbols-outlined">luggage</span>My journeys</button><button className="profile-logout" onClick={onUserLogout}><span className="material-symbols-outlined">logout</span>Log out</button></div>}</div> : <button className="profile-nav-button" onClick={() => go('/login')} aria-label="Sign in or create an account"><span className="material-symbols-outlined">account_circle</span></button>}<button className="mobile-nav-toggle" onClick={() => setMobileNavOpen(current => !current)} aria-label="Toggle navigation menu" aria-expanded={mobileNavOpen}><span className="material-symbols-outlined">{mobileNavOpen ? 'close' : 'menu'}</span></button>{mobileNavOpen && <div className="mobile-nav-menu"><button className={path === '/' ? 'active' : ''} onClick={() => mobileNavigate('/')}>Home</button><span>Tours</span><button className={path === '/tours' ? 'active' : ''} onClick={() => mobileNavigate('/tours')}>All tours</button><button className="trip-option" onClick={() => mobileNavigate('/tours?city=Mumbai')}>Mumbai</button><button className="trip-option" onClick={() => mobileNavigate('/tours?city=Delhi')}>Delhi</button><button className="trip-option" onClick={() => mobileNavigate('/tours/festival')}>Festival Tours</button><span>Trips</span><button className={path === '/trips/one-day' ? 'active trip-option' : 'trip-option'} onClick={() => mobileNavigate('/trips/one-day')}>One-day trips</button><button className={path === '/trips/weekly' ? 'active trip-option' : 'trip-option'} onClick={() => mobileNavigate('/trips/weekly')}>Weekly trips</button><button className="trip-option" onClick={() => mobileNavigate('/contact?intent=custom')}>Plan Your Trip</button><button className={path === '/about' ? 'active' : ''} onClick={() => mobileNavigate('/about')}>About</button><button className={path === '/contact' ? 'active' : ''} onClick={() => mobileNavigate('/contact')}>Contact</button></div>}</nav></header>
}

function Hero({ children, image = images.gateway, className = '' }) { return <section className={`hero-section ${className}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(4, 25, 25, .85), rgba(4,25,25,.38)), url(${image})` }}>{children}</section> }
function Eyebrow({ children }) { return <div className="eyebrow">{children}</div> }
function CTA({ go, title = 'Ready for an Unforgettable Journey?', text = 'Book your customized Mumbai experience today and see the city like never before.', label = 'Book Now', destination = '/contact' }) { return <section className="cta"><h2>{title}</h2><p>{text}</p><button onClick={() => go(destination)}>{label} <span>→</span></button></section> }

function About({ go }) {
  const principles = [
    ['diversity_3', 'Local knowledge, not a script', 'Every walk begins with the people, neighbourhoods, and small details that make a place feel alive.'],
    ['volunteer_activism', 'Respect before access', 'We design experiences that value communities and keep photography, conversation, and curiosity considerate.'],
    ['map', 'Room to wander', 'Our routes have a shape, but never a stopwatch. There is time for questions, chai, and the unexpected.'],
  ]
  return <main className="top-space"><Hero image={images.mumbai} className="about-hero"><div className="hero-content"><Eyebrow>Our story</Eyebrow><h1>India is best met <em>slowly.</em></h1><p>Nomad Wanderers creates thoughtful, locally led experiences for travellers who want more than a checklist.</p></div></Hero><section className="section about-intro"><div className="about-photo"><img src={images.raj} alt="Raj, founder of Nomad Wanderers" /></div><div className="about-copy"><Eyebrow>Founded in Mumbai</Eyebrow><h2>Built from a love of showing people the real city.</h2><p>Nomad Wanderers began with Raj, a Mumbai local who spent years guiding visitors beyond the familiar postcard views. What started as one person sharing the streets he knows by heart has grown into a close-knit team of hosts, planners, and local experts.</p><p>We still work the same way: listen closely, recommend honestly, and make every journey feel personal. From a first morning in Mumbai to a multi-day route across India, we care about the stories that stay with you after the photographs are packed away.</p><div className="about-stats"><div><b>12</b><span>years guiding</span></div><div><b>500+</b><span>journeys shared</span></div><div><b>4.9/5</b><span>traveller rating</span></div></div></div></section><section className="section about-principles"><div className="section-heading"><Eyebrow>What guides us</Eyebrow><h2>Good travel is a conversation.</h2><p className="lead">We believe memorable journeys are generous with time, grounded in place, and respectful of the people who call a destination home.</p></div><div className="about-principle-grid">{principles.map(([icon, title, text]) => <article key={title}><span className="material-symbols-outlined">{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section><section className="section about-process"><div><Eyebrow>How we work</Eyebrow><h2>Carefully planned.<br /><em>Beautifully unplanned.</em></h2></div><div className="about-process-list"><article><b>01</b><div><h3>Start with you</h3><p>We ask about your interests, energy, timing, and the kind of India you hope to find.</p></div></article><article><b>02</b><div><h3>Pair you with the right local voice</h3><p>Your host brings lived knowledge, context, and the confidence to take a side street when it is worth it.</p></div></article><article><b>03</b><div><h3>Leave space for discovery</h3><p>The best moments are rarely scheduled. We build in room for a market stall, a conversation, or a view worth lingering over.</p></div></article></div></section><section className="about-quote"><div><span>“</span><blockquote>We do not just show you where to go. We help you understand why a place matters.</blockquote><p>— Raj, Founder</p></div></section><CTA go={go} title="Ready to make it personal?" text="Tell us what you love, how you like to travel, and the India you hope to discover. We will shape the route around you." label="Plan Your Trip" destination="/contact?intent=custom" /></main>
}

function RoadTripNotification({ go }) {
  return <aside className="road-trip-promo" role="status"><img src={roadTripCar} alt="Car on a scenic road trip" /><div><span>Ready when you are</span><strong>Let’s take the scenic route.</strong><button onClick={() => go('/contact')}>Plan a trip →</button></div></aside>
}

function OfferCountdown({ seconds, onClose }) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return <aside className="offer-countdown" role="status" aria-live="polite"><button onClick={onClose} aria-label="Close offer">×</button><span className="material-symbols-outlined">hourglass_top</span><div><small>Offer Ends In</small><strong>{hours} <i>:</i> {minutes} <i>:</i> {remainingSeconds}</strong></div></aside>
}

function Home({ go }) {
  const [showRoadTrip, setShowRoadTrip] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [offerSeconds, setOfferSeconds] = useState((3 * 60 * 60) + (15 * 60) + 24)
  useEffect(() => {
    let hideRoadTripTimer
    const roadTripTimer = window.setTimeout(() => {
      setShowRoadTrip(true)
      hideRoadTripTimer = window.setTimeout(() => setShowRoadTrip(false), 6_500)
    }, 24_000)
    return () => { window.clearTimeout(roadTripTimer); window.clearTimeout(hideRoadTripTimer) }
  }, [])
  useEffect(() => {
    const offerTimer = window.setTimeout(() => setShowOffer(true), 12_000)
    return () => window.clearTimeout(offerTimer)
  }, [])
  useEffect(() => {
    if (!showOffer) return undefined
    const countdownTimer = window.setInterval(() => setOfferSeconds(current => Math.max(0, current - 1)), 1_000)
    return () => window.clearInterval(countdownTimer)
  }, [showOffer])
  const values = [['verified', '12 Years Experience', 'A decade of professional guiding has allowed us to perfect the balance between iconic sights and secret local spots.'], ['location_on', 'Dharavi Perspective', "Experience Dharavi through the eyes of a resident. We provide an authentic, respectful, and enlightening look at Mumbai's heart."], ['workspace_premium', 'Professional Service', 'Safety, comfort, and reliability are our pillars. Every tour is curated to ensure a seamless and memorable adventure.']]
  return <main className="home-page">{showRoadTrip && <RoadTripNotification go={go} />}{showOffer && <OfferCountdown seconds={offerSeconds} onClose={() => setShowOffer(false)} />}
    <section className="home-carousel-section"><HomeTourCarousel go={go} /></section>
    <section className="home-welcome"><div className="home-welcome-copy"><Eyebrow>Beyond the guidebooks</Eyebrow><h1>Feel at home,<br /><em>wherever you wander.</em></h1><p>Nomad Wanderers creates thoughtful, locally led experiences for travellers who want more than a checklist. With over 12 years of guiding, we bring you closer to India through its people, places, flavours and small, unforgettable moments.</p><button className="primary-button" onClick={() => go('/tours')}>Explore our experiences <span>→</span></button></div><div className="home-welcome-moments"><span>Made for meaningful journeys</span><article><b>Local stories</b><p>Meet the people and neighbourhoods that make every place feel alive.</p></article><article><b>Unhurried days</b><p>Leave room for curiosity, chai stops and the moments you did not plan.</p></article><article><b>Thoughtful planning</b><p>Travel with the comfort of one trusted team from first idea to final day.</p></article></div></section>
    <section className="section intro"><div className="section-heading"><Eyebrow>Local Insights</Eyebrow><h2>Why Choose Nomad Wanderers?</h2></div><div className="value-grid">{values.map(([icon,title,text]) => <article className="value-card" key={title}><span className="icon-circle material-symbols-outlined">{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="section soft"><div className="section-heading split-heading"><div><Eyebrow>Explore by destination</Eyebrow><h2>Two cities. Countless ways in.</h2></div><button className="text-button" onClick={() => go('/tours')}>View all experiences →</button></div><div className="city-pair"><button className="city-card" onClick={() => go('/tours')}><img src={images.city} alt="Mumbai skyline"/><span><b>Mumbai</b><small>Markets, neighbourhoods, food & community</small></span></button><button className="city-card" onClick={() => go('/tours')}><img src={images.delhi} alt="Delhi architecture"/><span><b>Delhi</b><small>Heritage, street life, stories & flavours</small></span></button></div></section>
    <section className="section soft experience-strip"><div className="section-heading split-heading"><div><Eyebrow>The Experiences</Eyebrow><h2>Our Popular Tours</h2></div><button className="text-button" onClick={() => go('/tours')}>Browse the collection →</button></div><div className="feature-grid"><TourFeature title="City Essentials" text="A comprehensive journey through Mumbai's most iconic landmarks and historic narratives." image={images.city} large /><TourFeature title="Market & Senses" text="Explore the vibrant colors of Crawford Market." image={images.market} /><TourFeature title="Dharavi Inside" text="An educational look at local industry." image={images.dharavi} onClick={() => go('/tours/dharavi')} /><TourFeature title="Bicycle Dawn" text="See the city wake up." image={images.bicycle} /></div></section>
    <section className="section custom-travel"><div className="custom-copy"><Eyebrow>More than a day trip</Eyebrow><h2>Your India,<br /><em>your itinerary.</em></h2><p>Planning a multi-day journey? We manage every detail — accommodation, domestic transport, sightseeing, local guides, and the experiences that make a route yours.</p><button className="primary-button" onClick={() => go('/contact?intent=custom')}>Plan Your Trip <span>→</span></button></div><div className="custom-steps">{[['01','Tell us your story','Your interests, pace, budget, and wish list.'],['02','We shape the route','A considered itinerary with the right local moments.'],['03','Travel with confidence','One trusted team from first plan to final day.']].map(([number,title,text]) => <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
    <section className="section story" id="story"><div className="story-photo"><img src={images.raj} alt="Raj, your local guide" /></div><div className="story-copy"><Eyebrow>The Heart of Nomad Wanderers</Eyebrow><h2>Our Story</h2><p>Nomad Wanderers is the culmination of Raj's 12-year journey through the heart of Mumbai. Born and raised in this vibrant metropolis, Raj began his career as a professional guide, driven by a deep love for his city and a desire to share its untold stories.</p><p>Today, Nomad Wanderers has evolved from an individual passion into a dedicated tour company. Raj has poured his heart into building an organization that offers authentic, expert-led journeys that go beyond the guidebooks, ensuring every guest experiences the soul of India through the eyes of those who know it best.</p><div className="stats"><div><b>500+</b><span>Tours guided</span></div><div><b>4.9/5</b><span>Average rating</span></div><div><b>12 yrs</b><span>Experience</span></div></div><button className="text-button" onClick={() => go('/contact')}>Meet the team →</button></div></section>
    <section className="section testimonials"><Eyebrow>Traveller stories</Eyebrow><h2>Loved by curious travellers</h2><div className="quote-grid">{[['“Raj’s local knowledge made our Dharavi tour the highlight of our trip.”','Sarah M.','United Kingdom'],['“The dawn bicycle tour was magical. Highly professional and truly memorable.”','David L.','Australia'],['“Professional, safe, and authentic. We saw the real Mumbai.”','Elena K.','Germany']].map(([quote,name,place]) => <blockquote key={name}><span>“</span><p>{quote.replaceAll('“','').replaceAll('”','')}</p><footer><b>{name}</b><small>{place}</small></footer></blockquote>)}</div></section>
    <CTA go={go} />
  </main>
}

function TourFeature({ title, text, image, large, onClick }) { return <button className={`tour-feature ${large ? 'large' : ''}`} onClick={onClick}><img src={image} alt="" /><span className="tile-overlay" /><span className="tile-copy"><strong>{title}</strong><small>{text}</small></span></button> }

const homeFeaturedTours = [
  { title: 'Mumbai City Essentials', city: 'Mumbai', description: 'A locally led introduction to Mumbai’s landmark views, historic streets and everyday stories.', image: images.city, duration: '8 hours', price: '₹3,200', highlights: ['Gateway of India', 'Marine Drive', 'Local lunch'] },
  { title: 'South Mumbai Heritage Walk', city: 'Mumbai', description: 'Walk through Kala Ghoda, the Fort district and Mumbai’s grand colonial landmarks with a local history guide.', image: images.heritage, duration: '6 hours', price: '₹2,600', highlights: ['Kala Ghoda', 'Colonial architecture', 'Local chai'] },
  { title: 'Dharavi Inside', city: 'Mumbai', description: 'A respectful, resident-led perspective on local enterprise, craft and community in Dharavi.', image: images.dharavi, duration: '3 hours', price: '₹1,500', highlights: ['Resident guide', 'Local industry', 'Community perspective'] },
  { title: 'Delhi City Discovery', city: 'Delhi', description: 'Discover the contrast of old and new Delhi, from bustling bazaars to grand avenues.', image: images.delhi, duration: '8 hours', price: '₹3,400', highlights: ['Old Delhi', 'India Gate', 'Private transport'] },
]

function HomeTourCarousel({ go }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const tour = homeFeaturedTours[activeIndex]
  const changeTour = (direction) => setActiveIndex(current => (current + direction + homeFeaturedTours.length) % homeFeaturedTours.length)
  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex(current => (current + 1) % homeFeaturedTours.length), 5_000)
    return () => window.clearInterval(timer)
  }, [])
  return <section className="home-tour-carousel" aria-label="Popular tours carousel"><div className="home-tour-carousel-card" key={tour.title}><div className="home-tour-carousel-image"><img src={tour.image} alt={tour.title} /></div><div className="home-tour-carousel-content"><h3>{tour.title}</h3><p>{tour.description}</p><button className="primary-button" onClick={() => go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}>Book this tour →</button></div><button className="home-carousel-arrow previous" onClick={() => changeTour(-1)} aria-label="Show previous tour">←</button><button className="home-carousel-arrow next" onClick={() => changeTour(1)} aria-label="Show next tour">→</button><div className="home-carousel-pagination">{homeFeaturedTours.map((item, index) => <button key={item.title} className={index === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.title}`} aria-current={index === activeIndex} />)}</div></div></section>
}

function Tours({ go, tours }) {
  const [filter, setFilter] = useState('All experiences')
  const filterOptions = ['All experiences', 'Mumbai', 'Delhi', 'Hyderabad', 'One-day trip', 'Weekly trip', 'Shared', 'Private']
  const displayed = filter === 'All experiences' ? tours : tours.filter((tour) => [tour.city, tour.trip_type, tour.mode, tour.category].includes(filter))
  return <main className="top-space"><section className="section tours-page"><Eyebrow>Locally led across India</Eyebrow><h1>Curated Experiences</h1><p className="lead">Browse one-day and weekly tours in Mumbai, Delhi and Hyderabad, then choose the shared or private format that suits you.</p><div className="filters">{filterOptions.map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="tour-grid">{displayed.map(tour => <article className={`tour-card ${tour.featured ? 'featured' : ''}`} key={tour.title}><div className="tour-image"><img src={tour.image} alt={tour.title}/>{tour.tag && <span>{tour.tag}</span>}</div><div className="tour-body"><div className="tour-meta"><span>⌖ {tour.city}</span><span>{tour.trip_type} · {tour.mode}</span></div><h2>{tour.title}</h2><p>{tour.text}</p><div className="tour-details"><span>◷ {tour.duration}</span><strong>{tour.price}<small> / person</small></strong></div><div className="highlight-list">{tour.highlights.map(highlight => <span key={highlight}>✓ {highlight}</span>)}</div><button className={tour.dark ? 'dark-button' : 'outline-button'} onClick={() => tour.title === 'Dharavi Slum Tours' ? go('/tours/dharavi') : go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}>{tour.featured ? 'Book this tour →' : 'Book this experience →'}</button></div></article>)}</div></section><section className="booking-benefits"><div><span className="material-symbols-outlined">verified_user</span><b>Trusted local hosts</b><small>Guides who live the story</small></div><div><span className="material-symbols-outlined">groups</span><b>Small groups</b><small>More time for real connection</small></div><div><span className="material-symbols-outlined">event_available</span><b>Flexible booking</b><small>Free cancellation up to 24h</small></div><div><span className="material-symbols-outlined">support_agent</span><b>Local support</b><small>One team from plan to return</small></div></section><CTA go={go} /></main>
}

function ToursV2({ go, tours }) {
  const [filter, setFilter] = useState('All experiences')
  const [search, setSearch] = useState('')
  const filters = ['All experiences', 'Heritage', 'Food', 'Culture', 'Walking', 'Adventure', 'Shared', 'Private']
  const normalizedSearch = search.trim().toLowerCase()
  const displayed = tours.filter(tour => {
    const matchesFilter = filter === 'All experiences' || tour.mode === filter || tour.category.toLowerCase().includes(filter.toLowerCase())
    const searchableText = `${tour.title} ${tour.description} ${tour.category}`.toLowerCase()
    return matchesFilter && (!normalizedSearch || searchableText.includes(normalizedSearch))
  })
  return <main className="top-space"><section className="section tours-page"><Eyebrow>Find your kind of day</Eyebrow><h1>Curated Experiences</h1><p className="lead">Browse local experiences by the stories you want to take home—from heritage streets and food trails to culture-led walks.</p><div className="tour-browser-tools"><label className="tour-search"><span className="material-symbols-outlined">search</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search experiences" aria-label="Search experiences" /></label><div className="filters" aria-label="Filter experiences">{filters.map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div>{displayed.length ? <div className="tour-grid">{displayed.map(tour => <article className={`tour-card ${tour.featured ? 'featured' : ''}`} key={tour.id}><div className="tour-image"><img src={tour.image} alt={tour.title} />{tour.tag && <span>{tour.tag}</span>}</div><div className="tour-body"><div className="tour-meta"><span>{tour.category}</span><span>{tour.mode}</span></div><h2>{tour.title}</h2><p>{tour.text}</p><div className="tour-details"><span>{tour.duration}</span><strong>{tour.price}<small> / person</small></strong></div><div className="highlight-list">{tour.highlights.map(highlight => <span key={highlight}>✓ {highlight}</span>)}</div><button className={tour.dark ? 'dark-button' : 'outline-button'} onClick={() => go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}>Book this tour →</button></div></article>)}</div> : <div className="admin-empty tour-empty"><h2>No experiences found</h2><p>Try a different interest or search term, or let us design a journey around what you love.</p><button className="outline-button" onClick={() => go('/contact?intent=custom')}>Plan Your Trip</button></div>}</section><CTA go={go} /></main>
}

function PublicPagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  return <div className="public-pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} experiences</span><div><button onClick={() => onChange(page - 1)} disabled={page === 1}>Previous</button><span>Page {page} of {totalPages}</span><button onClick={() => onChange(page + 1)} disabled={page === totalPages}>Next</button></div></div>
}

function ToursV3({ go, city, category = '' }) {
  const [filter, setFilter] = useState('All experiences')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const filters = ['All experiences', 'Heritage', 'Food', 'Culture', 'Walking', 'Adventure', 'Shared', 'Private']
  useEffect(() => {
    setLoading(true)
    const parameters = new URLSearchParams({ page: String(page), page_size: '9' })
    if (city) parameters.set('city', city)
    if (search.trim()) parameters.set('search', search.trim())
    if (category) parameters.set('category', category)
    else if (filter === 'Shared' || filter === 'Private') parameters.set('mode', filter)
    else if (filter !== 'All experiences') parameters.set('category', filter)
    fetch(`${apiBaseUrl}/api/tours?${parameters}`).then(response => response.ok ? response.json() : Promise.reject()).then(data => setResults({ items: data.items.map(apiTourToUi), total: data.total })).catch(() => setResults({ items: [], total: 0 })).finally(() => setLoading(false))
  }, [filter, search, page, city, category])
  useEffect(() => { setPage(1) }, [city, category])
  const chooseFilter = (nextFilter) => { setFilter(nextFilter); setPage(1) }
  const updateSearch = (value) => { setSearch(value); setPage(1) }
  return <main className="top-space"><section className="section tours-page"><Eyebrow>{category ? 'Seasonal experiences' : city ? `Explore ${city}` : 'Find your kind of day'}</Eyebrow><h1>{category ? 'Festival Tours' : city ? `${city} Tours` : 'Curated Experiences'}</h1><p className="lead">{category ? 'Celebrate India through locally led festival experiences, cultural traditions and memorable seasonal moments.' : city ? `Browse every locally led experience currently available in ${city}.` : 'Browse local experiences by the stories you want to take home—from heritage streets and food trails to culture-led walks.'}</p><div className="tour-browser-tools"><label className="tour-search"><span className="material-symbols-outlined">search</span><input value={search} onChange={event => updateSearch(event.target.value)} placeholder="Search experiences" aria-label="Search experiences" /></label><div className="filters" aria-label="Filter experiences">{filters.map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => chooseFilter(item)}>{item}</button>)}</div></div>{loading ? <p className="lead">Loading experiences...</p> : results.items.length ? <><div className="tour-grid">{results.items.map(tour => <article className={`tour-card ${tour.featured ? 'featured' : ''}`} key={tour.id}><div className="tour-image"><img src={tour.image} alt={tour.title} />{tour.tag && <span>{tour.tag}</span>}</div><div className="tour-body"><div className="tour-meta"><span>{tour.category}</span><span>{tour.mode}</span></div><h2>{tour.title}</h2><p>{tour.text}</p><div className="tour-details"><span>{tour.duration}</span><strong>{tour.price}<small> / person</small></strong></div><div className="highlight-list">{tour.highlights.map(highlight => <span key={highlight}>✓ {highlight}</span>)}</div><button className={tour.dark ? 'dark-button' : 'outline-button'} onClick={() => go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}>Book this tour →</button></div></article>)}</div><PublicPagination page={page} total={results.total} pageSize={9} onChange={setPage} /></> : <div className="admin-empty tour-empty"><h2>No experiences found</h2><p>Try another interest or search term, or let us design a journey around what you love.</p><button className="outline-button" onClick={() => go('/contact?intent=custom')}>Plan Your Trip</button></div>}</section><CTA go={go} /></main>
}

function TripsPageV2({ go, type }) {
  const [city, setCity] = useState('Mumbai')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const tripType = tripCatalog[type]
  const selectedTripType = type === 'one-day' ? 'One-day trip' : 'Weekly trip'
  useEffect(() => {
    setLoading(true)
    const parameters = new URLSearchParams({ city, trip_type: selectedTripType, page: String(page), page_size: '6' })
    fetch(`${apiBaseUrl}/api/tours?${parameters}`).then(response => response.ok ? response.json() : Promise.reject()).then(data => setResults({ items: data.items.map(apiTourToUi), total: data.total })).catch(() => setResults({ items: [], total: 0 })).finally(() => setLoading(false))
  }, [city, selectedTripType, page])
  const selectCity = (nextCity) => { setCity(nextCity); setPage(1) }
  return <main className="top-space"><section className="section trips-page"><div className="section-heading"><Eyebrow>{tripType.eyebrow}</Eyebrow><h1>{tripType.label}</h1><p className="lead">{tripType.intro}</p></div><div className="trip-city-tabs" aria-label="Choose a city"><span>Choose a city</span>{['Mumbai', 'Delhi'].map(item => <button key={item} className={city === item ? 'selected' : ''} onClick={() => selectCity(item)}>{item}</button>)}</div><div className="trip-results-heading"><div><Eyebrow>Explore {city}</Eyebrow><h2>{city} {type === 'one-day' ? 'in a day' : 'over a week'}</h2></div><p>{type === 'one-day' ? 'Choose a complete city experience, led by a local who knows where the best stories are hiding.' : 'Each journey can be tailored around your pace, preferred stays and the experiences that matter most to you.'}</p></div>{loading ? <p className="lead">Loading trips...</p> : results.items.length ? <><div className="tour-grid trip-grid">{results.items.map(tour => <article className="tour-card" key={tour.id}><div className="tour-image"><img src={tour.image} alt={tour.title} /></div><div className="tour-body"><div className="tour-meta"><span>{tour.city}</span><span>{tour.mode}</span></div><h2>{tour.title}</h2><p>{tour.text}</p><div className="tour-details"><span>{tour.duration}</span><strong>{tour.price}<small> / person</small></strong></div><div className="highlight-list">{tour.highlights.map(highlight => <span key={highlight}>✓ {highlight}</span>)}</div><button className="outline-button" onClick={() => go(`/contact?intent=book&tour=${encodeURIComponent(tour.title)}`)}>Book this tour →</button></div></article>)}</div><PublicPagination page={page} total={results.total} pageSize={6} onChange={setPage} /></> : <div className="admin-empty trip-empty"><h2>No {selectedTripType.toLowerCase()} tours in {city} yet</h2><p>Choose another city or let us design a journey around your dates.</p><button className="outline-button" onClick={() => go('/contact?intent=custom')}>Plan Your Trip</button></div>}</section><CTA go={go} /></main>
}

const tripCatalog = {
  'one-day': {
    label: 'One-day trips',
    eyebrow: 'Make a day of it',
    intro: 'Unhurried, locally led days built around the stories, flavours and neighbourhoods that make each city unforgettable.',
    Mumbai: [
      { title: 'Mumbai City Essentials', description: 'A complete introduction to Mumbai, from the Gateway of India and Colaba to Marine Drive and the historic Fort district.', image: images.city, duration: '8 hours', price: '₹3,200', highlights: ['Gateway of India', 'Marine Drive', 'Local lunch'] },
      { title: 'South Mumbai Heritage Walk', description: 'Trace the architecture, trading stories and hidden lanes of one of Mumbai’s most evocative districts.', image: images.heritage, duration: '6 hours', price: '₹2,600', highlights: ['Kala Ghoda', 'Colonial architecture', 'Local chai'] },
      { title: 'Mumbai Street Food Trail', description: 'Taste your way through neighbourhood favourites, family-run stalls and the city’s best-loved snacks.', image: images.food, duration: '5 hours', price: '₹2,400', highlights: ['Market tasting', 'Regional flavours', 'Small groups'] },
    ],
    Delhi: [
      { title: 'Old and New Delhi Essentials', description: 'See Delhi’s contrasting worlds in one rich day, from Jama Masjid and Chandni Chowk to India Gate and Lutyens Delhi.', image: images.delhi, duration: '8 hours', price: '₹3,400', highlights: ['Old Delhi', 'India Gate', 'Private transport'] },
      { title: 'Old Delhi Food and Heritage', description: 'Wander the lanes of Shahjahanabad with a local guide, stopping for stories, street food and centuries-old landmarks.', image: images.market, duration: '6 hours', price: '₹2,700', highlights: ['Chandni Chowk', 'Jama Masjid', 'Food tastings'] },
      { title: 'Mehrauli Monuments Walk', description: 'Explore the leafy archaeological park and the layered history around Qutub Minar at a relaxed pace.', image: images.raj, duration: '5 hours', price: '₹2,500', highlights: ['Qutub Minar', 'Mehrauli park', 'Expert guide'] },
    ],
  },
  weekly: {
    label: 'Weekly trips',
    eyebrow: 'Settle in and explore',
    intro: 'Seven-day journeys that leave room for landmark moments, local encounters and the pleasure of travelling without rushing.',
    Mumbai: [
      { title: 'Mumbai and the Konkan Coast', description: 'A seven-day route from Mumbai’s lively neighbourhoods to the quiet beaches, forts and coastal kitchens of the Konkan.', image: images.mumbai, duration: '7 days', price: '₹32,500', highlights: ['Mumbai highlights', 'Coastal stays', 'Konkan cuisine'] },
      { title: 'Mumbai, Nashik and the Western Ghats', description: 'Pair the energy of Mumbai with vineyard landscapes, temple towns and gentle walks through the Western Ghats.', image: images.bicycle, duration: '7 days', price: '₹35,000', highlights: ['Mumbai city', 'Nashik vineyards', 'Hill landscapes'] },
    ],
    Delhi: [
      { title: 'Delhi and the Golden Triangle', description: 'A considered week through Delhi, Agra and Jaipur, balancing iconic monuments with local markets and relaxed evenings.', image: images.delhi, duration: '7 days', price: '₹39,500', highlights: ['Delhi heritage', 'Agra and the Taj', 'Jaipur markets'] },
      { title: 'Delhi, Agra and Rajasthan Stories', description: 'Travel from the capital to Agra and Rajasthan for palaces, craft traditions, regional cuisine and memorable stays.', image: images.gateway, duration: '7 days', price: '₹42,000', highlights: ['Old Delhi', 'Agra', 'Rajasthan culture'] },
    ],
  },
}

function TripsPage({ go, type }) {
  const [city, setCity] = useState('Mumbai')
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const tripType = tripCatalog[type]
  const selectedTripType = type === 'one-day' ? 'One-day trip' : 'Weekly trip'
  const selectCity = (nextCity) => setCity(nextCity)
  useEffect(() => {
    setLoading(true)
    const search = new URLSearchParams({ city, trip_type: selectedTripType })
    fetch(`${apiBaseUrl}/api/tours?${search}`).then(response => response.ok ? response.json() : Promise.reject()).then(data => {
      setTrips(data.map(tour => ({ ...tour, image: tour.image_url, price: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tour.price) })))
    }).catch(() => setTrips([])).finally(() => setLoading(false))
  }, [city, selectedTripType])
  return <main className="top-space"><section className="section trips-page"><div className="section-heading"><Eyebrow>{tripType.eyebrow}</Eyebrow><h1>{tripType.label}</h1><p className="lead">{tripType.intro}</p></div><div className="trip-city-tabs" aria-label="Choose a city"><span>Choose a city</span>{['Mumbai', 'Delhi'].map(item => <button key={item} className={city === item ? 'selected' : ''} onClick={() => selectCity(item)}>{item}</button>)}</div><div className="trip-results-heading"><div><Eyebrow>Explore {city}</Eyebrow><h2>{city} {type === 'one-day' ? 'in a day' : 'over a week'}</h2></div><p>{type === 'one-day' ? 'Choose a complete city experience, led by a local who knows where the best stories are hiding.' : 'Each journey can be tailored around your pace, preferred stays and the experiences that matter most to you.'}</p></div><div className="tour-grid trip-grid">{trips.map(trip => <article className="tour-card" key={trip.title}><div className="tour-image"><img src={trip.image} alt={trip.title} /></div><div className="tour-body"><div className="tour-meta"><span>⌖ {city}</span><span>{type === 'one-day' ? 'One day' : 'Weekly trip'}</span></div><h2>{trip.title}</h2><p>{trip.description}</p><div className="tour-details"><span>◷ {trip.duration}</span><strong>{trip.price}<small> / person</small></strong></div><div className="highlight-list">{trip.highlights.map(highlight => <span key={highlight}>✓ {highlight}</span>)}</div><button className="outline-button" onClick={() => go(`/contact?intent=book&tour=${encodeURIComponent(trip.title)}`)}>Book this tour →</button></div></article>)}</div></section><CTA go={go} /></main>
}

function AdminLogin({ onAuthenticated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to authenticate.')
      onAuthenticated({ token: body.access_token })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="top-space"><section className="section contact-grid"><div><Eyebrow>Private management</Eyebrow><h1>Admin Sign In</h1><p className="lead">Sign in to manage the public tours collection. This page is not shown in the site navigation.</p></div><form className="contact-form" onSubmit={submit}><h2>Welcome back</h2><label>Username<input required value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" /></label><label>Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in →'}</button>{status && <p>{status}</p>}</form></section></main>
}

function AdminHome({ session, onTourSaved, onTourDeleted }) {
  const [tours, setTours] = useState([])
  const [screen, setScreen] = useState('list')
  const [selectedTour, setSelectedTour] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const headers = { Authorization: `Bearer ${session.token}` }
  const loadTours = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, { headers })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to load tours.')
      setTours(body)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadTours() }, [])
  const removeTour = async (tour) => {
    if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`)) return
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, { method: 'DELETE', headers })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.detail || 'Unable to delete the tour.')
      }
      setTours(current => current.filter(item => item.id !== tour.id))
      onTourDeleted(tour.id)
    } catch (error) {
      setStatus(error.message)
    }
  }
  const saved = (tour) => {
    setTours(current => [tour, ...current.filter(item => item.id !== tour.id)])
    onTourSaved(tour)
    setScreen('list')
    setSelectedTour(null)
  }
  if (screen !== 'list') return <TourEditorV2 tour={selectedTour} session={session} onCancel={() => { setScreen('list'); setSelectedTour(null) }} onSaved={saved} />
  return <main className="top-space"><section className="section admin-dashboard"><div className="admin-heading"><div><Eyebrow>Private management</Eyebrow><h1>Tour Dashboard</h1><p className="lead">Add, edit, publish, or remove your experiences.</p></div><button className="primary-button" onClick={() => setScreen('create')}>Add a tour <span>→</span></button></div>{status && <p className="admin-status">{status}</p>}{loading ? <p className="lead">Loading tours…</p> : tours.length === 0 ? <div className="admin-empty"><h2>No tours yet</h2><p>Add your first tour to make it available on the website.</p><button className="outline-button" onClick={() => setScreen('create')}>Add your first tour</button></div> : <div className="admin-tour-grid">{tours.map(tour => <article className="admin-tour-card" key={tour.id}><img src={tour.image_url} alt={tour.title} /><div className="admin-card-copy"><div><span>{tour.published ? 'Published' : 'Draft'}</span><span>{tour.mode}</span></div><h2>{tour.title}</h2><p>{tour.city} · {tour.duration} · ₹{Number(tour.price).toLocaleString('en-IN')}</p></div><div className="admin-card-actions"><button onClick={() => { setSelectedTour(tour); setScreen('edit') }}>Edit</button><button className="delete-button" onClick={() => removeTour(tour)}>Delete</button></div></article>)}</div>}</section></main>
}

function TourEditor({ tour, session, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({ title: tour?.title || '', description: tour?.description || '', image_url: tour?.image_url || '', city: tour?.city || 'Mumbai', mode: tour?.mode || 'Shared', category: tour?.category || '', duration: tour?.duration || '', price: tour?.price || '', highlights: (tour?.highlights || []).join(', '), tag: tour?.tag || '', featured: tour?.featured || false, dark: tour?.dark || false, published: tour?.published ?? true }))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    const payload = { ...form, price: Number(form.price), highlights: form.highlights.split(',').map(item => item.trim()).filter(Boolean) }
    try {
      const url = tour ? `${apiBaseUrl}/api/admin/tours/${tour.id}` : `${apiBaseUrl}/api/admin/tours`
      const response = await fetch(url, { method: tour ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(payload) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to save the tour.')
      onSaved(body)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSaving(false)
    }
  }
  return <main className="top-space"><section className="section admin-editor"><div className="admin-heading"><div><Eyebrow>Private management</Eyebrow><h1>{tour ? 'Edit Tour' : 'Add a Tour'}</h1></div><button className="text-button" onClick={onCancel}>← Back to dashboard</button></div><form className="contact-form admin-form" onSubmit={submit}><label>Tour title<input required value={form.title} onChange={event => update('title', event.target.value)} /></label><label>Description<textarea required rows="4" value={form.description} onChange={event => update('description', event.target.value)} /></label><label>Image URL<input required type="url" value={form.image_url} onChange={event => update('image_url', event.target.value)} placeholder="https://..." /></label><label>City<input required value={form.city} onChange={event => update('city', event.target.value)} /></label><label>Format<select value={form.mode} onChange={event => update('mode', event.target.value)}><option>Shared</option><option>Private</option><option>Multi-day</option></select></label><label>Category<input required value={form.category} onChange={event => update('category', event.target.value)} /></label><label>Duration<input required value={form.duration} onChange={event => update('duration', event.target.value)} placeholder="3 hours" /></label><label>Price per person (₹)<input required type="number" min="1" step="1" value={form.price} onChange={event => update('price', event.target.value)} /></label><label>Highlights <small>(comma-separated)</small><input value={form.highlights} onChange={event => update('highlights', event.target.value)} /></label><label>Badge <small>(optional)</small><input value={form.tag} onChange={event => update('tag', event.target.value)} /></label><label><input type="checkbox" checked={form.featured} onChange={event => update('featured', event.target.checked)} /> Feature this tour</label><label><input type="checkbox" checked={form.dark} onChange={event => update('dark', event.target.checked)} /> Use dark booking button</label><label><input type="checkbox" checked={form.published} onChange={event => update('published', event.target.checked)} /> Publish immediately</label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : tour ? 'Update Tour →' : 'Save Tour →'}</button>{status && <p>{status}</p>}</form></section></main>
}

function Admin({ go, onTourCreated, session }) {
  const [username] = useState('admin')
  const [password, setPassword] = useState('authenticated')
  const [authenticated, setAuthenticated] = useState(true)
  const adminKey = password
  const setAdminKey = setPassword
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', image_url: '', city: 'Mumbai', mode: 'Shared', category: '', duration: '', price: '', highlights: '', tag: '', featured: false, published: true })
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setStatus('')
    setSaving(true)
    if (!authenticated) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
        const body = await response.json()
        if (!response.ok) throw new Error(body.detail || 'Unable to authenticate.')
        setAuthenticated(true)
        setStatus('Authenticated. You can now save the tour.')
      } catch (error) {
        setStatus(error.message)
      } finally {
        setSaving(false)
      }
      return
    }
    const payload = { ...form, price: Number(form.price), highlights: form.highlights.split(',').map(item => item.trim()).filter(Boolean) }
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(payload) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to save the tour.')
      onTourCreated(body)
      setForm({ title: '', description: '', image_url: '', city: 'Mumbai', mode: 'Shared', category: '', duration: '', price: '', highlights: '', tag: '', featured: false, published: true })
      setStatus('Tour saved. It is now available on the tours page.')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSaving(false)
    }
  }
  return <main className="top-space"><section className="section contact-grid"><div><Eyebrow>Private management</Eyebrow><h1>Add a Tour</h1><p className="lead">Create a new experience for the public tours collection. This page is deliberately accessible only by its direct URL and is not linked in the site navigation.</p><button className="text-button" onClick={() => go('/tours')}>← View public tours</button></div><form className="contact-form" onSubmit={submit}><h2>Tour details</h2><label>Admin key<input required type="password" value={adminKey} onChange={event => setAdminKey(event.target.value)} placeholder="Your admin key" autoComplete="current-password" /></label><label>Tour title<input required value={form.title} onChange={event => update('title', event.target.value)} placeholder="e.g. Old Delhi Food Walk" /></label><label>Description<textarea required rows="4" value={form.description} onChange={event => update('description', event.target.value)} placeholder="What guests will experience..." /></label><label>Image URL<input required type="url" value={form.image_url} onChange={event => update('image_url', event.target.value)} placeholder="https://..." /></label><label>City<input required value={form.city} onChange={event => update('city', event.target.value)} /></label><label>Format<select value={form.mode} onChange={event => update('mode', event.target.value)}><option>Shared</option><option>Private</option><option>Multi-day</option></select></label><label>Category<input required value={form.category} onChange={event => update('category', event.target.value)} placeholder="Food, Heritage, Walking..." /></label><label>Duration<input required value={form.duration} onChange={event => update('duration', event.target.value)} placeholder="3 hours" /></label><label>Price per person (₹)<input required type="number" min="1" step="1" value={form.price} onChange={event => update('price', event.target.value)} /></label><label>Highlights <small>(comma-separated)</small><input value={form.highlights} onChange={event => update('highlights', event.target.value)} placeholder="Local guide, Tastings, Small group" /></label><label>Badge <small>(optional)</small><input value={form.tag} onChange={event => update('tag', event.target.value)} placeholder="TOP RATED" /></label><label><input type="checkbox" checked={form.featured} onChange={event => update('featured', event.target.checked)} /> Feature this tour</label><label><input type="checkbox" checked={form.published} onChange={event => update('published', event.target.checked)} /> Publish immediately</label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Tour →'}</button>{status && <p className={status.startsWith('Tour saved') ? 'success' : ''}>{status}</p>}</form></section></main>
}

function Dharavi({ go }) { const items = [['eco','Living industry','Observe the $1B annual turnover ecosystem of recycling and manufacturing.'], ['palette','Kumbharwada pottery','Visit the oldest settlement of potters and see their ancient techniques.'], ['groups','Community and culture','Experience the harmonious blend of diverse cultures and faiths.'], ['volunteer_activism','Meaningful impact','A portion of every tour fee supports local community educational projects.']]; return <main className="top-space"><Hero image={images.dharavi} className="detail-hero"><div className="hero-content"><Eyebrow>Mumbai Experiences</Eyebrow><h1>Dharavi Slum Tour:<br /><em>A Local Heart-to-Heart</em></h1><p>An honest, respectful introduction to the beating heart of Mumbai.</p><div className="hero-facts"><span>★ 4.9 (124 reviews)</span><span>◷ 2 Hours</span></div></div></Hero><section className="section detail-layout"><div className="detail-content"><Eyebrow>Beyond the headlines</Eyebrow><h2>The Real Mumbai</h2><p className="lead">See the real Dharavi through the eyes of a resident. We explore recycling, pottery, and the vibrant community spirit that defines this unique landscape. Beyond the stereotypes lies a bustling economic hub where waste is transformed into resources and neighbors are family.</p><p>Our walk isn't just about observation; it's about connection. You'll witness the intricate processes of the leather industry, the delicate craftsmanship of the Kumbharwada pottery colony, and the remarkable recycling ecosystem that processes Mumbai's plastic and metal.</p><div className="experience-grid">{items.map(([icon,title,text]) => <article key={title}><span className="material-symbols-outlined">{icon}</span><p>{text}</p></article>)}</div></div><aside className="booking-card"><span>What's Included</span><h3>Walk with a local</h3><ul><li>2-hour guided walk through residential and industrial areas.</li><li>Deep local insights from guides who live in the community.</li><li>Bottled water and sanitization supplies.</li></ul><div className="price"><small>Price starts from</small><b>₹1,500</b><span>per person</span></div><button className="primary-button" onClick={() => go('/contact?tour=Dharavi%20Slum%20Tours')}>Request Booking →</button><p className="cancel">✓ Secure booking & local support<br />✓ Free cancellation up to 24h before</p></aside></section><section className="section gallery"><Eyebrow>Visual Journey</Eyebrow><h2>Moments from the Heart</h2><div className="gallery-grid"><img className="gallery-main" src={images.pottery} alt="Dharavi Pottery"/><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP1bUih96fVokDh78O1peVCT-Hg7Xu32Vmyie9vipUJd4nLBGnNidiYjFvdEkqJLIcxcBrfm7Gc2O1XFletADGQ45nmufbb0QY45y3IFrgnL8Gip-Bm_eCfTj_Ur-lXiEiBsUkdH6hmifWfbaRqRa88AvrfJV4tKGcPTMO-TB2yDok1Ou1-ENuO8BwrGg6c1fq8Vw6wJsLQfDQIkszinJgi7yEeFJ-ltXVrCNveZeUaZFdfuy70wpC2B8ecaGbRb49i4bS8v2UytY" alt="Dharavi Streets"/><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnlCgh0o-chnGKvS9f8ZNe6eID5Y-ttzDvRt3MvDy5LZNT1EdrFXrUWOoUx0jaIJPceKrMUpqUAXEIT7IGDyabPGt-Z8XixCQkUdh9Pu0G9NYows7H7qL2YIY3A_Qgb_eyyMz50ZOzZ-LZpX6II677taVlra9zznBGJfZFOVyp6GrPzgpXaCtwytNpFjki0l7unuMpJpdqVKpX-xsWuC-z0gGvVKiwjOyjJ3tvdAStK1axCOKLpo_IiyRgA0c5AqJMtFcH4GFxBY4" alt="Recycling Hub"/><img src={images.mumbai} alt="Aerial View of Mumbai"/></div></section><CTA go={go} /></main> }

function Contact() { const [sent, setSent] = useState(false); const requestedTour = new URLSearchParams(window.location.search).get('tour') || ''; return <main className="top-space"><Hero image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85" className="contact-hero"><div className="hero-content center"><Eyebrow>Get in Touch</Eyebrow><h1>Let's Plan Your Journey</h1><p>Expertly guided adventures across India, tailored to your nomadic spirit. Reach out to Raj and the team to begin your story.</p><div className="contact-links"><a href="https://wa.me/919876543210">◉ +91 98765 43210</a><a href="tel:+919876543210">☎ +91 98765 43210</a><a href="mailto:hello@nomadwanderers.in">✉ hello@nomadwanderers.in</a></div></div></Hero><section className="section contact-grid"><div><Eyebrow>We are here</Eyebrow><h2>Get in Touch with Our Team</h2><p className="lead">We're here to help you design the perfect Indian adventure. Whether you're looking for a private tour, a corporate event, or a custom itinerary, reach out and let's start the conversation.</p><div className="office-card"><b>Main Office</b><p>⌖ Colaba Causeway, Mumbai<br />Maharashtra 400001, India</p><p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true) }}><h2>Send a Message</h2><p>Fill out the form below and we'll start crafting your experience.</p><label>Your name<input required placeholder="Your full name" /></label><label>Email address<input required type="email" placeholder="you@example.com" /></label><label>I'm interested in<select defaultValue={requestedTour}><option value="" disabled>Select an experience</option><option>Mumbai City Tours</option><option>Market Tours</option><option>Heritage Walking Tours</option><option>Bicycle Tours</option><option>Dharavi Slum Tours</option><option>Custom multi-day itinerary</option></select></label><label>Preferred date<input required type="date" /></label><label>Number of travellers<select defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3-5">3–5 travellers</option><option value="6+">6+ travellers</option></select></label><label>Tell us about your trip<textarea rows="4" placeholder="Dates, group size, and anything you have in mind..." /></label><button className="primary-button" type="submit">Send Booking Request <span>→</span></button>{sent && <p className="success">Thank you! Your request has been sent. Raj will reach out shortly.</p>}</form></section><section className="newsletter"><div><Eyebrow>Community</Eyebrow><h2>Join the Nomad Community</h2><p>Get curated travel stories, seasonal guidebooks, and exclusive early access to our tours.</p></div><form onSubmit={(event) => event.preventDefault()}><input type="email" aria-label="Email address" placeholder="Your email address" /><button>Subscribe</button></form></section></main> }

function ContactFlow() {
  const [sent, setSent] = useState(false)
  const query = new URLSearchParams(window.location.search)
  const requestedTour = query.get('tour') || ''
  const intent = query.get('intent') || 'contact'
  const isCustom = intent === 'custom'
  const isBooking = intent === 'book' || Boolean(requestedTour)
  const title = isCustom ? 'Plan Your Trip' : isBooking ? 'Book Your Tour' : 'Contact Our Team'
  const description = isCustom ? 'Tell us how you like to travel and we will create a considered India itinerary around you.' : isBooking ? 'Share your preferred date and group size. Our team will confirm availability and the next steps.' : 'Questions, ideas, or a quick hello — send us a message and our local team will be glad to help.'
  const buttonText = isCustom ? 'Send Journey Request →' : isBooking ? 'Request Booking →' : 'Send Message →'
  const successMessage = isCustom ? 'Thank you! We will be in touch to shape your journey.' : isBooking ? 'Thank you! We will confirm your booking request shortly.' : 'Thank you! Your message has been sent.'
  const submit = (event) => { event.preventDefault(); setSent(true) }
  return <main className="top-space"><Hero image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85" className="contact-hero"><div className="hero-content center"><Eyebrow>{isCustom ? 'Tailored travel' : isBooking ? 'Tour booking' : 'Get in touch'}</Eyebrow><h1>{title}</h1><p>{description}</p><div className="contact-links"><a href="https://wa.me/919876543210">◉ Chat on WhatsApp</a><a href="tel:+919876543210">☎ +91 98765 43210</a><a href="mailto:hello@nomadwanderers.in">✉ hello@nomadwanderers.in</a></div></div></Hero><section className="section contact-grid"><div><Eyebrow>{isCustom ? 'Your trip, your way' : isBooking ? 'A few final details' : 'We are here'}</Eyebrow><h2>{isCustom ? 'A journey built around you.' : isBooking ? 'Reserve your place with confidence.' : 'How can we help?'}</h2><p className="lead">{isCustom ? 'Share your dates, cities, interests and travel style. We will come back with a thoughtfully paced route and clear recommendations.' : isBooking ? 'This is a booking request, not a payment. We will check the details with you before confirming anything.' : 'Use this form for general questions, partnerships, support or anything else you would like to discuss.'}</p><div className="office-card"><b>Main Office</b><p>⌖ Colaba Causeway, Mumbai<br />Maharashtra 400001, India</p><p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p></div></div><form className="contact-form journey-form" onSubmit={submit}><h2>{title}</h2><p>{isCustom ? 'The more you share, the more personal your itinerary can be.' : isBooking ? 'Your selected tour is held below for this request.' : 'We normally reply within one business day.'}</p><label>Your name<input required placeholder="Your full name" /></label><div className="form-row"><label>Email address<input required type="email" placeholder="you@example.com" /></label><label>Phone or WhatsApp<input required type="tel" placeholder="+91 98765 43210" /></label></div>{isBooking && <><label>Selected tour<input value={requestedTour || 'Tour enquiry'} readOnly /></label><div className="form-row"><label>Preferred date<input required type="date" /></label><label>Number of travellers<select defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3-5">3–5 travellers</option><option value="6+">6+ travellers</option></select></label></div><label>Anything we should know?<textarea rows="4" placeholder="Accessibility needs, celebration plans, questions or other details..." /></label></>}{isCustom && <><label>Places you would like to visit<input required placeholder="e.g. Mumbai, Delhi, Jaipur, Kerala" /></label><div className="form-row"><label>Approximate start date<input required type="date" /></label><label>Trip length<select defaultValue=""><option value="" disabled>Select duration</option><option>3–5 days</option><option>6–8 days</option><option>9–14 days</option><option>15+ days</option></select></label></div><div className="form-row"><label>Number of travellers<select defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3-5">3–5 travellers</option><option value="6+">6+ travellers</option></select></label><label>Budget per person<select defaultValue=""><option value="" disabled>Select a range</option><option>Under ₹25,000</option><option>₹25,000–₹50,000</option><option>₹50,000–₹1,00,000</option><option>₹1,00,000+</option></select></label></div><label>What would make this trip special?<textarea required rows="5" placeholder="Your interests, preferred pace, stay style, food preferences and any must-see experiences..." /></label></>}{!isBooking && !isCustom && <><label>Subject<input required placeholder="How can we help?" /></label><label>Your message<textarea required rows="6" placeholder="Tell us what you have in mind..." /></label></>}<button className="primary-button" type="submit">{buttonText}</button>{sent && <p className="success">{successMessage}</p>}</form></section></main>
}

function ContactFlowV2({ session }) {
  const [sent, setSent] = useState(false)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const query = new URLSearchParams(window.location.search)
  const requestedTour = query.get('tour') || ''
  const intent = query.get('intent') || 'contact'
  const isCustom = intent === 'custom'
  const isBooking = intent === 'book' || Boolean(requestedTour)
  const title = isCustom ? 'Plan Your Trip' : isBooking ? 'Book Your Tour' : 'Contact Our Team'
  const customerToken = session?.token || sessionStorage.getItem('nomad_user_token')
  useEffect(() => {
    if ((!isBooking && !isCustom) || !customerToken) return
    fetch(`${apiBaseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${customerToken}` } })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.detail || 'Unable to load your profile details.')
        const form = document.querySelector('.journey-form')
        if (!form) return
        form.elements.name.value = body.name || ''
        form.elements.email.value = body.email || ''
        form.elements.phone.value = body.phone || ''
      })
      .catch(error => setStatus(error.message))
  }, [customerToken, isBooking, isCustom])
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (isBooking) {
      const paymentQuery = new URLSearchParams({ tour: requestedTour || 'Tour enquiry', name: values.name, email: values.email, phone: values.phone })
      window.location.assign(`/payment?${paymentQuery}`)
      return
    }
    const payload = isCustom
      ? { name: values.name, email: values.email, phone: values.phone, destinations: values.destinations, start_date: values.start_date || null, duration: values.duration, travellers: values.travellers, budget: values.budget, interests: values.interests }
      : { name: values.name, email: values.email, phone: values.phone, subject: values.subject, message: values.message }
    try {
      const response = await fetch(`${apiBaseUrl}${isCustom ? '/api/custom-journeys' : '/api/contact-enquiries'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to send your request.')
      setSent(true)
      event.currentTarget.reset()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="top-space"><Hero image="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2000&q=85" className="contact-hero"><div className="hero-content center"><Eyebrow>{isCustom ? 'Tailored travel' : isBooking ? 'Tour booking' : 'Get in touch'}</Eyebrow><h1>{title}</h1><p>{isCustom ? 'Tell us how you like to travel and we will create a considered India itinerary around you.' : isBooking ? 'Share your preferred date and group size. Our team will confirm availability and the next steps.' : 'Questions, ideas, or a quick hello — send us a message and our local team will be glad to help.'}</p><div className="contact-links"><a href="https://wa.me/919876543210">◉ Chat on WhatsApp</a><a href="tel:+919876543210">☎ +91 98765 43210</a><a href="mailto:hello@nomadwanderers.in">✉ hello@nomadwanderers.in</a></div></div></Hero><section className="section contact-grid"><div><Eyebrow>{isCustom ? 'Your trip, your way' : isBooking ? 'A few final details' : 'We are here'}</Eyebrow><h2>{isCustom ? 'A journey built around you.' : isBooking ? 'Reserve your place with confidence.' : 'How can we help?'}</h2><p className="lead">{isCustom ? 'Share your dates, cities, interests and travel style. We will return with a thoughtfully paced route and clear recommendations.' : isBooking ? 'This is a booking request, not a payment. We will check the details with you before confirming anything.' : 'Use this form for general questions, partnerships, support or anything else you would like to discuss.'}</p><div className="office-card"><b>Main Office</b><p>⌖ Colaba Causeway, Mumbai<br />Maharashtra 400001, India</p><p>◷ Monday — Friday: 9:00 AM – 6:00 PM IST</p></div></div><form className="contact-form journey-form" onSubmit={submit}><h2>{title}</h2><p>{isCustom ? 'The more you share, the more personal your itinerary can be.' : isBooking ? 'Your selected tour is included in this request.' : 'We normally reply within one business day.'}</p><label>Your name<input name="name" required placeholder="Your full name" /></label><div className="form-row"><label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label><label>Phone or WhatsApp<input name="phone" required type="tel" placeholder="+91 98765 43210" /></label></div>{isBooking && <><label>Selected tour<input value={requestedTour || 'Tour enquiry'} readOnly /></label><div className="form-row"><label>Preferred date<input name="date" required type="date" /></label><label>Number of travellers<select name="travellers" defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3-5">3–5 travellers</option><option value="6+">6+ travellers</option></select></label></div><label>Anything we should know?<textarea name="message" rows="4" placeholder="Accessibility needs, celebration plans, questions or other details..." /></label></>}{isCustom && <><label>Places you would like to visit<input name="destinations" required placeholder="e.g. Mumbai, Delhi, Jaipur, Kerala" /></label><div className="form-row"><label>Approximate start date<input name="start_date" type="date" /></label><label>Trip length<select name="duration" required defaultValue=""><option value="" disabled>Select duration</option><option>3–5 days</option><option>6–8 days</option><option>9–14 days</option><option>15+ days</option></select></label></div><div className="form-row"><label>Number of travellers<select name="travellers" defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3-5">3–5 travellers</option><option value="6+">6+ travellers</option></select></label><label>Budget per person<select name="budget" required defaultValue=""><option value="" disabled>Select a range</option><option>Under ₹25,000</option><option>₹25,000–₹50,000</option><option>₹50,000–₹1,00,000</option><option>₹1,00,000+</option></select></label></div><label>What would make this trip special?<textarea name="interests" required rows="5" placeholder="Your interests, preferred pace, stay style, food preferences and must-see experiences..." /></label></>}{!isBooking && !isCustom && <><label>Subject<input name="subject" required placeholder="How can we help?" /></label><label>Your message<textarea name="message" required rows="6" placeholder="Tell us what you have in mind..." /></label></>}<button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Sending…' : isCustom ? 'Send Journey Request →' : isBooking ? 'Request Booking →' : 'Send Message →'}</button>{sent && <p className="success">Thank you! We have received your request.</p>}{status && <p className="admin-status">{status}</p>}</form></section></main>
}

function AdminDashboardV2({ session, onSessionExpired, onManageTeam, onTourSaved, onTourDeleted }) {
  const [activeTab, setActiveTab] = useState('tours')
  const [tours, setTours] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [journeys, setJourneys] = useState([])
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [report, setReport] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null)
  const [totals, setTotals] = useState({ tours: 0, enquiries: 0, journeys: 0, payments: 0, bookings: 0, reports: 0 })
  const [screen, setScreen] = useState('list')
  const [selectedTour, setSelectedTour] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const headers = { Authorization: `Bearer ${session.token}` }
  const pageSize = 6
  const loadDashboard = async () => {
    setLoading(true)
    setStatus('')
    try {
      const parameters = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (search.trim()) parameters.set('search', search.trim())
      const paths = ['/api/admin/tours', '/api/admin/contact-enquiries', '/api/admin/custom-journeys', '/api/admin/demo-payments'].map(path => `${path}?${parameters}`)
      paths.push('/api/staff/bookings')
      paths.push('/api/admin/reports')
      paths.push('/api/admin/me')
      const responses = await Promise.all(paths.map(path => fetch(`${apiBaseUrl}${path}`, { headers })))
      const bodies = await Promise.all(responses.map(response => response.json()))
      if (responses.some(response => response.status === 401)) {
        onSessionExpired()
        return
      }
      if (responses.some(response => !response.ok)) throw new Error(bodies.find(body => body.detail)?.detail || 'Unable to load the dashboard.')
      setTours(bodies[0].items); setEnquiries(bodies[1].items); setJourneys(bodies[2].items); setPayments(bodies[3].items); setBookings(bodies[4]); setReport(bodies[5]); setAdminProfile(bodies[6])
      setTotals({ tours: bodies[0].total, enquiries: bodies[1].total, journeys: bodies[2].total, payments: bodies[3].total, bookings: bodies[4].length, reports: 1 })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadDashboard() }, [page, search])
  useEffect(() => { setPage(1) }, [activeTab, search])
  const recordsByTab = { tours, enquiries, journeys, payments, bookings, reports: report ? [report] : [] }
  const currentRecords = recordsByTab[activeTab]
  const totalItems = totals[activeTab]
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRecords = activeTab === 'bookings' ? currentRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize) : currentRecords
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])
  const changeTab = (tab) => { setActiveTab(tab); setSearch(''); setPage(1) }
  const saved = (tour) => { setTours(current => [tour, ...current.filter(item => item.id !== tour.id)]); onTourSaved(tour); setScreen('list'); setSelectedTour(null) }
  const removeTour = async (tour) => {
    if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`)) return
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, { method: 'DELETE', headers })
      if (!response.ok) throw new Error('Unable to delete the tour.')
      setTours(current => current.filter(item => item.id !== tour.id)); onTourDeleted(tour.id)
    } catch (error) { setStatus(error.message) }
  }
  const updateBooking = async (booking, changes) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff/bookings/${booking.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to update booking.')
      setBookings(current => current.map(item => item.id === body.id ? body : item))
    } catch (error) { setStatus(error.message) }
  }
  if (screen !== 'list') return <TourEditorV2 tour={selectedTour} session={session} onCancel={() => { setScreen('list'); setSelectedTour(null) }} onSaved={saved} />
  const tabs = [['tours', 'Tours', totals.tours], ['bookings', 'Bookings', totals.bookings], ['enquiries', 'Enquiries', totals.enquiries], ['journeys', 'Custom journeys', totals.journeys], ['payments', 'Demo payments', totals.payments], ['reports', 'Reports', null]]
  const emptyLabel = activeTab === 'tours' ? 'tours' : activeTab === 'bookings' ? 'bookings' : activeTab === 'enquiries' ? 'contact enquiries' : activeTab === 'journeys' ? 'custom journeys' : activeTab === 'payments' ? 'demo payments' : 'report data'
  return <main className="top-space"><section className="section admin-dashboard"><div className="admin-heading"><div><Eyebrow>Private management</Eyebrow><h1>Welcome back, {adminProfile?.name || 'Administrator'}.</h1><p className="lead">Manage tours, bookings, payments, traveller requests, staff access, and operational reporting from one place.</p></div><div className="admin-card-actions"><button onClick={onManageTeam}>Team access</button>{activeTab === 'tours' && <button className="primary-button" onClick={() => setScreen('create')}>Add a tour →</button>}</div></div><div className="admin-tabs">{tabs.map(([id, label, count]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => changeTab(id)}>{label}{count !== null && <span>{count}</span>}</button>)}</div>{status && <p className="admin-status">{status}</p>}{loading ? <p className="lead">Loading dashboard...</p> : <>{activeTab !== 'reports' && <AdminCollectionToolbar value={search} onChange={setSearch} label={tabs.find(([id]) => id === activeTab)?.[1]} count={totalItems} />}<div className="admin-collection-content">{pageRecords.length ? activeTab === 'tours' ? <div className="admin-tour-grid">{pageRecords.map(tour => <article className="admin-tour-card" key={tour.id}><img src={tour.image_url} alt={tour.title} /><div className="admin-card-copy"><div><span>{tour.published ? 'Published' : 'Draft'}</span><span>{tour.mode}</span><span>{tour.trip_type}</span></div><h2>{tour.title}</h2><p>{tour.city} · {tour.duration} · ₹{Number(tour.price).toLocaleString('en-IN')}</p></div><div className="admin-card-actions"><button onClick={() => { setSelectedTour(tour); setScreen('edit') }}>Edit</button><button className="delete-button" onClick={() => removeTour(tour)}>Delete</button></div></article>)}</div> : activeTab === 'reports' ? <AdminReportPanel report={report} /> : activeTab === 'bookings' ? <AdminBookingList bookings={pageRecords} onUpdate={updateBooking} /> : activeTab === 'enquiries' ? <AdminRequestList type="enquiries" items={pageRecords} headers={headers} onChanged={setEnquiries} /> : activeTab === 'journeys' ? <AdminRequestList type="journeys" items={pageRecords} headers={headers} onChanged={setJourneys} /> : <AdminPaymentList payments={pageRecords} /> : <div className="admin-empty"><h2>No {emptyLabel} found</h2><p>{search ? 'Try another search term.' : `New ${emptyLabel} will appear here.`}</p></div>}</div>{activeTab !== 'reports' && <AdminPagination page={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onChange={setPage} />}</>}</section></main>
}

function AdminReportPanel({ report }) {
  if (!report) return <div className="admin-empty"><h2>Report data is loading</h2><p>Please try again in a moment.</p></div>
  const paymentTotal = Number(report.demo_payment_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  return <section className="admin-report-panel"><div className="admin-report-heading"><div><span className="eyebrow">Business overview</span><h2>Travel operations at a glance</h2><p>Live counts from customer accounts, bookings, confirmations, and demo payment records.</p></div><span className="material-symbols-outlined">insights</span></div><div className="admin-report-grid"><article><span className="material-symbols-outlined">groups</span><small>Travellers</small><b>{report.customers}</b><p>Registered customer accounts</p></article><article><span className="material-symbols-outlined">confirmation_number</span><small>Total bookings</small><b>{report.bookings}</b><p>All saved travel requests</p></article><article><span className="material-symbols-outlined">verified</span><small>Confirmed trips</small><b>{report.confirmed_bookings}</b><p>Ready for operations</p></article><article><span className="material-symbols-outlined">payments</span><small>Demo payments</small><b>₹{paymentTotal}</b><p>Recorded payment value</p></article></div><p className="admin-report-note"><span className="material-symbols-outlined">info</span>Payment data is marked as demo until a live payment provider is connected.</p></section>
}

function AdminCollectionToolbar({ value, onChange, label, count }) {
  return <div className="admin-collection-toolbar"><label><span className="material-symbols-outlined">search</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={`Search ${label.toLowerCase()}...`} aria-label={`Search ${label}`} /></label><span>{count} result{count === 1 ? '' : 's'}</span></div>
}

function AdminPagination({ page, totalPages, totalItems, pageSize, onChange }) {
  if (totalItems === 0) return null
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalItems)
  return <div className="admin-pagination"><span>Showing {first}–{last} of {totalItems}</span><div><button onClick={() => onChange(page - 1)} disabled={page === 1}>Previous</button><span>Page {page} of {totalPages}</span><button onClick={() => onChange(page + 1)} disabled={page === totalPages}>Next</button></div></div>
}

function TourEditorV2({ tour, session, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: tour?.title || '', description: tour?.description || '', image_url: tour?.image_url || '',
    city: tour?.city || 'Mumbai', mode: tour?.mode || 'Shared', trip_type: tour?.trip_type || 'One-day trip',
    category: tour?.category || '', duration: tour?.duration || '', price: tour?.price || '',
    capacity: tour?.capacity || 20, schedule_type: tour?.schedule_type || 'Specific date', departure_date: tour?.departure_date || '', start_time: tour?.start_time || '', guide_name: tour?.guide_name || '',
    highlights: (tour?.highlights || []).join(', '), tag: tour?.tag || '', featured: tour?.featured || false,
    dark: tour?.dark || false, published: tour?.published ?? true,
  }))
  const [imageFile, setImageFile] = useState(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    const payload = {
      ...form,
      price: Number(form.price),
      capacity: Number(form.capacity),
      departure_date: form.schedule_type === 'Daily' ? null : form.departure_date || null,
      start_time: form.start_time || null,
      guide_name: form.guide_name.trim() || null,
      highlights: form.highlights.split(',').map(item => item.trim()).filter(Boolean),
    }
    try {
      if (imageFile) {
        const uploadData = new FormData()
        uploadData.append('image', imageFile)
        const uploadResponse = await fetch(`${apiBaseUrl}/api/admin/tour-images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
          body: uploadData,
        })
        const uploadBody = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadBody.detail || 'Unable to upload the tour image.')
        payload.image_url = uploadBody.image_url
      } else if (!tour) {
        throw new Error('Please choose a tour image.')
      }
      const response = await fetch(`${apiBaseUrl}/api/admin/tours${tour ? `/${tour.id}` : ''}`, {
        method: tour ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(payload),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Unable to save the tour.')
      onSaved(body)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setSaving(false)
    }
  }
  return <main className="top-space"><section className="section admin-editor"><div className="admin-heading"><div><Eyebrow>Private management</Eyebrow><h1>{tour ? 'Edit tour' : 'Add a tour'}</h1><p className="lead">Add every detail travellers need to make a confident booking.</p></div><button className="text-button" onClick={onCancel}>Back to dashboard</button></div><form className="contact-form admin-form" onSubmit={submit}><label>Tour title<input required value={form.title} onChange={event => update('title', event.target.value)} /></label><label>City<select value={form.city} onChange={event => update('city', event.target.value)}><option>Mumbai</option><option>Delhi</option><option>Hyderabad</option></select></label><label>Trip type<select value={form.trip_type} onChange={event => update('trip_type', event.target.value)}><option>Morning trip</option><option>Evening trip</option><option>Half-day trip</option><option>One-day trip</option><option>Weekly trip</option><option>Festival special</option></select></label><label>Experience mode<input required value={form.mode} onChange={event => update('mode', event.target.value)} placeholder="Car + Walking, Bicycle, Shared..." /></label><label>Description<textarea required rows="4" value={form.description} onChange={event => update('description', event.target.value)} /></label><label>Tour image<input required={!tour} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImageFile(event.target.files?.[0] || null)} /><small>{imageFile ? imageFile.name : tour ? 'Leave empty to keep the current image.' : 'JPEG, PNG, or WebP, up to 5 MB.'}</small></label><label>Category<input required value={form.category} onChange={event => update('category', event.target.value)} placeholder="City Sightseeing, Food & Culture..." /></label><label>Duration<input required value={form.duration} onChange={event => update('duration', event.target.value)} placeholder="4 hours" /></label><label>Price per person (INR)<input required type="number" min="1" step="1" value={form.price} onChange={event => update('price', event.target.value)} /></label><label>Group capacity<input required type="number" min="1" max="500" value={form.capacity} onChange={event => update('capacity', event.target.value)} /></label><label>Availability<select value={form.schedule_type} onChange={event => update('schedule_type', event.target.value)}><option>Daily</option><option>Specific date</option></select><small>Use Daily for recurring departures; otherwise select the tour date below.</small></label><label>Start time<input required type="time" value={form.start_time} onChange={event => update('start_time', event.target.value)} /></label>{form.schedule_type === 'Specific date' && <label>Departure date<input required type="date" value={form.departure_date} onChange={event => update('departure_date', event.target.value)} /></label>}<label>Lead guide <small>(optional)</small><input value={form.guide_name} onChange={event => update('guide_name', event.target.value)} placeholder="Aarav Mehta" /></label><label>Highlights <small>(comma-separated)</small><input value={form.highlights} onChange={event => update('highlights', event.target.value)} placeholder="Gateway of India, Marine Drive..." /></label><label>Badge <small>(optional)</small><input value={form.tag} onChange={event => update('tag', event.target.value)} placeholder="Best Seller" /></label><label><input type="checkbox" checked={form.featured} onChange={event => update('featured', event.target.checked)} /> Feature this tour</label><label><input type="checkbox" checked={form.dark} onChange={event => update('dark', event.target.checked)} /> Use dark booking button</label><label><input type="checkbox" checked={form.published} onChange={event => update('published', event.target.checked)} /> Publish immediately</label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : tour ? 'Update tour' : 'Save tour'}</button>{status && <p>{status}</p>}</form></section></main>
}

function AdminDashboard({ session, onTourSaved, onTourDeleted }) {
  const [activeTab, setActiveTab] = useState('tours')
  const [tours, setTours] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [journeys, setJourneys] = useState([])
  const [payments, setPayments] = useState([])
  const [screen, setScreen] = useState('list')
  const [selectedTour, setSelectedTour] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const headers = { Authorization: `Bearer ${session.token}` }
  const loadDashboard = async () => { setLoading(true); setStatus(''); try { const responses = await Promise.all(['/api/admin/tours', '/api/admin/contact-enquiries', '/api/admin/custom-journeys', '/api/admin/demo-payments'].map(path => fetch(`${apiBaseUrl}${path}`, { headers }))); const bodies = await Promise.all(responses.map(response => response.json())); if (responses.some(response => !response.ok)) throw new Error(bodies.find(body => body.detail)?.detail || 'Unable to load the dashboard.'); setTours(bodies[0]); setEnquiries(bodies[1]); setJourneys(bodies[2]); setPayments(bodies[3]); } catch (error) { setStatus(error.message) } finally { setLoading(false) } }
  useEffect(() => { loadDashboard() }, [])
  const saved = (tour) => { setTours(current => [tour, ...current.filter(item => item.id !== tour.id)]); onTourSaved(tour); setScreen('list'); setSelectedTour(null) }
  const removeTour = async (tour) => { if (!window.confirm(`Delete “${tour.title}”? This cannot be undone.`)) return; try { const response = await fetch(`${apiBaseUrl}/api/admin/tours/${tour.id}`, { method: 'DELETE', headers }); if (!response.ok) throw new Error('Unable to delete the tour.'); setTours(current => current.filter(item => item.id !== tour.id)); onTourDeleted(tour.id) } catch (error) { setStatus(error.message) } }
  if (screen !== 'list') return <TourEditorV2 tour={selectedTour} session={session} onCancel={() => { setScreen('list'); setSelectedTour(null) }} onSaved={saved} />
  const tabs = [['tours', 'Tours', tours.length], ['enquiries', 'Enquiries', enquiries.length], ['journeys', 'Custom journeys', journeys.length], ['payments', 'Demo payments', payments.length]]
  return <main className="top-space"><section className="section admin-dashboard"><div className="admin-heading"><div><Eyebrow>Private management</Eyebrow><h1>Admin Dashboard</h1><p className="lead">Manage tours, traveller enquiries and tailor-made journeys from one place.</p></div>{activeTab === 'tours' && <button className="primary-button" onClick={() => setScreen('create')}>Add a tour →</button>}</div><div className="admin-tabs">{tabs.map(([id, label, count]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}<span>{count}</span></button>)}</div>{status && <p className="admin-status">{status}</p>}{loading ? <p className="lead">Loading dashboard…</p> : activeTab === 'tours' ? tours.length === 0 ? <div className="admin-empty"><h2>No tours yet</h2><p>Add your first tour to make it available on the website.</p><button className="outline-button" onClick={() => setScreen('create')}>Add your first tour</button></div> : <div className="admin-tour-grid">{tours.map(tour => <article className="admin-tour-card" key={tour.id}><img src={tour.image_url} alt={tour.title} /><div className="admin-card-copy"><div><span>{tour.published ? 'Published' : 'Draft'}</span><span>{tour.mode}</span><span>{tour.trip_type}</span></div><h2>{tour.title}</h2><p>{tour.city} · {tour.duration} · ₹{Number(tour.price).toLocaleString('en-IN')}</p></div><div className="admin-card-actions"><button onClick={() => { setSelectedTour(tour); setScreen('edit') }}>Edit</button><button className="delete-button" onClick={() => removeTour(tour)}>Delete</button></div></article>)}</div> : activeTab === 'enquiries' ? <AdminRequestList type="enquiries" items={enquiries} headers={headers} onChanged={setEnquiries} /> : activeTab === 'journeys' ? <AdminRequestList type="journeys" items={journeys} headers={headers} onChanged={setJourneys} /> : <AdminPaymentList payments={payments} />}</section></main>
}

function AdminBookingList({ bookings, onUpdate }) {
  return <div className="admin-request-list">{bookings.map(booking => <article className="admin-request-card" key={booking.id}><div className="request-summary"><div><span className="request-type">Booking #{booking.id} · {booking.booking_status}</span><h2>{booking.tour_title}</h2><p>{booking.customer_name} · {booking.customer_email}</p><p>{booking.travel_date} · {booking.travellers} travellers</p></div><small>Payment: {booking.payment_status}</small></div><div className="admin-card-actions"><button onClick={() => onUpdate(booking, { booking_status: 'confirmed' })}>Confirm</button><button onClick={() => onUpdate(booking, { booking_status: 'completed' })}>Complete</button><button onClick={() => onUpdate(booking, { payment_status: 'paid' })}>Mark paid</button><button className="delete-button" onClick={() => onUpdate(booking, { booking_status: 'cancelled' })}>Cancel</button></div></article>)}</div>
}

function AdminPaymentList({ payments }) {
  return payments.length === 0 ? <div className="admin-empty"><h2>No demo payments yet</h2><p>Completed dummy checkout payments will appear here for review.</p></div> : <div className="admin-request-list">{payments.map(payment => <article className="admin-request-card" key={payment.id}><div className="request-summary"><div><span className="request-type">Demo payment · {payment.status}</span><h2>{payment.tour_title}</h2><a href={`mailto:${payment.email}`}>{payment.name} · {payment.email}</a><a href={`tel:${payment.phone}`}>{payment.phone}</a></div><small>{new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><div className="request-details"><p><b>Amount:</b> ₹{Number(payment.amount).toLocaleString('en-IN')} · <b>Method:</b> {payment.payment_method.replace('_', ' ')}</p><p><b>Reference:</b> {payment.transaction_reference}</p><p>This is a simulated payment record. No money was collected.</p></div></article>)}</div>
}

function AdminRequestList({ type, items, headers, onChanged }) {
  const isJourney = type === 'journeys'
  const resource = isJourney ? 'custom-journeys' : 'contact-enquiries'
  const updateItem = async (item, changes) => { const response = await fetch(`${apiBaseUrl}/api/admin/${resource}/${item.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }); const body = await response.json(); if (!response.ok) throw new Error(body.detail || 'Unable to update request.'); onChanged(current => current.map(entry => entry.id === item.id ? body : entry)) }
  const deleteItem = async (item) => { if (!window.confirm('Delete this request? This cannot be undone.')) return; const response = await fetch(`${apiBaseUrl}/api/admin/${resource}/${item.id}`, { method: 'DELETE', headers }); if (!response.ok) throw new Error('Unable to delete request.'); onChanged(current => current.filter(entry => entry.id !== item.id)) }
  return items.length === 0 ? <div className="admin-empty"><h2>No {isJourney ? 'custom journeys' : 'contact enquiries'} yet</h2><p>New traveller requests will appear here as soon as they are submitted.</p></div> : <div className="admin-request-list">{items.map(item => <AdminRequestCard key={item.id} item={item} isJourney={isJourney} onSave={updateItem} onDelete={deleteItem} />)}</div>
}

function AdminRequestCard({ item, isJourney, onSave, onDelete }) {
  const [status, setStatus] = useState(item.status)
  const [notes, setNotes] = useState(item.admin_notes || '')
  const [quote, setQuote] = useState(item.quote || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const save = async () => { setSaving(true); setMessage(''); try { await onSave(item, isJourney ? { status, admin_notes: notes, quote } : { status, admin_notes: notes }); setMessage('Saved.') } catch (error) { setMessage(error.message) } finally { setSaving(false) } }
  return <article className="admin-request-card"><div className="request-summary"><div><span className="request-type">{isJourney ? 'Custom journey' : 'Contact enquiry'}</span><h2>{item.name}</h2><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></div><small>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div>{isJourney ? <div className="request-details"><p><b>Destinations:</b> {item.destinations}</p><p><b>Timing:</b> {item.start_date || 'Flexible'} · {item.duration}</p><p><b>Travellers:</b> {item.travellers} · <b>Budget:</b> {item.budget}</p><p><b>Interests:</b> {item.interests}</p></div> : <div className="request-details"><p><b>{item.subject}</b></p><p>{item.message}</p></div>}<div className="request-admin-fields"><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="quoted">Quoted</option><option value="closed">Closed</option></select></label>{isJourney && <label>Quote<textarea rows="3" value={quote} onChange={event => setQuote(event.target.value)} placeholder="Price, itinerary or quote details..." /></label>}<label>Admin notes<textarea rows="3" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Private follow-up notes..." /></label></div><div className="request-actions"><button className="primary-button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button className="delete-button" onClick={() => onDelete(item)}>Delete</button>{message && <span>{message}</span>}</div></article>
}

function Footer({ go }) { return <footer className="site-footer"><div><button className="brand" onClick={() => go('/')}>Nomad Wanderers</button><p>Experience Mumbai's soul through expert eyes. Ethical, professional, and authentic tours since 2012.</p></div><div><b>Explore</b><button onClick={() => go('/tours')}>Tours</button><button onClick={() => go('/')}>Our Story</button><button onClick={() => go('/contact')}>Contact</button></div><div><b>Contact</b><a href="mailto:hello@nomadwanderers.in">hello@nomadwanderers.in</a><a href="tel:+919876543210">+91 98765 43210</a><span>Colaba Causeway, Mumbai</span><div className="footer-socials"><a href="https://www.facebook.com/mudavath.ramesh.841066/" target="_blank" rel="noreferrer" aria-label="Follow Nomad Wanderers on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.04C6.48 2.04 2 6.52 2 12.04c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.19 2.24.19V8.6H15.2c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.89h-2.33v6.99C18.34 21.17 22 17.03 22 12.04c0-5.52-4.48-10-10-10Z" /></svg></a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Follow Nomad Wanderers on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm-.17 2A3.03 3.03 0 0 0 4 7.03v9.94A3.03 3.03 0 0 0 7.03 20h9.94A3.03 3.03 0 0 0 20 16.97V7.03A3.03 3.03 0 0 0 16.97 4H7.03Zm9.25 1.5a1.22 1.22 0 1 1 0 2.44 1.22 1.22 0 0 1 0-2.44ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg></a></div></div><small>© 2026 Nomad Wanderers. Made for meaningful journeys.</small></footer> }

export default App
