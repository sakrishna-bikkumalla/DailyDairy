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
          <div className="flex items-center gap-2 flex-wrap">
            <MdFilterList className="text-slate-400" />
            {filters.map((f, idx) => (
              <React.Fragment key={idx}>
                {f.type === 'date' && (
                  <input 
                    type="date" 
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-dairy-green-500 [color-scheme:dark]"
                    title={f.title}
                  />
                )}
                {f.type === 'select' && (
                  <select 
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-dairy-green-500 max-w-[150px] truncate"
                  >
                    <option value="">{f.placeholder || 'Select...'}</option>
                    {f.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                {idx < filters.length - 1 && f.separator && (
                  <span className="text-slate-500 text-xs">{f.separator}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterBar
