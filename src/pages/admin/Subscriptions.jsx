import React, { useEffect, useState } from 'react'
import { MdAssignment, MdLocalShipping, MdAttachMoney, MdClose, MdRefresh, MdSearch } from 'react-icons/md'
import { getCustomers } from '../../services/customerService'
import { getCustomerSubscriptionDetails } from '../../services/subscriptionService'
import { formatMl } from '../../utils/mlUtils'
import { formatDate } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const Subscriptions = () => {
  const [customers, setCustomers] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')

  // Load Customer List
  const loadCustomers = async () => {
    setLoadingList(true)
    try {
      setCustomers(await getCustomers())
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => { loadCustomers() }, [])

  // Load Specific Customer Subscription Details
  const handleSelectCustomer = async (id) => {
    setSelectedCustomerId(id)
    setDetails(null)
    setLoadingDetails(true)
    try {
      const data = await getCustomerSubscriptionDetails(id)
      setDetails(data)
    } catch (e) {
      toast.error(e.message || 'Failed to load details')
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="page-header">Manage Subscriptions</h1>
          <p className="page-subtitle">Track lifetime delivery metrics and subscription health</p>
        </div>
        <button onClick={loadCustomers} className="btn-secondary p-3"><MdRefresh /></button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Customer List */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input 
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-dairy-green-500 transition-shadow transition-colors"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar">
            {loadingList ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (() => {
              const filteredCustomers = customers.filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.phone && c.phone.includes(searchTerm))
              )

              if (filteredCustomers.length === 0) {
                return <p className="text-slate-500 text-sm text-center py-6 block bg-slate-800/30 rounded-xl border border-slate-800">No customers match your search.</p>
              }

              return filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectCustomer(c.id)}
                className={`w-full text-left card transition-all p-4 ${
                  selectedCustomerId === c.id 
                    ? 'border-dairy-green-500 bg-dairy-green-900/20 shadow-md ring-1 ring-dairy-green-500/50' 
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-white truncate">{c.name}</p>
                  <span className="badge-blue shrink-0">{formatMl(c.dailyMilkMl)}/day</span>
                </div>
                <p className="text-xs text-slate-400 capitalize truncate">{c.city || 'Address not listed'}</p>
              </button>
            ))
            })()}
          </div>
        </div>

        {/* Right Col: Details Panel */}
        <div className="lg:col-span-2">
          {selectedCustomerId ? (
            <div className="card sticky top-6 animate-fade-in">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Crunching lifetime data...</p>
                </div>
              ) : details ? (
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-700/50">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{details.customer.name}</h2>
                      <p className="text-slate-400 text-sm">{details.customer.phone}</p>
                      <p className="text-slate-500 text-xs mt-1">{details.customer.address}</p>
                    </div>
                    <button onClick={() => setSelectedCustomerId(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                      <MdClose className="text-xl" />
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg"><MdLocalShipping /></div>
                        <h3 className="text-sm font-medium text-slate-300">Lifetime Deliveries</h3>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">
                        {details.stats.lifetimeLiters.toFixed(1)} <span className="text-lg text-slate-500 font-normal">Liters</span>
                      </p>
                      <p className="text-xs text-slate-500">Across {details.stats.totalDeliveriesCompleted} successful days</p>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-dairy-green-900/30 text-dairy-green-400 rounded-lg"><MdAttachMoney /></div>
                        <h3 className="text-sm font-medium text-slate-300">Lifetime Billed</h3>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">
                        <span className="text-lg text-slate-500 font-normal mr-1">₹</span>
                        {details.stats.lifetimeBilled.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">At ₹{details.stats.pricePerLiter}/Liter rate</p>
                    </div>
                  </div>

                  {/* Delivery History Log */}
                  <h3 className="text-lg font-bold text-white mb-4">Delivery History</h3>
                  {details.history.length === 0 ? (
                    <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <MdAssignment className="text-4xl text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No delivery events logged yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800/50 text-slate-400 uppercase text-xs border-b border-slate-700">
                            <th className="text-left font-medium p-3">Date</th>
                            <th className="text-left font-medium p-3">Status</th>
                            <th className="text-left font-medium p-3">Scheduled</th>
                            <th className="text-right font-medium p-3">Delivered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.history.map(d => (
                            <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 text-white">{formatDate(d.date)}</td>
                              <td className="p-3">
                                <span className={`badge ${
                                  d.status === 'delivered' ? 'badge-green' : d.status === 'pending' ? 'badge-amber' : 'badge-red'
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300">{formatMl(d.milkScheduledMl)}</td>
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
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-900 border border-slate-800 border-dashed rounded-3xl">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500">
                <MdAssignment className="text-3xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select a Customer</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Click on any customer from the list to view their complete lifetime delivery metrics and subscription history.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Subscriptions
