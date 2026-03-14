import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MdNavigation, MdMap } from 'react-icons/md'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByAgent } from '../../services/deliveryService'
import { getTodayString, formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'

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

const MapView = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getTodayString()

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    getDeliveriesByAgent(user.linkedId, today)
      .then(data => setDeliveries(data.filter(d => d.latitude && d.longitude)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const navigate = (lat, lng, name) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank')
  }

  const mapCenter = deliveries.length > 0
    ? [deliveries[0].latitude, deliveries[0].longitude]
    : [20.5937, 78.9629]

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">Map View</h1>
        <p className="page-subtitle">{formatDate(today)} · {deliveries.length} stops with GPS locations</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deliveries.length === 0 ? (
        <div className="card text-center py-16">
          <MdMap className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No deliveries with GPS locations set today</p>
          <p className="text-xs text-slate-600 mt-2">Ask admin to add GPS coordinates to customer profiles</p>
        </div>
      ) : (
        <>
          <div className="card mb-4 p-3">
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-dairy-green-500 inline-block" />Delivered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />Pending</span>
            </div>
          </div>
          <div style={{ height: 420 }} className="rounded-2xl overflow-hidden border border-slate-700 mb-4">
            <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {deliveries.map(d => (
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
                          onClick={() => navigate(d.latitude, d.longitude, d.customerName)}
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

          {/* Delivery list */}
          <div className="space-y-2">
            {deliveries.map(d => (
              <div key={d.id} className="card py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">{d.customerName}</p>
                  <p className="text-xs text-slate-500">{d.customerAddress}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{formatMl(d.milkScheduledMl)}</span>
                  {d.status !== 'delivered' && (
                    <button
                      onClick={() => navigate(d.latitude, d.longitude, d.customerName)}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      <MdNavigation /> Go
                    </button>
                  )}
                  {d.status === 'delivered' && <span className="badge-green">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MapView
