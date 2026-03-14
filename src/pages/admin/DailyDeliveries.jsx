import React, { useEffect, useState } from 'react'
import { MdRefresh, MdCheckCircle, MdPending, MdLocalShipping, MdPersonAdd } from 'react-icons/md'
import {
  createDailyDeliveries, getDeliveriesByDate, getDeliveryStats, assignAgent
} from '../../services/deliveryService'
import { getCustomers } from '../../services/customerService'
import { getAgents } from '../../services/agentService'
import { getTodayString, formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import DeliveryProgressBar from '../../components/DeliveryProgressBar'
import toast from 'react-hot-toast'

const statusBadge = {
  pending: <span className="badge-amber">Pending</span>,
  delivered: <span className="badge-green">Delivered</span>,
  skipped: <span className="badge-red">Skipped</span>,
}

const DailyDeliveries = () => {
  const [date, setDate] = useState(getTodayString())
  const [deliveries, setDeliveries] = useState([])
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadAgents = async () => { setAgents(await getAgents()) }

  const load = async () => {
    setLoading(true)
    try {
      const [delivs, s] = await Promise.all([getDeliveriesByDate(date), getDeliveryStats(date)])
      setDeliveries(delivs)
      setStats(s)
    } catch (e) {
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAgents(); load() }, [date])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const customers = await getCustomers()
      if (customers.length === 0) { toast.error('No customers found'); return }
      const result = await createDailyDeliveries(date, customers)
      if (result.alreadyExists) toast.error('Deliveries already generated for this date')
      else { toast.success(`Generated ${result.created} deliveries`); load() }
    } catch (e) {
      toast.error(e.message || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const handleAssignAgent = async (deliveryId, agentId) => {
    try {
      await assignAgent(deliveryId, agentId)
      toast.success('Agent assigned')
      load()
    } catch { toast.error('Failed to assign') }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-header">Daily Deliveries</h1>
          <p className="page-subtitle">Generate and manage milk deliveries by date</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="form-input w-auto" />
          <button onClick={load} className="btn-secondary p-3"><MdRefresh /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-dairy-green-400">{stats.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Delivered</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-xs text-slate-400 mt-1">Pending</p>
        </div>
      </div>

      {/* Progress */}
      {stats.total > 0 && (
        <DeliveryProgressBar total={stats.total} done={stats.completed + stats.skipped}>
          <span>{formatMl(stats.totalMlDelivered)} / {formatMl(stats.totalMlScheduled)} delivered</span>
        </DeliveryProgressBar>
      )}

      {/* Generate button */}
      {deliveries.length === 0 && !loading && (
        <div className="card text-center py-12 mb-6">
          <MdLocalShipping className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No deliveries generated for <strong>{formatDate(date)}</strong></p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary mx-auto">
            {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdRefresh />}
            {generating ? 'Generating...' : 'Generate Deliveries'}
          </button>
        </div>
      )}

      {/* Delivery list */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : deliveries.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">{deliveries.length} deliveries · {formatDate(date)}</h3>
            <button onClick={handleGenerate} disabled className="text-xs text-slate-600 cursor-not-allowed">Already generated</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs text-slate-400 uppercase">
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Milk (ml)</th>
                  <th className="text-left px-4 py-3">Assign Agent</th>
                  <th className="text-left px-4 py-3">Photo</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{d.customerName}</p>
                      <p className="text-xs text-slate-500">{d.customerAddress}</p>
                    </td>
                    <td className="px-4 py-3"><span className="badge-green">{formatMl(d.milkScheduledMl)}</span></td>
                    <td className="px-4 py-3">
                      <select
                        value={d.agentId || ''}
                        onChange={e => handleAssignAgent(d.id, e.target.value || null)}
                        className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dairy-green-500"
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {d.photoUrl ? (
                        <a href={d.photoUrl} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded overflow-hidden border border-slate-600 hover:border-dairy-green-400 transition-colors">
                          <img src={d.photoUrl} alt="Delivery verification" className="w-full h-full object-cover" />
                        </a>
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

export default DailyDeliveries
