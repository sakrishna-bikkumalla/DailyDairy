import React from 'react'
import { MdSearch, MdFilterList } from 'react-icons/md'

const FilterBar = ({ 
  search, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  filters = [] // Array of { type: 'date'|'select', value, onChange, options: [{value, label}], placeholder, title }
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="form-input pl-11"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto p-1 sm:p-0 rounded-xl">
            <MdFilterList className="text-slate-400 hidden sm:block mx-1" />
            <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap sm:w-auto">
              {filters.map((f, idx) => (
                <React.Fragment key={idx}>
                  {f.type === 'date' && (
                    <div className="flex-1 min-w-[120px] sm:min-w-0 sm:flex-none sm:w-auto">
                      <input 
                        type="date" 
                        value={f.value}
                        onChange={e => f.onChange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-dairy-green-500 [color-scheme:dark] w-full transition-colors"
                        title={f.title}
                      />
                    </div>
                  )}
                  {f.type === 'select' && (
                    <div className="w-full sm:w-auto sm:flex-none mt-1 sm:mt-0">
                      <select 
                        value={f.value}
                        onChange={e => f.onChange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-dairy-green-500 w-full sm:max-w-[150px] truncate transition-colors"
                      >
                        <option value="">{f.placeholder || 'Select...'}</option>
                        {f.options.map((opt, oIdx) => (
                          <option key={oIdx} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {f.separator && (
                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider px-1 flex-shrink-0">{f.separator}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterBar
