import React from 'react'
import { MdMenu, MdNotifications } from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <MdMenu className="text-xl" />
      </button>
      <div className="flex-1 lg:flex-none">
        <h2 className="text-slate-400 text-sm hidden lg:block">
          Welcome back, <span className="text-white font-semibold">{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 hidden md:block">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <div className="w-8 h-8 rounded-xl bg-dairy-green-700 flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  )
}

export default Navbar
