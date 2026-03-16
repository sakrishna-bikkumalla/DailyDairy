import React from 'react'

const DeliveryProgressBar = ({ total, done, label = 'Delivery Progress', children }) => {
  if (total <= 0) return null;
  
  const progress = Math.round((done / total) * 100);

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300 font-medium text-sm">{label}</span>
        <span className="text-dairy-green-400 font-bold text-lg">{progress}%</span>
      </div>
      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-dairy-green-500 to-dairy-green-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      {children && (
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          {children}
        </div>
      )}
    </div>
  )
}

export default DeliveryProgressBar
