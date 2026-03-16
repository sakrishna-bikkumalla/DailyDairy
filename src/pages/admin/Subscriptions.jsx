import React, { useEffect, useState, useMemo } from 'react'
import { MdAssignment, MdLocalShipping, MdAttachMoney, MdClose, MdRefresh, MdSearch, MdAdd, MdFilterList, MdDateRange, MdAccessTime, MdEdit, MdReceipt, MdPrint, MdPause, MdPlayArrow, MdDelete } from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import { getCustomers } from '../../services/customerService'
import { getAgents } from '../../services/agentService'
import { getCustomerSubscriptionDetails, addSubscription, updateSubscription, syncPendingDeliveries, stopSubscription, resumeSubscription, deleteSubscription } from '../../services/subscriptionService'
import { getCustomerRequests, submitRequest } from '../../services/requestService'
import { formatMl, mlToLiters } from '../../utils/mlUtils'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'
import SubscriptionForm from './forms/SubscriptionForm'
import RequestForm from './forms/RequestForm'

const Subscriptions = () => {
  const [customers, setCustomers] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [details, setDetails] = useState(null)
  const [requests, setRequests] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [showSubForm, setShowSubForm] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [showReqForm, setShowReqForm] = useState(false)

  // Detailed View States
  const [activeTab, setActiveTab] = useState('subscriptions') // 'subscriptions' | 'history' | 'requests'
  const [selectedSubId, setSelectedSubId] = useState(null)
  
  // Filters for history
  const [historyFilterFromDate, setHistoryFilterFromDate] = useState('')
  const [historyFilterToDate, setHistoryFilterToDate] = useState('')
  const [historyFilterAgent, setHistoryFilterAgent] = useState('')
  const [agents, setAgents] = useState([])

  // Billing Tab States
  const [billingSelectedSubId, setBillingSelectedSubId] = useState('')
  const [billingData, setBillingData] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)

  const loadCustomers = async () => {
    setLoadingList(true)
    try { setCustomers(await getCustomers()) } 
    catch { toast.error('Failed to load customers') } 
    finally { setLoadingList(false) }
  }

  useEffect(() => { 
    loadCustomers()
    getAgents().then(setAgents).catch(console.error)
  }, [])

  const loadDetails = async (id) => {
    setLoadingDetails(true)
    try {
      const parts = await Promise.all([
        getCustomerSubscriptionDetails(id),
        getCustomerRequests(id)
      ])
      const data = parts[0]
      setDetails(data)
      setRequests(parts[1])
      
      // Auto-select the first currently active subscription if any
      const activeSubs = data.subscriptions.filter(s => s.status === 'active')
      if (activeSubs.length > 0) {
        setSelectedSubId(activeSubs[0].id)
      } else if (data.subscriptions.length > 0) {
        setSelectedSubId(data.subscriptions[0].id)
      } else {
        setSelectedSubId(null)
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSelectCustomer = (id) => {
    setSelectedCustomerId(id)
    setActiveTab('subscriptions')
    setHistoryFilterFromDate('')
    setHistoryFilterToDate('')
    setHistoryFilterAgent('')
    setBillingSelectedSubId('')
    setBillingData(null) // Reset billing data when switching customers
    loadDetails(id)
  }

  // Save Handlers
  const handleSaveSub = async (data) => {
    try {
      if (editSub) { // Assuming editSub is the object, so editSub.id is the ID
        await updateSubscription(editSub.id, data)
        await syncPendingDeliveries(editSub.id) // Call syncPendingDeliveries with the ID of the updated subscription
        toast.success("Subscription updated")
      } else {
        const docRef = await addSubscription(data) // addSubscription now returns a docRef
        await syncPendingDeliveries(docRef.id) // Call syncPendingDeliveries with the ID of the newly added subscription
        toast.success("Subscription added")
      }
      setShowSubForm(false)
      loadDetails(selectedCustomerId)
    } catch {
      toast.error("Failed to save subscription")
    }
  }

  const handleSaveReq = async (data) => {
    try {
      await submitRequest(data.customerId, data.customerName, data.requestType, {
        targetDate: data.targetDate,
        description: data.description
      })
      toast.success("Request logged")
      setShowReqForm(false)
      loadDetails(selectedCustomerId)
    } catch {
      toast.error("Failed to log request")
    }
  }

  const handleStopSub = async (id) => {
    if (!window.confirm("Are you sure you want to stop this subscription? All future pending deliveries will be cancelled.")) return
    try {
      await stopSubscription(id)
      toast.success("Subscription stopped")
      loadDetails(selectedCustomerId)
    } catch {
      toast.error("Failed to stop subscription")
    }
  }

  const handleResumeSub = async (id) => {
    try {
      await resumeSubscription(id)
      toast.success("Subscription resumed")
      loadDetails(selectedCustomerId)
    } catch {
      toast.error("Failed to resume subscription")
    }
  }

  const handleDeleteSub = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription? It will be moved to the deleted tab and all future deliveries will be cancelled.")) return
    try {
      await deleteSubscription(id)
      toast.success("Subscription deleted")
      loadDetails(selectedCustomerId)
    } catch {
      toast.error("Failed to delete subscription")
    }
  }

  const handleCalculateBill = async () => {
    if (!selectedCustomerId || !billingSelectedSubId) return
    const sub = details.subscriptions.find(s => s.id === billingSelectedSubId)
    if (!sub) return

    setBillingLoading(true)
    try {
      // 1. Regular deliveries from sub.history (which is already filtered by dates)
      const baseDeliveries = sub.history.filter(d => d.status === 'delivered')
      const baseTotalMl = baseDeliveries.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
      const baseTotalLiters = baseTotalMl / 1000
      const price = sub.pricePerLiter || 60
      const baseCost = baseTotalLiters * price

      // 2. Extra requests (approved extra_milk within dates)
      const extraRequests = requests.filter(r => 
        r.requestType === 'extra_milk' && 
        r.status === 'approved' &&
        r.date >= sub.startDate &&
        r.date <= sub.endDate
      )
      const extraTotalMl = extraRequests.reduce((sum, r) => sum + (r.milkMl || 0), 0)
      const extraTotalLiters = extraTotalMl / 1000
      const extraCost = extraTotalLiters * price

      // 3. Prepare combined data for UI
      setBillingData({
        sub,
        baseDeliveries,
        extraRequests,
        summary: {
          baseCost,
          extraCost,
          totalAmount: baseCost + extraCost,
          baseLiters: baseTotalLiters,
          extraLiters: extraTotalLiters,
          pricePerLiter: price
        }
      })
    } catch (e) {
      toast.error('Failed to calculate bill')
    } finally {
      setBillingLoading(false)
    }
  }

  // Filtered History for the selected subscription
  const selectedSub = details?.subscriptions.find(s => s.id === selectedSubId)
  
  const filteredHistory = useMemo(() => {
    if (!selectedSub) return []
    let h = selectedSub.history
    if (historyFilterFromDate) {
      h = h.filter(d => d.date >= historyFilterFromDate)
    }
    if (historyFilterToDate) {
      h = h.filter(d => d.date <= historyFilterToDate)
    }
    if (historyFilterAgent) {
      h = h.filter(d => d.agentId === historyFilterAgent)
    }
    return h
  }, [selectedSub, historyFilterFromDate, historyFilterToDate, historyFilterAgent])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-header">Manage Subscriptions</h1>
          <p className="page-subtitle">Track plans, delivery histories, and costs</p>
        </div>
        <button onClick={loadCustomers} className="btn-secondary p-3"><MdRefresh /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-6">
        
        {/* LEFT COLUMN: Customer List */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-dairy-green-500"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar">
            {loadingList ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (() => {
              const filteredList = customers.filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)
              )
              if (filteredList.length === 0) return <p className="text-slate-500 text-sm text-center py-6 block bg-slate-800/30 rounded-xl border border-slate-800">No customers match.</p>

              return filteredList.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c.id)}
                  className={`w-full text-left card transition-all p-4 ${
                    selectedCustomerId === c.id 
                      ? 'border-dairy-green-500 bg-dairy-green-900/20 shadow-md ring-1 ring-dairy-green-500/50' 
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-semibold text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-1">{c.phone}</p>
                </button>
              ))
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Subscription Dashboard */}
        <div>
          {selectedCustomerId ? (
            <div className="card sticky top-6 animate-fade-in flex flex-col min-h-[600px]">
              {loadingDetails ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Loading deep metrics...</p>
                </div>
              ) : details ? (
                <>
                  {/* Top Profile Header */}
                  <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{details.customer.name}</h2>
                      <p className="text-slate-400 text-sm">{details.customer.phone} • {details.customer.address}</p>
                    </div>
                    <button onClick={() => setSelectedCustomerId(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                      <MdClose className="text-xl" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-4 mb-6 border-b border-slate-700">
                    {['subscriptions', 'requests', 'billing', 'deleted'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                          activeTab === tab ? 'border-dairy-green-500 text-dairy-green-400' : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab === 'subscriptions' ? 'Plans & Deliveries' : tab}
                      </button>
                    ))}
                  </div>

                  {/* TAB: PLANS & DELIVERIES */}
                  {activeTab === 'subscriptions' && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Active & Past Plans</h3>
                        <button onClick={() => { setEditSub(null); setShowSubForm(true) }} className="btn-primary py-1.5 text-sm">
                          <MdAdd /> New Plan
                        </button>
                      </div>

                      {details.subscriptions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50 flex-1">
                          <GiMilkCarton className="text-5xl text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No specific plans added yet.</p>
                          <p className="text-slate-500 text-xs mt-1">Historically, deliveries were driven by baseline profile settings.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[300px_1fr] gap-6 flex-1 items-start">
                                                   {/* Plan List Sidebar */}
                          <div className="space-y-3 pr-2 overflow-y-auto max-h-[500px] custom-scrollbar">
                            {details.subscriptions
                              .filter(s => s.status !== 'deleted')
                              .map(s => (
                                <div 
                                  key={s.id}
                                  onClick={() => setSelectedSubId(s.id)}
                                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                    selectedSubId === s.id ? 'bg-blue-900/20 border-blue-500 shrink-0 shadow-md ring-1 ring-blue-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-1">
                                      <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status==='completed' ? 'badge-blue' : s.status === 'stopped' ? 'badge-amber' : 'badge-red'}`}>
                                        {s.status}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      {s.status === 'active' && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleStopSub(s.id) }} 
                                          className="p-1 rounded text-amber-500 hover:bg-amber-500/10"
                                          title="Stop/Pause Subscription"
                                        >
                                          <MdPause />
                                        </button>
                                      )}
                                      {s.status === 'stopped' && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleResumeSub(s.id) }} 
                                          className="p-1 rounded text-dairy-green-500 hover:bg-dairy-green-500/10"
                                          title="Resume Subscription"
                                        >
                                          <MdPlayArrow />
                                        </button>
                                      )}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setEditSub(s); setShowSubForm(true) }} 
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                                        title="Edit Plan"
                                      >
                                        <MdEdit />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSub(s.id) }} 
                                        className="p-1 rounded text-red-500 hover:bg-red-500/10"
                                        title="Delete Subscription"
                                      >
                                        <MdDelete />
                                      </button>
                                    </div>
                                  </div>
                                <div className="text-sm text-white font-medium mb-1">
                                  {formatDate(s.startDate)} <span className="text-slate-500 mx-1">→</span> {formatDate(s.endDate)}
                                </div>
                                <div className="flex gap-2 text-xs font-medium mt-3">
                                  <span className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700 shrink-0">
                                    <MdAccessTime className="inline mr-1" />{s.slot}
                                  </span>
                                  <span className="bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700 shrink-0">
                                    {formatMl(s.dailyQuantityMl)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Selected Plan Details Area */}
                          {selectedSub ? (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 shadow-inner min-h-[500px] flex flex-col">
                              <h3 className="text-lg font-bold text-white mb-4">Plan deep-dive</h3>
                              
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/50 shrink-0">
                                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Timeline</p>
                                  <p className="text-xl font-bold text-white">{selectedSub.metrics.daysCompleted} <span className="text-sm text-slate-400 font-normal">/ {selectedSub.metrics.totalDays}</span></p>
                                  <p className="text-xs text-amber-500 mt-1">{selectedSub.metrics.daysLeft} days left</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/50 shrink-0">
                                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Deliveries</p>
                                  <p className="text-xl font-bold text-white">{selectedSub.metrics.deliveriesCompleted}</p>
                                  <p className="text-xs text-slate-400 mt-1">out of {selectedSub.metrics.deliveriesScheduled} logged events</p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/20 lg:col-span-2 shrink-0">
                                  <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">Cost Tracking (₹{selectedSub.pricePerLiter || 60}/L)</p>
                                  <div className="flex justify-between items-end mt-1">
                                    <div>
                                      <span className="text-xs text-slate-400 block">Actual Billed Cost</span>
                                      <p className="text-2xl font-bold text-dairy-green-400">₹{selectedSub.metrics.actualCost.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs text-slate-400 block">Estimated (100% Rate)</span>
                                      <p className="text-md font-semibold text-slate-300">₹{selectedSub.metrics.estimatedCost.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-slate-300">Range History Log</h4>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <MdFilterList className="text-slate-400" />
                                  <input 
                                    type="date" 
                                    value={historyFilterFromDate}
                                    onChange={e => setHistoryFilterFromDate(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-white px-2 py-1.5 rounded outline-none [color-scheme:dark]"
                                    title="From Date"
                                  />
                                  <span className="text-slate-500 text-xs">to</span>
                                  <input 
                                    type="date" 
                                    value={historyFilterToDate}
                                    onChange={e => setHistoryFilterToDate(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-white px-2 py-1.5 rounded outline-none [color-scheme:dark]"
                                    title="To Date"
                                  />
                                  <select 
                                    value={historyFilterAgent}
                                    onChange={e => setHistoryFilterAgent(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-white px-2 py-1.5 rounded outline-none [color-scheme:dark] max-w-[120px] truncate"
                                  >
                                    <option value="">All Agents</option>
                                    {agents.map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                  </select>
                                  {(historyFilterFromDate || historyFilterToDate || historyFilterAgent) && (
                                    <button onClick={() => { setHistoryFilterFromDate(''); setHistoryFilterToDate(''); setHistoryFilterAgent('') }} className="text-xs text-blue-400 hover:underline">Clear</button>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto bg-slate-900 rounded-xl border border-slate-700/50 custom-scrollbar">
                                {filteredHistory.length === 0 ? (
                                  <div className="p-6 text-center text-slate-500 text-sm">No delivery records matched the criteria.</div>
                                ) : (
                                  <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-slate-800 text-slate-400 uppercase text-xs z-10">
                                      <tr>
                                        <th className="text-left font-medium p-3">Date</th>
                                        <th className="text-left font-medium p-3">Status</th>
                                        <th className="text-left font-medium p-3">Scheduled</th>
                                        <th className="text-right font-medium p-3">Delivered</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredHistory.map(d => (
                                        <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800 transition-colors">
                                          <td className="p-3 text-white">{formatDate(d.date)}</td>
                                          <td className="p-3">
                                            <span className={`badge ${d.status === 'delivered' ? 'badge-green' : d.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                                              {d.status}
                                            </span>
                                          </td>
                                          <td className="p-3 text-slate-400">{formatMl(d.milkScheduledMl)}</td>
                                          <td className="p-3 text-right">
                                            {d.status === 'delivered' ? (
                                              <span className="font-semibold text-dairy-green-400">{formatMl(d.milkDeliveredMl)}</span>
                                            ) : (
                                              <span className="text-slate-600">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>

                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 italic">Select a plan to view details</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: REQUESTS */}
                  {activeTab === 'requests' && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Action Requests</h3>
                        <button onClick={() => setShowReqForm(true)} className="btn-primary py-1.5 text-sm">
                          <MdAdd /> New Request
                        </button>
                      </div>

                      {requests.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50">
                          <MdAssignment className="text-5xl text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No special requests historically.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {requests.map(r => (
                            <div key={r.id} className="card border border-slate-700 flex flex-col sm:flex-row gap-4 p-4">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`badge uppercase tracking-wider text-[10px] ${r.status === 'pending' ? 'badge-amber' : 'badge-green'}`}>
                                    {r.status}
                                  </span>
                                  <span className="text-xs text-slate-500 text-right">Target Date: <strong className="text-slate-300">{formatDate(r.targetDate || r.date)}</strong></span>
                                </div>
                                <p className="font-bold text-white mb-2 tracking-wide uppercase">{r.requestType.replace('_', ' ')}</p>
                                <p className="text-sm text-slate-400 border-l-2 border-slate-600 pl-3">{r.description || r.extraInfo || 'No extra notes provided.'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: BILLING */}
                  {activeTab === 'billing' && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Monthly Billing</h3>
                      </div>

                      <div className="card border border-slate-700 p-4 mb-6 relative z-20">
                        <div className="flex flex-col gap-4">
                          <div>
                            <label className="form-label">Select Subscription</label>
                            <select 
                              value={billingSelectedSubId} 
                              onChange={e => { setBillingSelectedSubId(e.target.value); setBillingData(null) }} 
                              className="form-input bg-slate-800"
                            >
                              <option value="">Choose a plan...</option>
                              {details.subscriptions.map(s => (
                                <option key={s.id} value={s.id}>
                                  {formatDate(s.startDate)} to {formatDate(s.endDate)} ({s.status})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button onClick={handleCalculateBill} disabled={billingLoading || !billingSelectedSubId} className="btn-primary mt-4 w-full justify-center">
                          {billingLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdReceipt />}
                          Calculate Bill
                        </button>
                      </div>

                      {billingData && (
                        <div className="card border border-slate-700 p-5 mt-auto mb-auto animate-fade-in flex-1">
                          {/* Bill header */}
                          <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-700/50">
                            <div>
                              <h3 className="text-xl font-bold text-white">Invoice Summary</h3>
                              <p className="text-slate-400">{formatDate(billingData.sub.startDate)} — {formatDate(billingData.sub.endDate)}</p>
                            </div>
                            <button onClick={() => window.print()} className="btn-secondary text-sm px-3 py-1.5 h-auto">
                              <MdPrint /> Print
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Regular Deliveries</p>
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Count</span>
                                <span className="text-white font-medium">{billingData.baseDeliveries.length} days</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Volume</span>
                                <span className="text-white font-medium">{billingData.summary.baseLiters.toFixed(2)}L</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-400 text-sm">Cost</span>
                                <span className="text-white font-bold">₹{billingData.summary.baseCost.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="space-y-2 bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                              <p className="text-xs text-blue-400 uppercase font-bold mb-2">Extra Requests</p>
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Count</span>
                                <span className="text-white font-medium">{billingData.extraRequests.length} requests</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 text-sm">Volume</span>
                                <span className="text-white font-medium">{billingData.summary.extraLiters.toFixed(2)}L</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-400 text-sm">Cost</span>
                                <span className="text-blue-400 font-bold">₹{billingData.summary.extraCost.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 font-bold">
                            <span className="text-lg text-white">Total Bill Amount <span className="text-xs font-normal text-slate-400 block">at ₹{billingData.summary.pricePerLiter}/L</span></span>
                            <span className="text-3xl text-dairy-green-400">₹{billingData.summary.totalAmount.toFixed(2)}</span>
                          </div>

                          {/* Combined Table */}
                          <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar rounded-xl border border-slate-700/50 bg-slate-900">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-slate-800 text-slate-400 uppercase text-xs">
                                <tr>
                                  <th className="text-left font-medium py-3 px-4">Date</th>
                                  <th className="text-left font-medium py-3 px-4">Type</th>
                                  <th className="text-left font-medium py-3 px-4">Quantity</th>
                                  <th className="text-right font-medium py-3 px-4">Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Mix and Sort regular vs extra */}
                                {[
                                  ...billingData.baseDeliveries.map(d => ({ ...d, billingType: 'Regular' })),
                                  ...billingData.extraRequests.map(r => ({ ...r, date: r.date, milkDeliveredMl: r.milkMl, billingType: 'Extra Request' }))
                                ]
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((item, idx) => (
                                  <tr key={idx} className="border-b border-slate-800/50">
                                    <td className="py-2.5 px-4 text-slate-300">{formatDate(item.date)}</td>
                                    <td className="py-2.5 px-4">
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.billingType === 'Regular' ? 'bg-slate-800 text-slate-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                        {item.billingType}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-300">{formatMl(item.milkDeliveredMl)}</td>
                                    <td className="py-2.5 px-4 text-right font-medium text-dairy-green-400">
                                      ₹{(mlToLiters(item.milkDeliveredMl) * billingData.summary.pricePerLiter).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: DELETED */}
                  {activeTab === 'deleted' && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Deleted Subscriptions</h3>
                      </div>

                      {details.subscriptions.filter(s => s.status === 'deleted').length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50 flex-1">
                          <MdDelete className="text-5xl text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No deleted subscriptions found.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {details.subscriptions
                            .filter(s => s.status === 'deleted')
                            .map(s => (
                              <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 opacity-75">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="badge badge-red uppercase tracking-wider text-[10px]">DELETED</span>
                                  <button 
                                    onClick={() => handleResumeSub(s.id)} 
                                    className="text-xs text-blue-400 hover:underline uppercase font-bold"
                                  >
                                    Restore
                                  </button>
                                </div>
                                <div className="text-sm text-white font-medium">
                                  {formatDate(s.startDate)} <span className="text-slate-500 mx-1">→</span> {formatDate(s.endDate)}
                                </div>
                                <div className="flex gap-2 text-xs text-slate-400 mt-3">
                                  <span>{s.slot}</span>
                                  <span>•</span>
                                  <span>{formatMl(s.dailyQuantityMl)}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                </>
              ) : null}
            </div>
          ) : (
           <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 bg-slate-900 border border-slate-800 border-dashed rounded-3xl">
             <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
               <MdAssignment className="text-3xl" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Select a Customer</h3>
             <p className="text-slate-500 text-sm max-w-sm">
               Click on any customer from the list to manage their formal subscription plans and track requests history.
             </p>
           </div>
          )}
        </div>
      </div>

      {showSubForm && (
        <SubscriptionForm
          initial={editSub}
          customer={details?.customer}
          onSave={handleSaveSub}
          onClose={() => setShowSubForm(false)}
        />
      )}

      {showReqForm && (
        <RequestForm
          customer={details?.customer}
          onSave={handleSaveReq}
          onClose={() => setShowReqForm(false)}
        />
      )}
      
    </div>
  )
}

export default Subscriptions
