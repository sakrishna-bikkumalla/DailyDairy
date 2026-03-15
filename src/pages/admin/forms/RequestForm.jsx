import React, { useState } from 'react'
import { MdClose, MdAssignment } from 'react-icons/md'

const RequestForm = ({ customer, onSave, onClose }) => {
  const [form, setForm] = useState({
    type: 'pause_delivery',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const dataToSave = {
      customerId: customer.id,
      customerName: customer.name,
      requestType: form.type,
      targetDate: form.date, // the date the request applies to
      description: form.description
    }
    await onSave(dataToSave)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-white text-lg">Log Customer Request</h2>
            <p className="text-xs text-slate-400">For {customer?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800">
            <MdClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="form-label">Request Type</label>
            <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="pause_delivery">Pause Delivery</option>
              <option value="resume_delivery">Resume Delivery</option>
              <option value="extra_milk">Extra Milk</option>
              <option value="change_slot">Change Slot</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="form-label">Target Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={form.date} 
              onChange={e => set('date', e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="form-label">Notes / Description</label>
            <textarea 
              className="form-input h-24 resize-none" 
              placeholder="e.g. Pause for 3 days going out of town..."
              value={form.description} 
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? 'Saving...' : 'Save Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default RequestForm
