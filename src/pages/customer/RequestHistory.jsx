import React, { useEffect, useState } from 'react'
import { MdInbox } from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext'
import { getCustomerRequests } from '../../services/requestService'
import { getDeliveriesByCustomer } from '../../services/deliveryService'
import { formatDate, formatDateTime } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import toast from 'react-hot-toast'

const reqTypeInfo = {
  extra_milk: { label: 'Extra Milk 🥛', color: 'badge-blue' },
  morning_milk: { label: 'Morning Milk 🌅', color: 'badge-green' },
  evening_milk: { label: 'Evening Milk 🌙', color: 'badge-purple' },
  pause_delivery: { label: 'Pause Delivery ⏸', color: 'badge-amber' },
  custom: { label: 'Custom Request 📝', color: 'badge-blue' },
}

const RequestHistory = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    const load = async () => {
      try {
        const [reqs, dels] = await Promise.all([
          getCustomerRequests(user.linkedId),
          getDeliveriesByCustomer(user.linkedId)
        ])
        setRequests(reqs)
        setDeliveries(dels)
      } catch (e) {
        console.error("Fetch history error:", e)
        toast.error('Failed to load history: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">My Requests</h1>
        <p className="page-subtitle">History of all your milk requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-16">
          <MdInbox className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No requests submitted yet</p>
          <p className="text-xs text-slate-600 mt-2">Need extra milk or going on vacation? Submit a new request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => {
            const ti = reqTypeInfo[r.requestType] || { label: r.requestType, color: 'badge-blue' }
            return (
              <div key={r.id} className="card relative overflow-hidden">
                {/* Status indicator strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${r.status === 'pending' ? 'bg-amber-500' : r.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                
                <div className="ml-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={ti.color}>{ti.label}</span>
                    <span className={`badge ${r.status === 'pending' ? 'badge-amber' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {r.requestType === 'extra_milk' && (
                      <p className="text-slate-300">Requested <span className="font-semibold text-white">{formatMl(r.milkMl || 0)}</span> on <span className="font-semibold text-white">{formatDate(r.date)}</span></p>
                    )}
                    {r.requestType === 'morning_milk' && (
                      <p className="text-slate-300">Requested <span className="font-semibold text-white">{formatMl(r.milkMl || 0)}</span> on <span className="font-semibold text-white">{formatDate(r.date)}</span> (Morning)</p>
                    )}
                    {r.requestType === 'evening_milk' && (
                      <p className="text-slate-300">Requested <span className="font-semibold text-white">{formatMl(r.milkMl || 0)}</span> on <span className="font-semibold text-white">{formatDate(r.date)}</span> (Evening)</p>
                    )}
                    {r.requestType === 'pause_delivery' && (
                      <p className="text-slate-300">Pause delivery from <span className="font-semibold text-white">{formatDate(r.startDate)}</span> to <span className="font-semibold text-white">{formatDate(r.endDate)}</span></p>
                    )}
                    {r.requestType === 'custom' && (
                      <div className="space-y-1">
                        <p className="text-slate-300">Requested <span className="font-semibold text-white">{formatMl(r.milkMl || 0)} {r.milkType} milk</span> on <span className="font-semibold text-white">{formatDate(r.date)}</span></p>
                        <p className="text-slate-400 text-xs">Delivery Time: <span className="text-slate-300">{r.time}</span></p>
                      </div>
                    )}
                    
                    {r.reason && <p className="text-slate-400 text-xs mt-2 italic">Reason: {r.reason}</p>}
                    
                    {r.status === 'approved' && (() => {
                      const delivery = deliveries.find(d => d.requestId === r.id)
                      const showDeliveryStatus = ['extra_milk', 'morning_milk', 'evening_milk', 'custom'].includes(r.requestType)
                      
                      return (
                        <div className="mt-3 overflow-hidden rounded-lg border border-dairy-green-700/30">
                          <div className="p-2.5 bg-dairy-green-900/10 flex justify-between items-center">
                            <p className="text-dairy-green-400 text-xs font-black tracking-wider flex items-center gap-1.5 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-dairy-green-500 animate-pulse" />
                              Approved Request & Fulfillment
                            </p>
                          </div>
                          
                          {showDeliveryStatus && (
                            <div className="p-3 bg-slate-900/50 flex flex-col gap-2.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Delivery Status</span>
                                {delivery ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                    delivery.status === 'delivered' ? 'bg-dairy-green-500/20 text-dairy-green-400' : 
                                    delivery.status === 'skipped' ? 'bg-red-500/20 text-red-500' : 
                                    'bg-amber-500/20 text-amber-500'
                                  }`}>
                                    {delivery.status}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 italic">Connecting to route...</span>
                                )}
                              </div>
                              
                              {delivery?.status === 'delivered' && (
                                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-2">
                                  <span>Quantity Received: {formatMl(delivery.milkDeliveredMl)}</span>
                                  {delivery.deliveredAt && <span>Time: {formatDateTime(delivery.deliveredAt).split(' ')[1]}</span>}
                                </div>
                              )}

                              {delivery?.status === 'skipped' && (
                                <p className="text-[10px] text-red-400 italic">No delivery: {delivery.skipReason || 'Agent skipped'}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    
                    {r.status === 'rejected' && (
                      <div className="mt-3 p-2 bg-red-900/10 border border-red-900/30 rounded-lg">
                        <p className="text-red-400 text-xs font-medium mb-1">
                          We are sorry for the inconvenience, but your request could not be fulfilled at this time.
                        </p>
                        {r.rejectionReason && (
                          <p className="text-red-300/80 text-xs italic">• Reason: {r.rejectionReason}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <p className="text-xs text-slate-600">Submitted: {formatDateTime(r.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RequestHistory
