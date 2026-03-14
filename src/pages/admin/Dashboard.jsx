import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdPeople, MdLocalShipping, MdDeliveryDining, MdInbox,
  MdCheckCircle, MdPending, MdTrendingUp
} from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import StatCard from '../../components/StatCard'
import { getCustomers } from '../../services/customerService'
import { getAgents } from '../../services/agentService'
import { getDeliveryStats } from '../../services/deliveryService'
import { getRequests } from '../../services/requestService'
import { getTodayString, formatDateTime } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import DeliveryProgressBar from '../../components/DeliveryProgressBar'

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, skipped: 0, totalMlScheduled: 0, totalMlDelivered: 0 })
  const [customerCount, setCustomerCount] = useState(0)
  const [agentCount, setAgentCount] = useState(0)
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const today = getTodayString()

  useEffect(() => {
    const load = async () => {
      try {
        const [custs, agents, delivStats, reqs] = await Promise.all([
          getCustomers(),
          getAgents(),
          getDeliveryStats(today),
          getRequests('pending')
        ])
        setCustomerCount(custs.length)
        setAgentCount(agents.length)
        setStats(delivStats)
        setPendingRequests(reqs.slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const reqTypeLabel = { extra_milk: 'Extra Milk', pause_delivery: 'Pause Delivery', evening_milk: 'Evening Milk' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Overview of today's delivery operations · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Customers" value={customerCount} icon={MdPeople} color="green" />
            <StatCard label="Delivery Agents" value={agentCount} icon={MdDeliveryDining} color="blue" />
            <StatCard label="Today's Deliveries" value={stats.total} icon={MdLocalShipping} color="amber" sub={`${formatMl(stats.totalMlScheduled)} scheduled`} />
            <StatCard label="Pending Requests" value={pendingRequests.length} icon={MdInbox} color="red" />
          </div>

          {/* Today progress */}
          <DeliveryProgressBar 
            total={stats.total} 
            done={stats.completed + stats.skipped} 
            label={`Today's Delivery Progress · ${today}`}
          >
            <div className="flex items-center gap-6 w-full">
              <span className="flex items-center gap-1 text-dairy-green-400"><MdCheckCircle />Done: {stats.completed}</span>
              <span className="flex items-center gap-1 text-amber-400"><MdPending />Pending: {stats.pending}</span>
              {stats.skipped > 0 && <span className="flex items-center gap-1 text-red-400">Skipped: {stats.skipped}</span>}
            </div>
          </DeliveryProgressBar>
          
          {stats.total === 0 && (
            <div className="mb-6 p-4 border border-slate-700 rounded-xl text-center">
              <p className="text-slate-400 mb-2">No deliveries generated for today.</p>
              <Link to="/admin/deliveries" className="btn-primary text-sm inline-block px-4 py-2">Go to Daily Deliveries</Link>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Milk stats */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><GiMilkCarton className="text-dairy-green-400" />Milk Statistics Today</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Scheduled</span>
                  <span className="text-white font-medium">{formatMl(stats.totalMlScheduled)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Delivered</span>
                  <span className="text-dairy-green-400 font-medium">{formatMl(stats.totalMlDelivered)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Remaining</span>
                  <span className="text-amber-400 font-medium">{formatMl(Math.max(0, stats.totalMlScheduled - stats.totalMlDelivered))}</span>
                </div>
              </div>
            </div>

            {/* Pending requests */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><MdInbox className="text-red-400" />Pending Requests</h3>
                <Link to="/admin/requests" className="text-xs text-dairy-green-400 hover:text-dairy-green-300">View all →</Link>
              </div>
              {pendingRequests.length === 0 ? (
                <p className="text-slate-500 text-sm">No pending requests 🎉</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{r.customerName}</p>
                        <p className="text-xs text-slate-500">{reqTypeLabel[r.requestType] || r.requestType}</p>
                      </div>
                      <span className="badge-amber">{r.milkMl ? formatMl(r.milkMl) : 'Pause'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { to: '/admin/customers', label: 'Manage Customers', icon: MdPeople, color: 'border-dairy-green-700 hover:bg-dairy-green-900/30' },
              { to: '/admin/agents', label: 'Manage Agents', icon: MdDeliveryDining, color: 'border-blue-700 hover:bg-blue-900/30' },
              { to: '/admin/deliveries', label: 'Daily Deliveries', icon: MdLocalShipping, color: 'border-amber-700 hover:bg-amber-900/30' },
              { to: '/admin/billing', label: 'View Billing', icon: MdTrendingUp, color: 'border-purple-700 hover:bg-purple-900/30' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${color} text-slate-300 hover:text-white transition-all duration-200 text-center text-sm font-medium`}
              >
                <Icon className="text-2xl" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
