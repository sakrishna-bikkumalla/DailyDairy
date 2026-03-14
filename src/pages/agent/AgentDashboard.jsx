import React, { useEffect, useState } from 'react'
import { MdLocalShipping, MdCheckCircle, MdPending } from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByAgent, getDeliveryStats } from '../../services/deliveryService'
import { getTodayString, formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import DeliveryProgressBar from '../../components/DeliveryProgressBar'

const AgentDashboard = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getTodayString()

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    getDeliveriesByAgent(user.linkedId, today)
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const done = deliveries.filter(d => d.status !== 'pending').length
  const pending = deliveries.filter(d => d.status === 'pending').length
  const total = deliveries.length
  const totalMl = deliveries.reduce((s, d) => s + (d.milkScheduledMl || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">My Dashboard</h1>
        <p className="page-subtitle">Today's delivery overview · {formatDate(today)}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 text-center border border-slate-700">
              <p className="text-3xl font-bold text-white">{total}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1"><MdLocalShipping />Total</p>
            </div>
            <div className="card p-4 text-center border border-dairy-green-700/50">
              <p className="text-3xl font-bold text-dairy-green-400">{done}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1"><MdCheckCircle />Done</p>
            </div>
            <div className="card p-4 text-center border border-amber-700/50">
              <p className="text-3xl font-bold text-amber-400">{pending}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1"><MdPending />Pending</p>
            </div>
          </div>

          {/* Progress */}
          {total > 0 && (
            <DeliveryProgressBar total={total} done={done}>
              <span>{done} done</span>
              <span>{formatMl(totalMl)} scheduled today</span>
            </DeliveryProgressBar>
          )}

          {/* Recent deliveries preview */}
          {deliveries.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3">Today's Assignments</h3>
              <div className="space-y-2">
                {deliveries.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{d.customerName}</p>
                      <p className="text-xs text-slate-500">{d.customerAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{formatMl(d.milkScheduledMl)}</span>
                      {d.status === 'delivered' && <span className="badge-green">Done</span>}
                      {d.status === 'pending' && <span className="badge-amber">Pending</span>}
                      {d.status === 'skipped' && <span className="badge-red">Skipped</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deliveries.length === 0 && (
            <div className="card text-center py-12">
              <MdLocalShipping className="text-5xl text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No deliveries assigned to you today</p>
              <p className="text-slate-600 text-sm mt-1">Contact the admin if you expected assignments.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AgentDashboard
