import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdClose, MdPhone, MdPerson, MdShield, MdLogout,
  MdAccessTime, MdEdit, MdSave, MdLock, MdVisibility,
  MdVisibilityOff, MdArrowBack, MdLocationOn, MdMyLocation,
  MdHome, MdLocalDrink, MdAttachMoney, MdEmail, MdLink, MdBusiness, MdLocationCity
} from 'react-icons/md'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../contexts/AuthContext'
import { updateUserProfile } from '../services/authService'
import { getCustomerById, updateCustomer } from '../services/customerService'
import toast from 'react-hot-toast'

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ClickMarker = ({ onLocationSelect }) => {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng) } })
  return null
}

/* ─── Role theme config ─────────────────────────────────────── */
const roleMeta = {
  admin: {
    label: 'Administrator',
    color: 'text-dairy-green-400',
    bg: 'bg-dairy-green-900/40',
    border: 'border-dairy-green-700/50',
    avatarBg: 'bg-dairy-green-700',
    badge: 'bg-dairy-green-800 text-dairy-green-200',
    inputFocus: 'focus:border-dairy-green-500 focus:ring-dairy-green-500/20',
    saveBg: 'bg-dairy-green-700 hover:bg-dairy-green-600',
    icon: <MdShield className="text-lg" />,
  },
  customer: {
    label: 'Customer',
    color: 'text-blue-400',
    bg: 'bg-blue-900/40',
    border: 'border-blue-700/50',
    avatarBg: 'bg-blue-700',
    badge: 'bg-blue-800 text-blue-200',
    inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
    saveBg: 'bg-blue-700 hover:bg-blue-600',
    icon: <MdPerson className="text-lg" />,
  },
  agent: {
    label: 'Delivery Agent',
    color: 'text-amber-400',
    bg: 'bg-amber-900/40',
    border: 'border-amber-700/50',
    avatarBg: 'bg-amber-700',
    badge: 'bg-amber-800 text-amber-200',
    inputFocus: 'focus:border-amber-500 focus:ring-amber-500/20',
    saveBg: 'bg-amber-700 hover:bg-amber-600',
    icon: <MdPerson className="text-lg" />,
  },
}

/* ─── Helpers ───────────────────────────────────────────────── */
const parseAddress = (addrStr) => {
  if (!addrStr) return {}
  const p = addrStr.split(',').map(s => s.trim())
  if (p.length < 4) return { street: addrStr }
  const pincode = p.pop() || ''
  const country = p.pop() || 'India'
  const state = p.pop() || ''
  const city = p.pop() || ''
  const landmark = p.length > 1 ? p.pop() : ''
  const street = p.join(', ') || ''
  return { pincode, country, state, city, landmark, street }
}

const buildAddress = ({ street, landmark, city, state, country, pincode }) =>
  [street, landmark, city, state, country, pincode].filter(Boolean).join(', ')

const formatPhone = (phone) => {
  if (!phone) return '—'
  return phone.replace(/(\d{5})(\d{5})/, '+91 $1 $2')
}

const formatMl = (ml) => {
  if (!ml) return '—'
  return ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`
}

/* ─── Info Row (view mode) ──────────────────────────────────── */
const InfoRow = ({ icon, label, value, meta, linkHref }) => (
  <div className={`flex items-start gap-3 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
    <span className={`text-xl ${meta.color} flex-shrink-0 mt-0.5`}>{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      {linkHref
        ? <a href={linkHref} target="_blank" rel="noreferrer" className={`text-sm font-semibold ${meta.color} hover:underline truncate block`}>{value || '—'}</a>
        : <p className="text-sm text-slate-200 font-semibold break-words">{value || <span className="text-slate-500 font-normal italic">Not set</span>}</p>
      }
    </div>
  </div>
)

/* ─── Section Header ────────────────────────────────────────── */
const SectionHeader = ({ children }) => (
  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">{children}</p>
)

/* ─── VIEW MODE ─────────────────────────────────────────────── */
const ViewProfile = ({ user, customerData, meta, loading, onEdit, onLogout }) => {
  const memberSince = () => {
    if (!user?.createdAt) return null
    const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
    if (isNaN(date)) return null
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const since = memberSince()
  const isCustomer = user?.role === 'customer'

  const mapsUrl = customerData?.locationUrl
    || (customerData?.latitude && customerData?.longitude
      ? `https://maps.google.com/?q=${customerData.latitude},${customerData.longitude}`
      : null)

  return (
    <div className="p-5 overflow-y-auto max-h-[80vh]">
      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className={`relative w-20 h-20 rounded-2xl ${meta.avatarBg} flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
          <button
            onClick={onEdit}
            title="Edit Profile"
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200 shadow-md"
          >
            <MdEdit className="text-sm" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">{user?.name || 'Unknown User'}</h2>
        <span className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${meta.badge}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2.5">
          <SectionHeader>Account Info</SectionHeader>
          <InfoRow icon={<MdPhone />} label="Phone Number" value={formatPhone(user?.phone)} meta={meta} />
          {user?.email && <InfoRow icon={<MdEmail />} label="Email" value={user.email} meta={meta} />}
          {!user?.email && isCustomer && <InfoRow icon={<MdEmail />} label="Email" value={null} meta={meta} />}
          {user?.role === 'admin' && (
            <>
              <InfoRow icon={<MdBusiness />} label="Company Name" value={user?.companyName} meta={meta} />
              <InfoRow icon={<MdLocationCity />} label="Company Location" value={user?.companyLocation} meta={meta} />
            </>
          )}
          <InfoRow icon={<MdShield />} label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—'} meta={meta} />
          {since && <InfoRow icon={<MdAccessTime />} label="Member Since" value={since} meta={meta} />}

          {isCustomer && customerData && (
            <>
              <SectionHeader>Delivery Details</SectionHeader>
              <InfoRow icon={<MdHome />} label="Delivery Address" value={customerData.address} meta={meta} />


              <SectionHeader>Location</SectionHeader>
              {customerData.latitude && customerData.longitude ? (
                <div className={`p-3 rounded-xl ${meta.bg} border ${meta.border} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <MdLocationOn className={`text-xl ${meta.color}`} />
                    <div>
                      <p className="text-xs text-slate-500 font-medium">GPS Coordinates</p>
                      <p className="text-sm text-slate-200 font-semibold">
                        {customerData.latitude.toFixed(6)}, {customerData.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer"
                      className={`flex items-center gap-1.5 text-xs ${meta.color} hover:underline`}>
                      <MdLink />View on Google Maps
                    </a>
                  )}
                </div>
              ) : customerData.locationUrl ? (
                <InfoRow icon={<MdLink />} label="Location URL" value={customerData.locationUrl} meta={meta} linkHref={customerData.locationUrl} />
              ) : (
                <InfoRow icon={<MdLocationOn />} label="GPS Location" value={null} meta={meta} />
              )}
            </>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-5 flex gap-2">
        <button
          onClick={onEdit}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${meta.saveBg} text-white transition-all duration-200 font-semibold text-sm`}
        >
          <MdEdit className="text-base" />
          Edit Profile
        </button>
        <button
          onClick={onLogout}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-800/60 hover:text-white transition-all duration-200 font-semibold text-sm"
        >
          <MdLogout className="text-base" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

/* ─── INPUT COMPONENT ───────────────────────────────────────── */
const Field = ({ label, icon, error, children }) => (
  <div>
    <label className="block text-xs text-slate-400 font-medium mb-1.5">
      {icon && <span className="inline mr-1.5">{icon}</span>}
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
)

/* ─── EDIT MODE ─────────────────────────────────────────────── */
const EditProfile = ({ user, customerData, meta, onBack, onSaved }) => {
  const { updateUser } = useAuth()
  const isCustomer = user?.role === 'customer'

  // Base fields
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [companyName, setCompanyName] = useState(user?.companyName || '')
  const [companyLocation, setCompanyLocation] = useState(user?.companyLocation || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Customer-specific fields
  const parsed = parseAddress(customerData?.address)
  const [street, setStreet] = useState(parsed.street || '')
  const [landmark, setLandmark] = useState(parsed.landmark || '')
  const [city, setCity] = useState(parsed.city || '')
  const [state, setState] = useState(parsed.state || '')
  const [pincode, setPincode] = useState(parsed.pincode || '')
  const [country, setCountry] = useState(parsed.country || 'India')

  const [locationUrl, setLocationUrl] = useState(customerData?.locationUrl || '')
  const [latitude, setLatitude] = useState(customerData?.latitude || null)
  const [longitude, setLongitude] = useState(customerData?.longitude || null)
  const [showMap, setShowMap] = useState(false)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const handleLocationSelect = useCallback((lat, lng) => {
    setLatitude(lat)
    setLongitude(lng)
    setShowMap(false)
  }, [])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(phone.trim())) errs.phone = 'Enter a valid 10-digit number'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (password && password.length < 6) errs.password = 'Min 6 characters'
    if (password && password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (isCustomer) {
      if (!street.trim()) errs.street = 'Street is required'
      if (!city.trim()) errs.city = 'City is required'
      if (!state.trim()) errs.state = 'State is required'
      if (!pincode.trim()) errs.pincode = 'Pincode is required'
    }
    if (user?.role === 'admin') {
      if (!companyName.trim()) errs.companyName = 'Company name is required'
      if (!companyLocation.trim()) errs.companyLocation = 'Company location is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      // Update users collection
      const userUpdates = { name: name.trim(), phone: phone.trim() }
      if (email) userUpdates.email = email.trim()
      if (user?.role === 'admin') {
        userUpdates.companyName = companyName.trim()
        userUpdates.companyLocation = companyLocation.trim()
      }
      if (password) userUpdates.password = password
      await updateUserProfile(user.id, userUpdates)
      updateUser(userUpdates)

      // Update customers collection if applicable
      if (isCustomer && customerData?.id) {
        const address = buildAddress({ street: street.trim(), landmark: landmark.trim(), city: city.trim(), state: state.trim(), country, pincode: pincode.trim() })
        await updateCustomer(customerData.id, {
          name: name.trim(),
          phone: phone.trim(),
          address,
          locationUrl: locationUrl.trim(),

          latitude,
          longitude,
        })
      }

      toast.success('Profile updated successfully!')
      onSaved()
    } catch (err) {
      toast.error('Failed to update: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (err) =>
    `w-full bg-slate-800 border ${err ? 'border-red-500' : 'border-slate-600'} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all ring-1 ring-transparent ${meta.inputFocus}`

  const mapCenter = latitude ? [latitude, longitude] : [20.5937, 78.9629]

  return (
    <div className="p-5 overflow-y-auto max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <MdArrowBack className="text-lg" />
        </button>
        <div>
          <h3 className="text-white font-bold text-base">Edit Profile</h3>
          <p className="text-xs text-slate-500">Update your account details</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── Account ── */}
        <SectionHeader>Account Info</SectionHeader>

        <Field label="Full Name *" icon={<MdPerson className="text-sm" />} error={errors.name}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={inputClass(errors.name)} />
        </Field>

        <Field label="Phone Number *" icon={<MdPhone className="text-sm" />} error={errors.phone}>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" maxLength={10} className={inputClass(errors.phone)} />
        </Field>

        <Field label="Email (Optional)" icon={<MdEmail className="text-sm" />} error={errors.email}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass(errors.email)} />
        </Field>

        {user?.role === 'admin' && (
          <>
            <Field label="Company Name *" icon={<MdBusiness className="text-sm" />} error={errors.companyName}>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter company name" className={inputClass(errors.companyName)} />
            </Field>

            <Field label="Company Location *" icon={<MdLocationCity className="text-sm" />} error={errors.companyLocation}>
              <input type="text" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} placeholder="Enter company location" className={inputClass(errors.companyLocation)} />
            </Field>
          </>
        )}

        <Field label={<>New Password <span className="text-slate-600 font-normal">(leave blank to keep current)</span></>} icon={<MdLock className="text-sm" />} error={errors.password}>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className={`${inputClass(errors.password)} pr-10`} />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
              {showPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
            </button>
          </div>
        </Field>

        {password.length > 0 && (
          <Field label="Confirm Password *" icon={<MdLock className="text-sm" />} error={errors.confirmPassword}>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={`${inputClass(errors.confirmPassword)} pr-10`} />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showConfirm ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
              </button>
            </div>
          </Field>
        )}

        {/* ── Customer-specific ── */}
        {isCustomer && (
          <>
            <SectionHeader>Delivery Address</SectionHeader>

            <Field label="Street / Colony *" icon={<MdHome className="text-sm" />} error={errors.street}>
              <input value={street} onChange={e => setStreet(e.target.value)} placeholder="House No, Street Name" className={inputClass(errors.street)} />
            </Field>

            <Field label="Landmark (Optional)" error={null}>
              <input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Near hospital, opposite park..." className={inputClass(null)} />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Pincode *" error={errors.pincode}>
                <input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" className={inputClass(errors.pincode)} />
              </Field>
              <Field label="City *" error={errors.city}>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={inputClass(errors.city)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="State *" error={errors.state}>
                <input list="edit-states" value={state} onChange={e => setState(e.target.value)} placeholder="State" className={inputClass(errors.state)} />
                <datalist id="edit-states">
                  {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'].map(s => <option key={s} value={s} />)}
                </datalist>
              </Field>
              <Field label="Country" error={null}>
                <input list="edit-countries" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className={inputClass(null)} />
                <datalist id="edit-countries"><option value="India" /></datalist>
              </Field>
            </div>



            <SectionHeader>Location (Optional)</SectionHeader>

            <Field label="Google Maps URL" icon={<MdLink className="text-sm" />} error={null}>
              <input type="url" value={locationUrl} onChange={e => setLocationUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." className={inputClass(null)} />
            </Field>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                <MdMyLocation className="inline mr-1.5 text-sm" />GPS Location
              </label>
              {latitude && longitude ? (
                <div className={`flex items-center gap-3 p-3 ${meta.bg} border ${meta.border} rounded-xl`}>
                  <MdLocationOn className={`text-xl ${meta.color}`} />
                  <div className="flex-1 text-xs text-slate-300">
                    Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                  </div>
                  <button type="button" onClick={() => setShowMap(true)} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-1">Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowMap(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-blue-600 hover:text-blue-400 transition-colors">
                  <MdMyLocation className="text-xl" />
                  <span className="text-sm">Click to pick location on map</span>
                </button>
              )}
            </div>

            {showMap && (
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <div className="px-3 py-2 bg-slate-800 text-xs text-slate-400">Click on the map to set your location</div>
                <div style={{ height: 220 }}>
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                    <ClickMarker onLocationSelect={handleLocationSelect} />
                    {latitude && <Marker position={[latitude, longitude]} />}
                  </MapContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex gap-2 pt-2">
        <button onClick={onBack} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-200 font-semibold text-sm">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${meta.saveBg} text-white transition-all duration-200 font-semibold text-sm disabled:opacity-60`}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdSave className="text-base" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

/* ─── MAIN MODAL SHELL ──────────────────────────────────────── */
const ProfileModal = ({ onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const [mode, setMode] = useState('view')
  const [customerData, setCustomerData] = useState(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)

  const meta = roleMeta[user?.role] || roleMeta.customer

  // Load full customer record if this user is a customer
  useEffect(() => {
    if (user?.role === 'customer' && user?.linkedId) {
      setLoadingCustomer(true)
      getCustomerById(user.linkedId)
        .then(data => setCustomerData(data))
        .catch(() => toast.error('Could not load customer details'))
        .finally(() => setLoadingCustomer(false))
    }
  }, [user?.role, user?.linkedId])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { mode === 'edit' ? setMode('view') : onClose() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, mode])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleSaved = () => {
    // Refresh customer data after edit
    if (user?.role === 'customer' && user?.linkedId) {
      getCustomerById(user.linkedId)
        .then(data => setCustomerData(data))
        .catch(() => {})
    }
    setMode('view')
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeInOverlay 0.15s ease' }}
    >
      <div
        key={mode}
        className={`relative w-full max-w-sm mx-4 rounded-2xl bg-slate-900 border ${meta.border} shadow-2xl`}
        style={{ animation: 'slideUpModal 0.2s ease' }}
      >
        {/* Coloured top bar */}
        <div className={`h-1.5 rounded-t-2xl ${meta.avatarBg} opacity-80`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MdClose className="text-lg" />
        </button>

        {mode === 'view' ? (
          <ViewProfile
            user={user}
            customerData={customerData}
            meta={meta}
            loading={loadingCustomer}
            onEdit={() => setMode('edit')}
            onLogout={handleLogout}
          />
        ) : (
          <EditProfile
            user={user}
            customerData={customerData}
            meta={meta}
            onBack={() => setMode('view')}
            onSaved={handleSaved}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUpModal  { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}

export default ProfileModal
