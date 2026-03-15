import React, { useEffect, useState } from 'react'
import { MdCheckCircle, MdRefresh, MdLocalShipping, MdMap, MdNavigation } from 'react-icons/md'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByAgent, markDelivered, markSkipped, uploadDeliveryPhoto } from '../../services/deliveryService'
import { getTodayString, formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import DeliveryProgressBar from '../../components/DeliveryProgressBar'
import toast from 'react-hot-toast'

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const DeliveryList = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)
  const [mlInputs, setMlInputs] = useState({})
  const [photoInputs, setPhotoInputs] = useState({})
  const [issueState, setIssueState] = useState({}) // { deliveryId: 'reason' }
  const today = getTodayString()

  const load = async () => {
    if (!user?.linkedId) { setLoading(false); return }
    setLoading(true)
    try { setDeliveries(await getDeliveriesByAgent(user.linkedId, today)) }
    catch { toast.error('Failed to load deliveries') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const handleMarkDelivered = async (d) => {
    // If partial amount is selected, use input. Otherwise, use scheduled amount.
    const isPartial = issueState[d.id] === 'partial'
    const ml = isPartial ? Number(mlInputs[d.id] ?? d.milkScheduledMl) : d.milkScheduledMl
    // const photoFile = photoInputs[d.id]
    
    // if (!photoFile) {
    //   toast.error('Please upload a photo of the delivery to proceed')
    //   return
    // }

    if (isPartial && (ml <= 0 || ml >= d.milkScheduledMl)) {
      toast.error('Partial amount must be greater than 0 and less than scheduled amount')
      return
    }

    setMarkingId(d.id)
    try {
      // 1. Upload photo to Cloudinary
      // const photoUrl = await uploadDeliveryPhoto(photoFile)
      
      // 2. Mark as delivered with the new photo URL (or null if disabled)
      await markDelivered(d.id, ml, null)
      
      toast.success(`Delivered ${formatMl(ml)} to ${d.customerName}`)
      load()
    } catch(e) { 
      toast.error('Failed to mark: ' + e.message) 
    }
    finally { setMarkingId(null) }
  }

  const handleIssueAction = async (d, reason) => {
    if (reason === 'partial') {
      // Just open the partial UI state, do not mark completed yet
      setIssueState(p => ({ ...p, [d.id]: 'partial' }))
      return
    }

    // Direct Rejections (customer unavailable / customer rejected)
    setMarkingId(d.id)
    try {
      await markSkipped(d.id, reason) // Mark skipped with explicit reason
      toast.success('Marked as ' + reason)
      load()
    } catch { toast.error('Failed to update status') }
    finally { setMarkingId(null) }
  }

  const done = deliveries.filter(d => d.status !== 'pending').length
  const pending = deliveries.filter(d => d.status === 'pending').length

  const mapDeliveries = deliveries.filter(d => d.latitude && d.longitude)
  const mapCenter = mapDeliveries.length > 0
    ? [mapDeliveries[0].latitude, mapDeliveries[0].longitude]
    : [20.5937, 78.9629]

  const navigateTo = (lat, lng, url = null) => {
    if (url) {
      window.open(url, '_blank')
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">My Deliveries</h1>
          <p className="page-subtitle">{formatDate(today)} · {done}/{deliveries.length} completed</p>
        </div>
        <button onClick={load} className="btn-secondary p-3"><MdRefresh /></button>
      </div>

      {/* Progress */}
      {deliveries.length > 0 && (
        <DeliveryProgressBar total={deliveries.length} done={done}>
          <span className="text-dairy-green-400">✓ {done} done</span>
          <span className="text-amber-400">⏳ {pending} left</span>
        </DeliveryProgressBar>
      )}

      {/* Map View */}
      {mapDeliveries.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-300">Route Map</h2>
            <span className="text-xs text-slate-500">{mapDeliveries.length} destinations</span>
          </div>
          <div style={{ height: 300 }} className="rounded-2xl overflow-hidden border border-slate-700">
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {mapDeliveries.map(d => (
                <Marker
                  key={d.id}
                  position={[d.latitude, d.longitude]}
                  icon={d.status === 'delivered' ? greenIcon : greyIcon}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold text-slate-800 mb-1">{d.customerName}</p>
                      <p className="text-slate-600 text-xs mb-1">{d.customerAddress}</p>
                      <p className="text-slate-600 text-xs mb-2">Milk: <strong>{formatMl(d.milkScheduledMl)}</strong></p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                        d.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{d.status === 'delivered' ? '✓ Delivered' : '⏳ Pending'}</span>
                      {d.status !== 'delivered' && (
                        <button
                          onClick={() => navigateTo(d.latitude, d.longitude, d.locationUrl)}
                          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center mt-1"
                        >
                          <MdNavigation /> Navigate
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deliveries.length === 0 ? (
        <div className="card text-center py-16">
          <MdLocalShipping className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No deliveries assigned to you today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map(d => (
            <div key={d.id} className={`card ${d.status === 'delivered' ? 'border border-dairy-green-700/40' : d.status === 'skipped' ? 'border border-red-700/30 opacity-60' : 'border border-slate-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{d.customerName}</p>
                    {d.status === 'delivered' && <MdCheckCircle className="text-dairy-green-400" />}
                  </div>
                  <p className="text-sm text-slate-400">{d.customerAddress}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge-blue">{formatMl(d.milkScheduledMl)}</span>
                    {d.status === 'delivered' && <span className="badge-green">Delivered {formatMl(d.milkDeliveredMl)}</span>}
                    {/* {d.status === 'delivered' && d.photoUrl && (
                      <a href={d.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">View Photo</a>
                    )} */}
                    {d.status === 'pending' && <span className="badge-amber">Pending</span>}
                    {d.status === 'skipped' && <span className="badge-red">Skipped</span>}
                  </div>
                </div>

                {d.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {issueState[d.id] === 'partial' && (
                      <div className="flex items-center gap-2 mr-2">
                        <label className="text-xs text-amber-500 whitespace-nowrap font-semibold">Partial (ml):</label>
                        <input
                          type="number"
                          value={mlInputs[d.id] ?? d.milkScheduledMl}
                          onChange={e => setMlInputs(p => ({ ...p, [d.id]: e.target.value }))}
                          className="w-20 bg-slate-700 border border-amber-500/50 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                          min={0}
                          step={50}
                        />
                      </div>
                    )}
                    
                    {/* <div className="flex items-center gap-2">
                      <input 
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={e => setPhotoInputs(p => ({ ...p, [d.id]: e.target.files[0] }))}
                        className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer w-36"
                      />
                    </div> */}
                    
                    {/* Navigation Button */}
                    <a
                      href={
                        d.locationUrl 
                          ? d.locationUrl
                          : d.latitude && d.longitude
                            ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.customerAddress)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary py-2 px-3 text-sm text-xs bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/40 hover:text-white"
                    >
                      <MdMap className="inline mr-1 mb-0.5" /> Go
                    </a>

                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) handleIssueAction(d, val);
                        e.target.value = ""; // reset
                      }}
                      disabled={markingId === d.id}
                      className="btn-secondary py-2 px-2 text-sm text-xs bg-slate-700 hover:bg-slate-600 border-slate-600 appearance-none text-center cursor-pointer"
                    >
                      <option value="">Issue...</option>
                      <option value="partial">1. Partial Quantity</option>
                      <option disabled>──────</option>
                      <option value="Customer Rejected">2. Customer Rejected</option>
                      <option value="Customer Unavailable">3. Customer Unavailable</option>
                      <option value="Skipped by Agent">4. Other Skip</option>
                    </select>

                    <button
                      onClick={() => handleMarkDelivered(d)}
                      disabled={markingId === d.id}
                      className="btn-primary py-2 px-3 text-sm"
                    >
                      {markingId === d.id ? '...' : <><MdCheckCircle /> Done</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DeliveryList
