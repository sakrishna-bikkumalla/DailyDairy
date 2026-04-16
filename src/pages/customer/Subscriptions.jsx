import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getCustomerSubscriptionDetails } from '../../services/subscriptionService'
import { formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'

const CustomerSubscriptions = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    const load = async () => {
      try {
        const details = await getCustomerSubscriptionDetails(user.linkedId)
        setData(details)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>

  if (!data || !data.subscriptions?.length) return (
    <div>
      <h1 className="page-header">My Subscriptions</h1>
      <p className="page-subtitle mb-6">Your milk delivery plans</p>
      <div className="card text-center py-10">
        <p className="text-slate-400">You don't have any active or past subscriptions.</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">My Subscriptions</h1>
        <p className="page-subtitle">Your milk delivery plans</p>
      </div>

      <div className="space-y-4">
        {data.subscriptions.map(sub => (
          <div key={sub.id} className="card relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${sub.status === 'active' ? 'bg-dairy-green-500' : sub.status === 'stopped' ? 'bg-amber-500' : 'bg-slate-500'}`} />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-white text-lg">{formatMl(sub.dailyQuantityMl)} / day</h3>
                  <span className={`badge ${sub.status === 'active' ? 'badge-green' : sub.status === 'stopped' ? 'badge-amber' : 'badge-slate'}`}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Price: ₹{sub.pricePerLiter || 60}/L</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Milk</p>
                  <p className="font-semibold text-white">{sub.metrics.totalLitersDelivered.toFixed(1)} L</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Days Left</p>
                  <p className="font-semibold text-white">{sub.metrics.daysLeft}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Est. Cost</p>
                  <p className="font-semibold text-white">₹{sub.metrics.estimatedCost.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Billed</p>
                  <p className="font-semibold text-dairy-green-400">₹{sub.metrics.actualCost.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CustomerSubscriptions
