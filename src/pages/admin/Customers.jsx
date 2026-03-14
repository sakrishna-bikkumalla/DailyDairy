import React, { useEffect, useState } from 'react'
import { MdAdd, MdEdit, MdDelete, MdSearch, MdLocationOn, MdPhone } from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../../services/customerService'
import { formatMl } from '../../utils/mlUtils'
import toast from 'react-hot-toast'
import CustomerForm from './CustomerForm'

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data)
      setFiltered(data)
    } catch (e) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(customers.filter(c =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.address?.toLowerCase().includes(q)
    ))
  }, [search, customers])

  const handleEdit = (c) => { setEditTarget(c); setShowForm(true) }
  const handleAdd = () => { setEditTarget(null); setShowForm(true) }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return
    try {
      await deleteCustomer(id)
      toast.success('Customer deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const handleSave = async (data) => {
    try {
      if (editTarget) {
        await updateCustomer(editTarget.id, data)
        toast.success('Customer updated')
      } else {
        await addCustomer(data)
        toast.success('Customer added')
      }
      setShowForm(false)
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-header">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <MdAdd className="text-lg" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="form-input pl-11"
          placeholder="Search by name, phone, address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <GiMilkCarton className="text-5xl mx-auto mb-3 opacity-30" />
              <p>No customers found</p>
              <button onClick={handleAdd} className="mt-4 btn-primary mx-auto">Add First Customer</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-700/30 text-xs text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Daily Milk</th>
                    <th className="text-left px-4 py-3">Price/L</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="table-row">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{c.address}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{c.phone}</td>
                      <td className="px-4 py-3">
                        <span className="badge-green">{formatMl(c.dailyMilkMl || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">₹{c.pricePerLiter}/L</td>
                      <td className="px-4 py-3">
                        {c.latitude && c.longitude ? (
                          <a href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-dairy-green-400 hover:text-dairy-green-300">
                            <MdLocationOn />View Map
                          </a>
                        ) : <span className="text-slate-600 text-xs">No GPS</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleEdit(c)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-900/30 hover:text-blue-400 transition-colors">
                            <MdEdit />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors">
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <CustomerForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default Customers
