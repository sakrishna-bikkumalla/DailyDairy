import React from 'react'

const DeliveryProgressBar = ({ total, done, label = 'Delivery Progress', children, compact = false }) => {
  if (total <= 0) return null;
  
  const progress = Math.round((done / total) * 100);

  if (compact) {
    return (
      <div className="card-compact p-3 border-slate-700/50">
        <div className="flex justify-between items-center mb-1.5 px-0.5">
          <span className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em]">{label}</span>
          <span className="text-dairy-green-400 font-black text-lg italic tracking-tighter">{progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-dairy-green-600 to-dairy-green-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        {children && (
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest px-0.5">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card mb-6 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-slate-400 font-bold text-[10px] sm:text-sm uppercase tracking-[0.15em]">{label}</span>
        <span className="text-dairy-green-400 font-black text-xl sm:text-2xl italic">{progress}%</span>
      </div>
      <div className="h-3 sm:h-4 bg-slate-900/60 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div 
          className="h-full bg-gradient-to-r from-dairy-green-600 to-dairy-green-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      {children && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
          {children}
        </div>
      )}
    </div>
  )
}

export default DeliveryProgressBar
