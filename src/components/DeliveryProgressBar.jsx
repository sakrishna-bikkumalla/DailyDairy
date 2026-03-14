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
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-dairy-green-600 to-dairy-green-400 rounded-full transition-all duration-700" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      {children && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {children}
        </div>
      )}
    </div>
  )
}

export default DeliveryProgressBar
