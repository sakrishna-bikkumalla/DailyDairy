import React, { useEffect, useState } from 'react'
import { MdCheckCircle, MdRefresh, MdLocalShipping } from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByAgent, markDelivered, markSkipped } from '../../services/deliveryService'
import { getTodayString, formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import toast from 'react-hot-toast'

const DeliveryList = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState(null)
  const [mlInputs, setMlInputs] = useState({})
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
    const ml = Number(mlInputs[d.id] ?? d.milkScheduledMl)
    setMarkingId(d.id)
    try {
      await markDelivered(d.id, ml)
      toast.success(`Delivered ${formatMl(ml)} to ${d.customerName}`)
      load()
    } catch { toast.error('Failed to mark') }
    finally { setMarkingId(null) }
  }

  const handleSkip = async (d) => {
    setMarkingId(d.id)
    try {
      await markSkipped(d.id, 'Skipped by agent')
      toast.success('Marked as skipped')
      load()
    } catch { toast.error('Failed') }
    finally { setMarkingId(null) }
  }

  const completed = deliveries.filter(d => d.status === 'delivered').length
  const pending = deliveries.filter(d => d.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">My Deliveries</h1>
          <p className="page-subtitle">{formatDate(today)} · {completed}/{deliveries.length} completed</p>
        </div>
        <button onClick={load} className="btn-secondary p-3"><MdRefresh /></button>
      </div>

      {/* Progress */}
      {deliveries.length > 0 && (
        <div className="card mb-6">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-dairy-green-400 font-bold">{deliveries.length > 0 ? Math.round((completed/deliveries.length)*100) : 0}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-dairy-green-600 to-dairy-green-400 rounded-full transition-all duration-700"
              style={{ width: `${deliveries.length > 0 ? (completed/deliveries.length)*100 : 0}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="text-dairy-green-400">✓ {completed} done</span>
            <span className="text-amber-400">⏳ {pending} left</span>
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
                    {d.status === 'pending' && <span className="badge-amber">Pending</span>}
                    {d.status === 'skipped' && <span className="badge-red">Skipped</span>}
                  </div>
                </div>

                {d.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 whitespace-nowrap">ml delivered:</label>
                      <input
                        type="number"
                        value={mlInputs[d.id] ?? d.milkScheduledMl}
                        onChange={e => setMlInputs(p => ({ ...p, [d.id]: e.target.value }))}
                        className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-dairy-green-500"
                        min={0}
                        step={50}
                      />
                    </div>
                    <button
                      onClick={() => handleMarkDelivered(d)}
                      disabled={markingId === d.id}
                      className="btn-primary py-2 px-3 text-sm"
                    >
                      {markingId === d.id ? '...' : <><MdCheckCircle /> Done</>}
                    </button>
                    <button
                      onClick={() => handleSkip(d)}
                      disabled={markingId === d.id}
                      className="btn-secondary py-2 px-3 text-sm text-xs"
                    >
                      Skip
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
