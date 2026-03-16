import React, { useState } from 'react'
import { MdMenu } from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'
import ProfileModal from './ProfileModal'

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <header className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 shadow-lg">
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
          <button
            onClick={() => setProfileOpen(true)}
            title="View Profile"
            className="w-8 h-8 rounded-xl bg-dairy-green-700 flex items-center justify-center text-white font-bold text-sm hover:bg-dairy-green-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-2 ring-transparent hover:ring-dairy-green-500/50 focus:outline-none focus:ring-dairy-green-500/50"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}

export default Navbar
