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
  const [filter, setFilter] = useState('all')
  const today = getTodayString()

  const load = async () => {
    if (!user?.linkedId) { setLoading(false); return }
    setLoading(true)
    try { 
      const data = await getDeliveriesByAgent(user.linkedId, today)
      setDeliveries(data)
      // Auto-set filter to pending if there are pending items
      if (data.some(d => d.status === 'pending')) {
        setFilter('pending')
      }
    }
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

  const filtered = deliveries.filter(d => {
    if (filter === 'all') return true
    if (filter === 'pending') return d.status === 'pending'
    if (filter === 'completed') return d.status !== 'pending'
    return true
  })

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">My Deliveries</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            {formatDate(today)} · <span className="text-dairy-green-400">{done}/{deliveries.length} DONE</span>
          </p>
        </div>
        <button onClick={load} className="btn-secondary h-9 w-9 flex items-center justify-center p-0 rounded-xl"><MdRefresh className="text-lg" /></button>
      </div>

      {/* Progress */}
      {deliveries.length > 0 && (
        <div className="mb-4">
          <DeliveryProgressBar total={deliveries.length} done={done} compact>
            <span className="text-dairy-green-400 font-black text-[10px] uppercase tracking-tighter">✓ {done} done</span>
            <span className="text-amber-400 font-black text-[10px] uppercase tracking-tighter">⏳ {pending} left</span>
          </DeliveryProgressBar>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'All', count: deliveries.length },
          { id: 'pending', label: 'Pending', count: pending },
          { id: 'completed', label: 'Completed', count: done },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f.id 
                ? 'bg-dairy-green-700 text-white shadow-lg shadow-dairy-green-900/30' 
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
          >
            {f.label} <span className="opacity-50 ml-0.5">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Map View */}
      {mapDeliveries.length > 0 && filter === 'all' && (
        <div className="mb-4 animate-fade-in">
          <div style={{ height: 200 }} className="rounded-xl overflow-hidden border border-slate-700/50 grayscale-[0.5] contrast-[1.1]">
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
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
                      <p className="text-slate-600 text-[10px] mb-2 leading-tight">{d.customerAddress}</p>
                      <button
                        onClick={() => navigateTo(d.latitude, d.longitude, d.locationUrl)}
                        className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-1.5 rounded-lg w-full justify-center"
                      >
                        <MdNavigation /> NAVIGATE
                      </button>
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
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <MdLocalShipping className="text-5xl text-slate-700 mx-auto mb-2 opacity-50" />
          <p className="text-slate-500 uppercase font-black tracking-widest text-[10px]">No results in {filter}</p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-20">
          {filtered.map(d => (
            <div key={d.id} className={`p-3 rounded-2xl bg-slate-900/40 border transition-all ${
              d.status === 'delivered' ? 'border-dairy-green-700/30' : 
              d.status === 'skipped' ? 'border-red-700/20 opacity-60' : 
              'border-slate-800 shadow-xl'
            }`}>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="font-bold text-white text-base leading-tight truncate">{d.customerName}</p>
                      {d.status === 'delivered' && <MdCheckCircle className="text-dairy-green-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 break-words">
                      {d.customerAddress}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-dairy-green-400 tracking-tighter">{formatMl(d.milkScheduledMl)}</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{d.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {d.status === 'delivered' && (
                    <span className="text-[10px] font-bold text-dairy-green-500 bg-dairy-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      ✓ Received {formatMl(d.milkDeliveredMl)}
                    </span>
                  )}
                  {d.status === 'skipped' && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Skipped: {d.skipReason}
                    </span>
                  )}
                </div>

                {d.status === 'pending' && (
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:shrink-0">
                    <div className="grid grid-cols-2 gap-2 w-full">
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
                        className="btn-secondary py-2.5 px-3 text-xs bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20 hover:text-white flex items-center justify-center gap-1"
                      >
                        <MdMap className="text-sm" /> Go
                      </a>

                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleIssueAction(d, val);
                          e.target.value = ""; // reset
                        }}
                        disabled={markingId === d.id}
                        className="btn-secondary py-2.5 px-2 text-xs bg-slate-800/50 hover:bg-slate-800 border-slate-700 appearance-none text-center cursor-pointer w-full"
                      >
                        <option value="">Issue...</option>
                        <option value="partial">Quantity Issue</option>
                        <option disabled>──────</option>
                        <option value="Customer Rejected">Rejected</option>
                        <option value="Customer Unavailable">Unavailable</option>
                        <option value="Skipped by Agent">Other Skip</option>
                      </select>
                    </div>

                    {issueState[d.id] === 'partial' && (
                      <div className="flex items-center justify-between gap-3 bg-amber-900/10 border border-amber-500/20 p-2 rounded-xl scale-in">
                        <label className="text-[10px] text-amber-500 uppercase font-black tracking-widest ml-1">Actual ML:</label>
                        <input
                          type="number"
                          value={mlInputs[d.id] ?? d.milkScheduledMl}
                          onChange={e => setMlInputs(p => ({ ...p, [d.id]: e.target.value }))}
                          className="w-24 bg-slate-900 border border-amber-500/50 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                          min={0}
                          step={50}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => handleMarkDelivered(d)}
                      disabled={markingId === d.id}
                      className="btn-primary py-3 px-4 text-sm w-full flex items-center justify-center gap-2 shadow-lg shadow-dairy-green-900/20 active:scale-[0.98] transition-transform"
                    >
                      {markingId === d.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <MdCheckCircle className="text-lg" />
                          <span className="font-bold tracking-wide">MARK AS DONE</span>
                        </>
                      )}
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
