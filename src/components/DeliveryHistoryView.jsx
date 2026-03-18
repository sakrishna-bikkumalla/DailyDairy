import React from 'react'
import { GiMilkCarton } from 'react-icons/gi'
import { MdLocalShipping } from 'react-icons/md'
import { formatDate } from '../utils/dateUtils'
import { StatusBadge } from './StatusBadge'

const DeliveryHistoryView = ({ 
  title, 
  subtitle, 
  loading, 
  deliveries, 
  stats, 
  columns,
  filterContent,
  emptyIcon: EmptyIcon = GiMilkCarton
}) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="page-header">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {filterContent}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card text-center py-16">
          <EmptyIcon className="text-5xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No delivery history yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs text-slate-400 uppercase">
                  {columns.map((col, idx) => (
                    <th key={idx} className={`text-left px-4 py-3 ${col.className || ''}`}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} className="table-row">
                    {columns.map((col, idx) => (
                      <td key={idx} className={`px-4 py-3 ${col.cellClassName || ''}`}>
                        {col.render ? col.render(d) : d[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryHistoryView
