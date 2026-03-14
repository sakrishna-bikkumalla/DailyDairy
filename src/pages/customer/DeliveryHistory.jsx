import React, { useEffect, useState } from 'react'
import { MdHistory } from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByCustomer } from '../../services/deliveryService'
import { formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'

const statusBadge = {
  delivered: <span className="badge-green">Delivered</span>,
  pending: <span className="badge-amber">Pending</span>,
  skipped: <span className="badge-red">Skipped</span>,
}

const DeliveryHistory = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    getDeliveriesByCustomer(user.linkedId)
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const totalMl = deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.milkDeliveredMl || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">Delivery History</h1>
        <p className="page-subtitle">All your past milk deliveries</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-white">{deliveries.length}</p><p className="text-xs text-slate-400 mt-1">Total Days</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-dairy-green-400">{deliveries.filter(d => d.status === 'delivered').length}</p><p className="text-xs text-slate-400 mt-1">Delivered</p></div>
        <div className="card p-4 text-center"><p className="text-xl font-bold text-blue-400">{formatMl(totalMl)}</p><p className="text-xs text-slate-400 mt-1">Total Milk</p></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deliveries.length === 0 ? (
        <div className="card text-center py-16">
          <GiMilkCarton className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No delivery history yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs text-slate-400 uppercase">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Scheduled</th>
                  <th className="text-left px-4 py-3">Delivered</th>
                  <th className="text-left px-4 py-3">Photo</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatDate(d.date)}</td>
                    <td className="px-4 py-3"><span className="badge-blue">{formatMl(d.milkScheduledMl || 0)}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-slate-300">{d.status === 'delivered' ? formatMl(d.milkDeliveredMl) : '-'}</span></td>
                    <td className="px-4 py-3">
                      {d.photoUrl ? (
                        <a href={d.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">View Photo</a>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge[d.status] || d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryHistory
