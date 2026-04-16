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
      <div className="relative mb-6">
        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="form-input pl-11 w-full"
          placeholder="Search by name, phone, address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full card text-center py-16 text-slate-500">
              <GiMilkCarton className="text-5xl mx-auto mb-3 opacity-30" />
              <p>No customers found</p>
              <button onClick={handleAddBtn} className="mt-4 btn-primary mx-auto">Add First Customer</button>
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 bg-dairy-green-900/50 rounded-xl flex items-center justify-center text-dairy-green-400 text-2xl font-bold flex-shrink-0">
                    {c.name ? c.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(c)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-900/30 hover:text-blue-400 transition-colors bg-slate-900/50">
                      <MdEdit />
                    </button>
                    <button onClick={() => onDelete(c.id, c.name)} className="p-2 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors bg-slate-900/50">
                      <MdDelete />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-lg truncate">{c.name}</p>
                  <p className="text-sm text-slate-400 mb-1">{c.phone}</p>
                  <p className="text-xs text-slate-500 line-clamp-2" title={c.address}>{c.address || 'No address provided'}</p>
                </div>

                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Location</span>
                  {c.locationUrl ? (
                    <a href={c.locationUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium">
                      <MdLocationOn />Open URL
                    </a>
                  ) : c.latitude && c.longitude ? (
                    <a href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-dairy-green-400 hover:text-dairy-green-300 font-medium">
                      <MdLocationOn />View Map
                    </a>
                  ) : <span className="text-slate-600 text-xs text-right">No GPS</span>}
                </div>
              </div>
            ))
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
