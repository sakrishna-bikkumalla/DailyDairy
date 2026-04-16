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
        subtitle="Manage milk deliveries"
        rightContent={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 text-slate-100 rounded-xl px-2.5 py-2 text-[10px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-dairy-green-500/50 w-[110px] sm:w-auto" 
            />
            <button onClick={refreshUser} className="bg-slate-800/40 p-2 sm:p-2.5 rounded-xl border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 transition-all">
              <MdRefresh className="text-sm sm:text-base" />
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <div className="card p-2 sm:p-4 text-center group hover:border-white/20 transition-all">
          <p className="text-lg sm:text-2xl font-bold text-white group-hover:scale-105 transition-transform">{stats.total}</p>
          <p className="text-[8px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5 sm:mt-1">Total</p>
        </div>
        <div className="card p-2 sm:p-4 text-center group hover:border-dairy-green-500/30 transition-all">
          <p className="text-lg sm:text-2xl font-bold text-dairy-green-400 group-hover:scale-105 transition-transform">{stats.completed}</p>
          <p className="text-[8px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5 sm:mt-1">Done</p>
        </div>
        <div className="card p-2 sm:p-4 text-center group hover:border-amber-500/30 transition-all">
          <p className="text-lg sm:text-2xl font-bold text-amber-400 group-hover:scale-105 transition-transform">{stats.pending}</p>
          <p className="text-[8px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5 sm:mt-1">Pending</p>
        </div>
      </div>

      {/* Progress */}
      {stats.total > 0 && (
        <DeliveryProgressBar total={stats.total} done={stats.completed + stats.skipped}>
          <span className="truncate text-[10px] sm:text-xs tracking-wide">{formatMl(stats.totalMlDelivered)} / {formatMl(stats.totalMlScheduled)} delivered</span>
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
          </div>          {/* Desktop View - Shown on Large screens */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                  <th className="text-left px-6 py-4">Customer</th>
                  <th className="text-left px-6 py-4 text-center">Milk (ml)</th>
                  <th className="text-left px-6 py-4">Assign Agent</th>
                  <th className="text-left px-6 py-4 text-center">Verification</th>
                  <th className="text-left px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="table-row border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white tracking-tight">{d.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px] lg:max-w-xs">{d.customerAddress}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="badge-green">{formatMl(d.milkScheduledMl)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={d.agentId || ''}
                        onChange={e => handleAssignAgent(d.id, e.target.value || null)}
                        className="bg-slate-900/40 backdrop-blur-md border border-white/10 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-dairy-green-500/50 transition-all cursor-pointer hover:bg-slate-800"
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {d.photoUrl ? (
                          <a href={d.photoUrl} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-xl overflow-hidden border border-white/10 hover:border-dairy-green-500/50 transition-all hover:scale-110 shadow-lg group">
                            <img src={d.photoUrl} alt="Delivery verification" className="w-full h-full object-cover group-hover:opacity-80" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest whitespace-nowrap">No Photo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{statusBadge[d.status] || d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - High Density */}
          <div className="lg:hidden divide-y divide-slate-800/30 bg-slate-900/10">
            {deliveries.map(d => (
              <div key={d.id} className="p-3 flex flex-col gap-2.5 hover:bg-white/[0.02] transition-colors">
                {/* Header Row: Info & Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm tracking-tight truncate mb-0.5">{d.customerName}</h4>
                    <p className="text-[10px] text-slate-500 truncate leading-tight">{d.customerAddress}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* Compact Badges */}
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${d.status === DELIVERY_STATUS.DELIVERED ? 'bg-dairy-green-500/10 text-dairy-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {d.status === DELIVERY_STATUS.DELIVERED ? 'OK' : '...' }
                    </span>
                    <span className="bg-dairy-green-500/20 text-dairy-green-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                       {formatMl(d.milkScheduledMl)}
                    </span>
                  </div>
                </div>

                {/* Sub Row: Photo & Agent Selection */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={d.agentId || ''}
                      onChange={e => handleAssignAgent(d.id, e.target.value || null)}
                      className="bg-slate-950/50 backdrop-blur-md border border-white/5 text-slate-400 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-dairy-green-500/40 transition-all cursor-pointer w-full appearance-none shadow-sm"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.6rem center', backgroundSize: '1em' }}
                    >
                      <option value="">No Agent</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  {d.photoUrl && (
                    <a href={d.photoUrl} target="_blank" rel="noreferrer" className="shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-white/10 hover:border-dairy-green-500/50 transition-all shadow-md">
                      <img src={d.photoUrl} alt="V" className="w-full h-full object-cover" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDeliveries;
