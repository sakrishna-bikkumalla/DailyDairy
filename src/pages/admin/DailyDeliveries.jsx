import React, { useState } from 'react';
import { MdRefresh } from 'react-icons/md';

import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DeliveryProgressBar from '../../components/DeliveryProgressBar';

import { useDeliveries } from '../../hooks/useDeliveries';
import { useAgents } from '../../hooks/useAgents';

import { getTodayString, formatDate } from '../../utils/dateUtils';
import { formatMl } from '../../utils/mlUtils';
import { DELIVERY_STATUS, ROLES } from '../../constants';

const statusBadge = {
  [DELIVERY_STATUS.PENDING]: <span className="badge-amber">Pending</span>,
  [DELIVERY_STATUS.DELIVERED]: <span className="badge-green">Delivered</span>,
  [DELIVERY_STATUS.SKIPPED]: <span className="badge-red">Skipped</span>,
};

const DailyDeliveries = () => {
  const [date, setDate] = useState(getTodayString());
  
  // Custom hooks
  const { agents } = useAgents();
  const {
    deliveries,
    stats,
    loading,
    generating,
    generateDeliveries,
    handleAssignAgent,
    refreshUser // Reusing loadData as refresh
  } = useDeliveries(date);

  return (
    <div>
      <PageHeader
        title="Daily Deliveries"
        subtitle="Generate and manage milk deliveries by date"
        rightContent={
          <>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="form-input w-auto" 
            />
            <button onClick={refreshUser} className="btn-secondary p-3">
              <MdRefresh />
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-dairy-green-400">{stats.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Delivered</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-xs text-slate-400 mt-1">Pending</p>
        </div>
      </div>

      {/* Progress */}
      {stats.total > 0 && (
        <DeliveryProgressBar total={stats.total} done={stats.completed + stats.skipped}>
          <span>{formatMl(stats.totalMlDelivered)} / {formatMl(stats.totalMlScheduled)} delivered</span>
        </DeliveryProgressBar>
      )}

      {/* Generate button */}
      <div className="mb-6 flex justify-end">
        <button 
          onClick={generateDeliveries} 
          disabled={generating} 
          className="btn-primary"
        >
          {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdRefresh className="text-xl" />}
        </button>
      </div>

      {/* Delivery list */}
      {loading ? (
        <LoadingSpinner />
      ) : deliveries.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
            <h3 className="font-semibold text-white text-sm">{deliveries.length} deliveries · {formatDate(date)}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                  <th className="text-left px-6 py-4">Customer</th>
                  <th className="text-left px-6 py-4">Milk (ml)</th>
                  <th className="text-left px-6 py-4">Assign Agent</th>
                  <th className="text-left px-6 py-4">Photo</th>
                  <th className="text-left px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white tracking-tight">{d.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{d.customerAddress}</p>
                    </td>
                    <td className="px-6 py-4"><span className="badge-green">{formatMl(d.milkScheduledMl)}</span></td>
                    <td className="px-6 py-4">
                      <select
                        value={d.agentId || ''}
                        onChange={e => handleAssignAgent(d.id, e.target.value || null)}
                        className="bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-dairy-green-500/50 transition-all cursor-pointer hover:bg-white/5"
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {d.photoUrl ? (
                        <a href={d.photoUrl} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-xl overflow-hidden border border-white/10 hover:border-dairy-green-500/50 transition-all hover:scale-110 shadow-lg">
                          <img src={d.photoUrl} alt="Delivery verification" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No Photo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{statusBadge[d.status] || d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDeliveries;
