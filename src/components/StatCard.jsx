import React from 'react'

const StatCard = ({ label, value, icon: Icon, color = 'green', sub }) => {
  const colors = {
    green: 'from-dairy-green-500/10 to-dairy-green-900/10 border-dairy-green-500/20 text-dairy-green-400 shadow-[0_0_15px_rgba(34,197,94,0.05)]',
    amber: 'from-amber-500/10 to-amber-900/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
    blue: 'from-blue-500/10 to-blue-900/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]',
    red: 'from-red-500/10 to-red-900/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
    purple: 'from-purple-500/10 to-purple-900/10 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)]',
  }

  return (
    <div className={`bg-slate-900/40 backdrop-blur-xl bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 flex items-start gap-4 animate-fade-in hover:scale-[1.02] transition-all duration-300 group`}>
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
