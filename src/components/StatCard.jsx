import React from 'react'

const StatCard = ({ label, value, icon: Icon, color = 'green', sub }) => {
  const colors = {
    green: 'from-dairy-green-700/20 to-dairy-green-900/20 border-dairy-green-700/30 text-dairy-green-400',
    amber: 'from-amber-700/20 to-amber-900/20 border-amber-700/30 text-amber-400',
    blue: 'from-blue-700/20 to-blue-900/20 border-blue-700/30 text-blue-400',
    red: 'from-red-700/20 to-red-900/20 border-red-700/30 text-red-400',
    purple: 'from-purple-700/20 to-purple-900/20 border-purple-700/30 text-purple-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex items-start gap-4 animate-fade-in`}>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 flex-shrink-0`}>
          <Icon className="text-2xl" />
        </div>
      )}
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default StatCard
