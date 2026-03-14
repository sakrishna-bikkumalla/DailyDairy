import React, { useState, useCallback } from 'react'
import { MdClose, MdLocationOn, MdMyLocation } from 'react-icons/md'
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
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
    dailyMilkMl: initial?.dailyMilkMl || 500,
    pricePerLiter: initial?.pricePerLiter || 60,
    latitude: initial?.latitude || null,
    longitude: initial?.longitude || null,
  })
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
    if (!form.name || !form.phone) return
    setSaving(true)
    await onSave({ ...form, dailyMilkMl: Number(form.dailyMilkMl), pricePerLiter: Number(form.pricePerLiter) })
    setSaving(false)
  }

  const mapCenter = form.latitude ? [form.latitude, form.longitude] : [20.5937, 78.9629]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">{initial ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <MdClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer full name" required />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile number" maxLength={10} required />
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-input h-20 resize-none" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full delivery address" />
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
