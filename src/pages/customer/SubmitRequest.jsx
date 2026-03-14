import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MdSend, MdCheckCircle } from 'react-icons/md'
import { useAuth } from '../../contexts/AuthContext'
import { submitRequest } from '../../services/requestService'
import { getTodayString } from '../../utils/dateUtils'
import toast from 'react-hot-toast'

const REQUEST_TYPES = [
  { key: 'extra_milk', label: '🥛 Extra Milk', desc: 'Request additional milk for a specific date' },
  { key: 'morning_milk', label: '🌅 Morning Milk', desc: 'Request additional milk in the morning' },
  { key: 'evening_milk', label: '🌙 Evening Milk', desc: 'Request additional milk in the evening' },
  { key: 'pause_delivery', label: '⏸ Pause Delivery', desc: 'Stop delivery for a date range (vacation)' },
  { key: 'custom', label: '📝 Custom Request', desc: 'Specify amount, date, time, and milk type' },
]

const SubmitRequest = () => {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [type, setType] = useState(params.get('type') || 'extra_milk')
  const [milkMl, setMilkMl] = useState(500)
  const [date, setDate] = useState(getTodayString())
  const [startDate, setStartDate] = useState(getTodayString())
  const [endDate, setEndDate] = useState(getTodayString())
  const [reason, setReason] = useState('')
  const [time, setTime] = useState('Morning')
  const [milkType, setMilkType] = useState('Cow')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let data = {}
      if (type === 'pause_delivery') {
        data = { startDate, endDate, reason }
      } else if (type === 'custom') {
        data = { milkMl: Number(milkMl), date, time, milkType, reason }
      } else {
        data = { milkMl: Number(milkMl), date }
      }

      await submitRequest(user.linkedId, user.name, type, data)
      toast.success('Request submitted successfully!')
      setSubmitted(true)
    } catch (err) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-dairy-green-900/50 rounded-full flex items-center justify-center mb-4">
          <MdCheckCircle className="text-5xl text-dairy-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
        <p className="text-slate-400 mb-6">Your request is under review. The vendor will respond shortly.</p>
        <div className="flex gap-3">
          <button onClick={() => setSubmitted(false)} className="btn-secondary">Submit Another</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">New Request</h1>
        <p className="page-subtitle">Send a milk delivery request to your vendor</p>
      </div>

      {/* Type selector */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {REQUEST_TYPES.map(t => (
          <button key={t.key} onClick={() => setType(t.key)}
            className={`p-4 rounded-xl text-left border transition-all duration-200 ${
              type === t.key
                ? 'border-dairy-green-600 bg-dairy-green-900/30 text-white'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
            }`}>
            <p className="font-semibold mb-1">{t.label}</p>
            <p className="text-xs opacity-70">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="card max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(type === 'extra_milk' || type === 'morning_milk' || type === 'evening_milk') && (
            <>
              <div>
                <label className="form-label">Milk Quantity (ml)</label>
                <input type="number" className="form-input" value={milkMl}
                  onChange={e => setMilkMl(e.target.value)} min={100} step={100} />
                <p className="text-xs text-slate-500 mt-1">Current: {milkMl}ml = {(milkMl/1000).toFixed(2)}L</p>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={date}
                  onChange={e => setDate(e.target.value)} min={getTodayString()} />
              </div>
            </>
          )}

          {type === 'pause_delivery' && (
            <>
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate}
                  onChange={e => setStartDate(e.target.value)} min={getTodayString()} />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={endDate}
                  onChange={e => setEndDate(e.target.value)} min={startDate} />
              </div>
              <div>
                <label className="form-label">Reason (optional)</label>
                <textarea className="form-input h-20 resize-none" value={reason}
                  onChange={e => setReason(e.target.value)} placeholder="e.g. Going to village for a week" />
              </div>
            </>
          )}

          {type === 'custom' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={date}
                    onChange={e => setDate(e.target.value)} min={getTodayString()} required />
                </div>
                <div>
                  <label className="form-label">Quantity (ml)</label>
                  <input type="number" className="form-input" value={milkMl}
                    onChange={e => setMilkMl(e.target.value)} min={100} step={100} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Time of Delivery</label>
                  <select className="form-input" value={time} onChange={e => setTime(e.target.value)}>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Milk Type</label>
                  <select className="form-input" value={milkType} onChange={e => setMilkType(e.target.value)}>
                    <option value="Cow">Cow Milk</option>
                    <option value="Buffalo">Buffalo Milk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Additional Notes</label>
                <textarea className="form-input h-20 resize-none" value={reason}
                  onChange={e => setReason(e.target.value)} placeholder="Any special instructions..." />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdSend />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SubmitRequest
