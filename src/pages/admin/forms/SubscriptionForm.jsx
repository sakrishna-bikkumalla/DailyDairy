import React, { useState, useEffect } from 'react'
import { MdClose, MdDateRange, MdAccessTime, MdLocalDrink, MdAttachMoney } from 'react-icons/md'

const SubscriptionForm = ({ initial, customer, onSave, onClose }) => {
  // Helpers
  const todayStr = new Date().toISOString().split('T')[0]
  const nextMonthStr = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]

  const [form, setForm] = useState({
    startDate: initial?.startDate || todayStr,
    endDate: initial?.endDate || nextMonthStr,
    slot: initial?.slot || 'Morning',
    dailyQuantityMl: initial?.dailyQuantityMl || customer?.dailyMilkMl || 1000,
    pricePerLiter: initial?.pricePerLiter || customer?.pricePerLiter || 60,
    status: initial?.status || 'active' // active, completed, cancelled
  })

  const [estimatedCost, setEstimatedCost] = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Calculate real-time estimates
  useEffect(() => {
    const s = new Date(form.startDate)
    const e = new Date(form.endDate)
    if (s <= e) {
      const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
      setTotalDays(days)
      const litersPerDay = (Number(form.dailyQuantityMl) || 0) / 1000
      setEstimatedCost(days * litersPerDay * (Number(form.pricePerLiter) || 0))
    } else {
      setTotalDays(0)
      setEstimatedCost(0)
    }
  }, [form.startDate, form.endDate, form.dailyQuantityMl, form.pricePerLiter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (new Date(form.startDate) > new Date(form.endDate)) {
      alert("End Date must be on or after Start Date")
      return
    }
    
    setSaving(true)
    const dataToSave = {
      customerId: customer.id,
      ...form,
      dailyQuantityMl: Number(form.dailyQuantityMl),
      pricePerLiter: Number(form.pricePerLiter)
    }
    await onSave(dataToSave)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-bold text-white text-lg">
              {initial ? 'Edit Subscription' : 'New Subscription'}
            </h2>
            <p className="text-xs text-slate-400">For {customer?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="subForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Status (Edit Only) */}
            {initial && (
              <div>
                <label className="form-label">Subscription Status</label>
                <select 
                  className="form-input bg-slate-800"
                  value={form.status} 
                  onChange={e => set('status', e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label"><MdDateRange className="inline mr-1" /> Start Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={form.startDate} 
                  onChange={e => set('startDate', e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="form-label"><MdDateRange className="inline mr-1" /> End Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={form.endDate} 
                  onChange={e => set('endDate', e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Slot */}
            <div>
              <label className="form-label"><MdAccessTime className="inline mr-1" /> Delivery Slot</label>
              <select className="form-input" value={form.slot} onChange={e => set('slot', e.target.value)}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            {/* Milk & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label"><MdLocalDrink className="inline mr-1" /> Daily Quantity (ml)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.dailyQuantityMl} 
                  onChange={e => set('dailyQuantityMl', e.target.value)}
                  min="50" step="50" required 
                />
              </div>
              <div>
                <label className="form-label"><MdAttachMoney className="inline mr-1" /> Price / Liter (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.pricePerLiter} 
                  onChange={e => set('pricePerLiter', e.target.value)}
                  min="1" step="1" required 
                />
              </div>
            </div>

            {/* Estimation Card */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Estimation Summary</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Total Duration</span>
                <span className="font-semibold text-white">{totalDays} Days</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-300">Total Volume</span>
                <span className="font-semibold text-white">
                  {((totalDays * (Number(form.dailyQuantityMl)||0)) / 1000).toFixed(1)} Liters
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-500/20 mt-2">
                <span className="text-sm text-slate-300">Total Estimated Cost</span>
                <span className="text-lg font-bold text-dairy-green-400">₹{estimatedCost.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                * Cost is estimated based on scheduled deliveries. Actual billed cost may vary if deliveries are skipped or partially delivered.
              </p>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 shrink-0 flex gap-3 bg-slate-900/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">
            Cancel
          </button>
          <button type="submit" form="subForm" disabled={saving || totalDays <= 0} className="btn-primary flex-1 justify-center py-2.5">
            {saving ? 'Saving...' : 'Save Subscription'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default SubscriptionForm
