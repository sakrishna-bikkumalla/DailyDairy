import React, { useEffect, useState } from 'react'
import { MdReceipt, MdPrint } from 'react-icons/md'
import { getCustomers } from '../../services/customerService'
import { calculateMonthlyBilling } from '../../services/billingService'
import { formatDate, getMonthName } from '../../utils/dateUtils'
import { formatMl, mlToLiters } from '../../utils/mlUtils'
import toast from 'react-hot-toast'

const Billing = () => {
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { getCustomers().then(setCustomers) }, [])

  const handleCalculate = async () => {
    if (!selectedCustomer) { toast.error('Select a customer'); return }
    setLoading(true)
    try {
      const data = await calculateMonthlyBilling(selectedCustomer, month, year)
      setBilling(data)
    } catch (e) {
      toast.error(e.message || 'Failed to calculate')
    } finally {
      setLoading(false)
    }
  }

  const customer = customers.find(c => c.id === selectedCustomer)

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">Billing</h1>
        <p className="page-subtitle">Calculate monthly milk bills for customers</p>
      </div>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Customer</label>
            <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); setBilling(null) }}
              className="form-input">
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Month</label>
            <select value={month} onChange={e => { setMonth(Number(e.target.value)); setBilling(null) }} className="form-input">
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input type="number" value={year} onChange={e => { setYear(Number(e.target.value)); setBilling(null) }}
              className="form-input" min={2020} max={2030} />
          </div>
        </div>
        <button onClick={handleCalculate} disabled={loading} className="btn-primary mt-4">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdReceipt />}
          Calculate Bill
        </button>
      </div>

      {billing && customer && (
        <div className="card animate-fade-in">
          {/* Bill header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-bold text-white">Monthly Bill</h3>
              <p className="text-slate-400">{getMonthName(billing.month)} {billing.year}</p>
            </div>
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <MdPrint /> Print
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Customer</p>
              <p className="font-semibold text-white">{customer.name}</p>
              <p className="text-sm text-slate-400">{customer.phone}</p>
              <p className="text-sm text-slate-400">{customer.address}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Total Deliveries</span>
                <span className="text-white font-medium">{billing.deliveries.length} days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Total Milk</span>
                <span className="text-white font-medium">{formatMl(billing.totalMl)} ({billing.totalLiters.toFixed(2)}L)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Rate</span>
                <span className="text-white font-medium">₹{billing.pricePerLiter}/Liter</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-lg font-bold text-white">Total Amount</span>
                <span className="text-2xl font-bold text-dairy-green-400">₹{billing.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery detail table */}
          {billing.deliveries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-xs text-slate-400 uppercase">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Delivered</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.deliveries.map(d => (
                    <tr key={d.id} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-slate-300">{formatDate(d.date)}</td>
                      <td className="py-2 pr-4 text-slate-300">{formatMl(d.milkDeliveredMl)}</td>
                      <td className="py-2 text-right text-slate-300">₹{(mlToLiters(d.milkDeliveredMl) * billing.pricePerLiter).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {billing.deliveries.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No completed deliveries recorded this month.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Billing
