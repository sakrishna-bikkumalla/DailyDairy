import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdAdd, MdHistory, MdLocalShipping, MdCheckCircle } from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import { useAuth } from '../../contexts/AuthContext'
import { getCustomerById } from '../../services/customerService'
import { getDeliveriesByCustomer } from '../../services/deliveryService'
import { getCustomerRequests } from '../../services/requestService'
import { getTodayString, formatDate, formatDateTime } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'

const reqLabels = { extra_milk: '🥛 Extra Milk', pause_delivery: '⏸ Pause', evening_milk: '🌙 Evening' }

const CustomerDashboard = () => {
  const { user } = useAuth()
  const [customer, setCustomer] = useState(null)
  const [todayDelivery, setTodayDelivery] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [stats, setStats] = useState({ total: 0, delivered: 0, totalMl: 0 })
  const [loading, setLoading] = useState(true)
  const today = getTodayString()

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    const load = async () => {
      try {
        const [cust, deliveries, reqs] = await Promise.all([
          getCustomerById(user.linkedId),
          getDeliveriesByCustomer(user.linkedId),
          getCustomerRequests(user.linkedId)
        ])
        setCustomer(cust)
        setTodayDelivery(deliveries.find(d => d.date === today) || null)
        setPendingRequests(reqs.filter(r => r.status === 'pending').slice(0, 3))
        setStats({
          total: deliveries.length,
          delivered: deliveries.filter(d => d.status === 'delivered').length,
          totalMl: deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.milkDeliveredMl || 0), 0)
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">My Dashboard</h1>
        <p className="page-subtitle">Your milk delivery overview</p>
      </div>

      {/* Today's delivery card */}
      <div className={`card mb-6 border ${todayDelivery?.status === 'delivered' ? 'border-dairy-green-700/50' : 'border-amber-700/50'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${todayDelivery?.status === 'delivered' ? 'bg-dairy-green-900/50' : 'bg-amber-900/30'}`}>
            {todayDelivery?.status === 'delivered' ? '✅' : <GiMilkCarton className="text-dairy-cream-400" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Today's Delivery</h3>
            <p className="text-sm text-slate-400">{formatDate(today)}</p>
            {todayDelivery ? (
              <div className="flex items-center gap-3 mt-2">
                <span className="badge-green">{formatMl(todayDelivery.milkScheduledMl)}</span>
                <span className={todayDelivery.status === 'delivered' ? 'badge-green' : 'badge-amber'}>
                  {todayDelivery.status === 'delivered' ? 'Delivered' : 'Pending'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">No delivery scheduled today</p>
            )}
          </div>
          {customer && (
            <div className="text-right">
              <p className="text-sm text-slate-400">Daily quota</p>
              <p className="text-xl font-bold text-white">{formatMl(customer.dailyMilkMl)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total Days</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-dairy-green-400">{stats.delivered}</p>
          <p className="text-xs text-slate-400 mt-1">Received</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{formatMl(stats.totalMl)}</p>
          <p className="text-xs text-slate-400 mt-1">Total Milk</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link to="/customer/request?type=extra_milk" className="card p-4 text-center hover:border-dairy-green-600 hover:bg-dairy-green-900/20 transition-all cursor-pointer border-slate-700">
          <div className="text-2xl mb-2">🥛</div>
          <p className="text-xs font-medium text-slate-300">Extra Milk</p>
        </Link>
        <Link to="/customer/request?type=pause_delivery" className="card p-4 text-center hover:border-amber-600 hover:bg-amber-900/20 transition-all cursor-pointer border-slate-700">
          <div className="text-2xl mb-2">⏸️</div>
          <p className="text-xs font-medium text-slate-300">Pause</p>
        </Link>
        <Link to="/customer/request?type=evening_milk" className="card p-4 text-center hover:border-blue-600 hover:bg-blue-900/20 transition-all cursor-pointer border-slate-700">
          <div className="text-2xl mb-2">🌙</div>
          <p className="text-xs font-medium text-slate-300">Evening</p>
        </Link>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Pending Requests</h3>
            <Link to="/customer/request" className="text-xs text-dairy-green-400 hover:text-dairy-green-300">New +</Link>
          </div>
          <div className="space-y-2">
            {pendingRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-sm text-slate-300">{reqLabels[r.requestType]}</span>
                <span className="badge-amber">Pending review</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDashboard
