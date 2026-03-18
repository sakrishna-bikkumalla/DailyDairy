import React, { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdLocationOn } from 'react-icons/md';
import { GiMilkCarton } from 'react-icons/gi';

import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CustomerForm from './CustomerForm';

import { useCustomers } from '../../hooks/useCustomers';
import { updateCustomer } from '../../services/customerService';
import toast from 'react-hot-toast';

const Customers = () => {
  const { customers, loading, loadCustomers, handleAddCustomer, handleDeleteCustomer } = useCustomers();
  
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(customers.filter(c =>
      c.name?.toLowerCase().includes(q) || 
      c.phone?.includes(q) || 
      c.address?.toLowerCase().includes(q)
    ));
  }, [search, customers]);

  const handleEdit = (c) => { setEditTarget(c); setShowForm(true); };
  const handleAddBtn = () => { setEditTarget(null); setShowForm(true); };

  const onDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    await handleDeleteCustomer(id);
  };

  const onSave = async (data) => {
    try {
      if (editTarget) {
        await updateCustomer(editTarget.id, data);
        toast.success('Customer updated successfully');
        loadCustomers();
      } else {
        const { defaultPassword } = await handleAddCustomer(data);
        toast.success(
          `✅ Customer added!\nLogin: ${data.phone} / ${defaultPassword}`,
          { duration: 8000 }
        );
      }
      setShowForm(false);
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        rightContent={
          <button onClick={handleAddBtn} className="btn-primary">
            <MdAdd className="text-lg" /> Add Customer
          </button>
        }
      />

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
        <LoadingSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <GiMilkCarton className="text-5xl mx-auto mb-3 opacity-30" />
              <p>No customers found</p>
              <button onClick={handleAddBtn} className="mt-4 btn-primary mx-auto">Add First Customer</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-700/30 text-xs text-slate-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
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
                        {c.locationUrl ? (
                          <a href={c.locationUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                            <MdLocationOn />Open URL
                          </a>
                        ) : c.latitude && c.longitude ? (
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
                          <button onClick={() => onDelete(c.id, c.name)} className="p-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors">
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
          onSave={onSave}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Customers;
