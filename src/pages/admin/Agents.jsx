import React, { useEffect, useState } from 'react'
import { MdAdd, MdEdit, MdDelete, MdDeliveryDining, MdLock } from 'react-icons/md'
import { getAgents, createAgentWithAccount, updateAgent, deleteAgent } from '../../services/agentService'
import toast from 'react-hot-toast'

const AgentForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ name: initial?.name || '', phone: initial?.phone || '', assignedArea: initial?.assignedArea || '' })
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const dataToSave = {
      ...form,
      ...(!initial && { password: password.trim() || form.phone })
    }
    await onSave(dataToSave)
    setSaving(false)
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">{initial ? 'Edit Agent' : 'Add Delivery Agent'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800"><span>×</span></button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-4">
          <div><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div><label className="form-label">Phone *</label><input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={10} required /></div>
          
          {!initial && (
            <div>
              <label className="form-label">
                Login Password
                <span className="ml-1 text-slate-500 font-normal">(default: phone number if left blank)</span>
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="form-input pl-10"
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={`Default: ${form.phone || 'phone number'}`}
                />
              </div>
            </div>
          )}

          <div><label className="form-label">Assigned Area</label><input className="form-input" value={form.assignedArea} onChange={e => set('assignedArea', e.target.value)} placeholder="e.g. North Zone" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? '...' : (initial ? 'Update' : 'Add Agent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Agents = () => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try { setAgents(await getAgents()) }
    catch { toast.error('Failed to load agents') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    try {
      if (editTarget) {
        await updateAgent(editTarget.id, data)
        toast.success('Agent updated')
      } else {
        const { defaultPassword } = await createAgentWithAccount(data)
        toast.success(
          `✅ Agent added!\nLogin: ${data.phone} / ${defaultPassword}`,
          { duration: 8000 }
        )
      }
      setShowForm(false)
      load()
    } catch { toast.error('Failed to save') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete agent "${name}"?`)) return
    try { await deleteAgent(id); toast.success('Agent deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-header">Delivery Agents</h1><p className="page-subtitle">{agents.length} registered agents</p></div>
        <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="btn-primary"><MdAdd /> Add Agent</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.length === 0 && (
            <div className="col-span-full card text-center py-16">
              <MdDeliveryDining className="text-5xl text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No agents yet</p>
              <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="btn-primary mt-4 mx-auto">Add First Agent</button>
            </div>
          )}
          {agents.map(a => (
            <div key={a.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-400 text-2xl font-bold">
                  {a.name[0]}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditTarget(a); setShowForm(true) }} className="p-2 rounded-lg text-slate-400 hover:bg-blue-900/30 hover:text-blue-400 transition-colors"><MdEdit /></button>
                  <button onClick={() => handleDelete(a.id, a.name)} className="p-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"><MdDelete /></button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-white">{a.name}</p>
                <p className="text-sm text-slate-400">{a.phone}</p>
              </div>
              {a.assignedArea && (
                <span className="badge-blue self-start">{a.assignedArea}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AgentForm initial={editTarget} onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

export default Agents
