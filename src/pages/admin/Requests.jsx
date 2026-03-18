import React, { useEffect, useState } from 'react'
import { MdCheckCircle, MdCancel, MdInbox, MdRefresh } from 'react-icons/md'
import { getRequests, updateRequestStatus } from '../../services/requestService'
import { createDeliveryForRequest } from '../../services/deliveryService'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const reqTypeInfo = {
  extra_milk: { label: 'Extra Milk 🥛', color: 'badge-blue' },
  morning_milk: { label: 'Morning Milk 🌅', color: 'badge-green' },
  evening_milk: { label: 'Evening Milk 🌙', color: 'badge-purple' },
  pause_delivery: { label: 'Pause Delivery ⏸', color: 'badge-amber' },
  custom: { label: 'Custom Request 📝', color: 'badge-blue' },
}

const TABS = ['all', 'pending', 'approved', 'rejected']

const Requests = () => {
  const { adminId } = useAuth()
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    try { setRequests(await getRequests(null, adminId)) }
    catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (adminId) load() }, [adminId])

  const handle = async (id, status, reason = null) => {
    try {
      await updateRequestStatus(id, status, reason)
      
      // If approving a delivery request, potentially create an immediate delivery
      if (status === 'approved') {
        const req = requests.find(r => r.id === id)
        const activeTypes = ['extra_milk', 'morning_milk', 'evening_milk', 'custom']
        if (req && activeTypes.includes(req.requestType)) {
          await createDeliveryForRequest(req)
        }
      }

      toast.success(`Request ${status}`)
      if (status === 'rejected') setRejectingId(null)
      load()
    } catch { toast.error('Failed to update') }
  }

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab)
  const count = (s) => requests.filter(r => r.status === s).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Customer Requests</h1>
          <p className="page-subtitle">Manage milk requests from customers</p>
        </div>
        <button onClick={load} className="btn-secondary p-3"><MdRefresh /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all flex-shrink-0 ${
              tab === t ? 'bg-dairy-green-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>
            {t} {t !== 'all' && <span className="ml-1 text-xs opacity-70">({count(t)})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <MdInbox className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No {tab === 'all' ? '' : tab} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const ti = reqTypeInfo[r.requestType] || { label: r.requestType, color: 'badge-blue' }
            return (
              <div key={r.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={ti.color}>{ti.label}</span>
                      <span className={`badge ${r.status === 'pending' ? 'badge-amber' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="font-semibold text-white">{r.customerName}</p>
                    <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                      {r.requestType === 'extra_milk' && <p>Extra: <span className="text-slate-200">{formatMl(r.milkMl || 0)}</span> on <span className="text-slate-200">{formatDate(r.date)}</span></p>}
                      {r.requestType === 'morning_milk' && <p>Morning: <span className="text-slate-200">{formatMl(r.milkMl || 0)}</span> on <span className="text-slate-200">{formatDate(r.date)}</span></p>}
                      {r.requestType === 'evening_milk' && <p>Evening: <span className="text-slate-200">{formatMl(r.milkMl || 0)}</span> on <span className="text-slate-200">{formatDate(r.date)}</span></p>}
                      {r.requestType === 'pause_delivery' && <p>Pause: <span className="text-slate-200">{formatDate(r.startDate)}</span> to <span className="text-slate-200">{formatDate(r.endDate)}</span></p>}
                      {r.requestType === 'custom' && (
                        <div className="space-y-0.5">
                          <p>Custom: <span className="text-slate-200">{formatMl(r.milkMl || 0)} {r.milkType}</span> on <span className="text-slate-200">{formatDate(r.date)}</span></p>
                          <p>Time: <span className="text-slate-200">{r.time}</span></p>
                        </div>
                      )}
                      {r.reason && <p>Customer Note: {r.reason}</p>}
                      {r.rejectionReason && <p className="text-red-400 font-medium">Rejected Reason: {r.rejectionReason}</p>}
                      <p className="text-xs text-slate-600">{formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {rejectingId === r.id ? (
                        <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-xl border border-red-900/50">
                          <select 
                            className="form-input text-sm py-1.5 px-2 bg-slate-900 min-w-[160px]"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                          >
                            <option value="">Select Reason...</option>
                            <option value="No Stock">No Stock</option>
                            <option value="Not Serviceable Today">Not Serviceable Today</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setRejectingId(null)} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                            <button 
                              onClick={() => handle(r.id, 'rejected', rejectReason)} 
                              disabled={!rejectReason}
                              className="btn-danger py-1 px-3 text-xs disabled:opacity-50"
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 h-full">
                          <button onClick={() => handle(r.id, 'approved')} className="btn-primary py-2 px-3 text-sm h-10">
                            <MdCheckCircle /> Approve
                          </button>
                          <button onClick={() => { setRejectingId(r.id); setRejectReason('') }} className="btn-danger py-2 px-3 text-sm h-10">
                            <MdCancel /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Requests
