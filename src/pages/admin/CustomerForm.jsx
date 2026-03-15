import React, { useState, useCallback } from 'react'
import { MdClose, MdLocationOn, MdMyLocation, MdLock } from 'react-icons/md'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet default icon
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

const CustomerForm = ({ initial, onSave, onClose }) => {
  // Parse saved address string back into granular fields
  const parseAddress = (addrStr) => {
    if (!addrStr) return {}
    const p = addrStr.split(',').map(s => s.trim())
    if (p.length < 4) return { street: addrStr } // fallback for old unformatted data
    
    // Reverse logic: we know pincode is always last, then country, then state, then city.
    const pincode = p.pop() || ''
    const country = p.pop() || 'India'
    const state = p.pop() || ''
    const city = p.pop() || ''
    
    // Whatever is left is street + landmark
    const landmark = p.length > 1 ? p.pop() : ''
    const street = p.join(', ') || ''

    return { pincode, country, state, city, landmark, street }
  }

  const parsed = parseAddress(initial?.address)

  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    street: parsed.street || '',
    landmark: parsed.landmark || '',
    pincode: parsed.pincode || '',
    city: parsed.city || '',
    state: parsed.state || '',
    country: parsed.country || 'India',
    locationUrl: initial?.locationUrl || '',
    dailyMilkMl: initial?.dailyMilkMl || 500,
    pricePerLiter: initial?.pricePerLiter || 60,
    latitude: initial?.latitude || null,
    longitude: initial?.longitude || null,
  })
  const [password, setPassword] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleLocationSelect = useCallback((lat, lng) => {
    set('latitude', lat)
    set('longitude', lng)
    setShowMap(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.street || !form.city || !form.state || !form.pincode) {
      alert('Please fill in all required address fields.')
      return
    }
    setSaving(true)

    // Construct full address string
    const parts = [
      form.street,
      form.landmark,
      form.city,
      form.state,
      form.country,
      form.pincode
    ].filter(Boolean)
    const fullAddress = parts.join(', ')

    const dataToSave = {
      name: form.name,
      phone: form.phone,
      address: fullAddress, // Save combined string for backwards compatibility
      locationUrl: form.locationUrl,
      dailyMilkMl: Number(form.dailyMilkMl),
      pricePerLiter: Number(form.pricePerLiter),
      latitude: form.latitude,
      longitude: form.longitude,
      // Only pass password for new customers; leave undefined on edit
      ...(!initial && { password: password.trim() || form.phone })
    }

    await onSave(dataToSave)
    setSaving(false)
  }

  const mapCenter = form.latitude ? [form.latitude, form.longitude] : [20.5937, 78.9629]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] my-auto flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="font-bold text-white text-lg">{initial ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <MdClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer full name" required />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile number" maxLength={10} required />
          </div>
          {/* Password — only for new customers */}
          {!initial && (
            <div>
              <label className="form-label">
                Login Password
                <span className="ml-1 text-slate-500 font-normal">(default: phone number if left blank)</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="form-input pl-10"
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={`Default: ${form.phone || 'phone number'}`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Share this with the customer so they can log in.</p>
            </div>
          )}
          {/* Address Fields */}
          <div className="space-y-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</h3>
            
            <div>
              <label className="form-label">Street / Colony *</label>
              <input className="form-input" value={form.street} onChange={e => set('street', e.target.value)} placeholder="House No, Street Name" required />
            </div>
            
            <div>
              <label className="form-label">Landmark (Optional)</label>
              <input className="form-input" value={form.landmark} onChange={e => set('landmark', e.target.value)} placeholder="Near hospital, opposite park..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Pincode *</label>
                <input className="form-input" type="text" value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 Digit PIN" required />
              </div>
              <div>
                <label className="form-label">City *</label>
                <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City Name" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">State *</label>
                <input className="form-input" list="states" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Select State" required />
                <datalist id="states">
                  <option value="Andhra Pradesh" />
                  <option value="Arunachal Pradesh" />
                  <option value="Assam" />
                  <option value="Bihar" />
                  <option value="Chhattisgarh" />
                  <option value="Goa" />
                  <option value="Gujarat" />
                  <option value="Haryana" />
                  <option value="Himachal Pradesh" />
                  <option value="Jharkhand" />
                  <option value="Karnataka" />
                  <option value="Kerala" />
                  <option value="Madhya Pradesh" />
                  <option value="Maharashtra" />
                  <option value="Manipur" />
                  <option value="Meghalaya" />
                  <option value="Mizoram" />
                  <option value="Nagaland" />
                  <option value="Odisha" />
                  <option value="Punjab" />
                  <option value="Rajasthan" />
                  <option value="Sikkim" />
                  <option value="Tamil Nadu" />
                  <option value="Telangana" />
                  <option value="Tripura" />
                  <option value="Uttar Pradesh" />
                  <option value="Uttarakhand" />
                  <option value="West Bengal" />
                  <option value="Andaman and Nicobar Islands" />
                  <option value="Chandigarh" />
                  <option value="Dadra and Nagar Haveli and Daman and Diu" />
                  <option value="Delhi" />
                  <option value="Jammu and Kashmir" />
                  <option value="Ladakh" />
                  <option value="Lakshadweep" />
                  <option value="Puducherry" />
                </datalist>
              </div>
              <div>
                <label className="form-label">Country *</label>
                <input className="form-input" list="countries" value={form.country} onChange={e => set('country', e.target.value)} placeholder="Select Country" required />
                <datalist id="countries">
                  <option value="India" />
                </datalist>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Daily Milk (ml)</label>
              <input className="form-input" type="number" value={form.dailyMilkMl} onChange={e => set('dailyMilkMl', e.target.value)} min={100} step={100} />
            </div>
            <div>
              <label className="form-label">Price per Liter (₹)</label>
              <input className="form-input" type="number" value={form.pricePerLiter} onChange={e => set('pricePerLiter', e.target.value)} min={1} step={1} />
            </div>
          </div>

          <div>
            <label className="form-label">Google Maps URL (Optional)</label>
            <input className="form-input" type="url" value={form.locationUrl} onChange={e => set('locationUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
          </div>

          {/* GPS Location */}
          <div>
            <label className="form-label">GPS Location</label>
            {form.latitude && form.longitude ? (
              <div className="flex items-center gap-3 p-3 bg-dairy-green-900/30 border border-dairy-green-700/50 rounded-xl">
                <MdLocationOn className="text-dairy-green-400 text-xl flex-shrink-0" />
                <div className="flex-1 text-xs text-dairy-green-300">
                  Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
                </div>
                <button type="button" onClick={() => setShowMap(true)} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-1">Change</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowMap(true)}
                className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-dairy-green-600 hover:text-dairy-green-400 transition-colors">
                <MdMyLocation className="text-xl" />
                <span className="text-sm">Click to pick location on map</span>
              </button>
            )}
          </div>

          {showMap && (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <div className="px-3 py-2 bg-slate-800 text-xs text-slate-400">Click on the map to set customer location</div>
              <div style={{ height: 260 }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
                  <ClickMarker onLocationSelect={handleLocationSelect} />
                  {form.latitude && <Marker position={[form.latitude, form.longitude]} />}
                </MapContainer>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {saving ? 'Saving...' : (initial ? 'Update' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerForm
