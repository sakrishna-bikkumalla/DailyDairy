import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  MdDashboard, MdPeople, MdLocalShipping, MdDeliveryDining,
  MdInbox, MdReceipt, MdMap, MdHistory, MdAdd, MdLogout, MdAssignment
} from 'react-icons/md'
import { GiMilkCarton } from 'react-icons/gi'
import toast from 'react-hot-toast'

const adminLinks = [
  { to: '/admin/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/admin/customers', icon: MdPeople, label: 'Customers' },
  { to: '/admin/agents', icon: MdDeliveryDining, label: 'Delivery Agents' },
  { to: '/admin/deliveries', icon: MdLocalShipping, label: 'Daily Deliveries' },
  { to: '/admin/requests', icon: MdInbox, label: 'Requests' },
  { to: '/admin/subscriptions', icon: MdAssignment, label: 'Subscriptions' },
]

const customerLinks = [
  { to: '/customer/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/customer/request', icon: MdAdd, label: 'New Request' },
  { to: '/customer/requests', icon: MdInbox, label: 'My Requests' },
  { to: '/customer/history', icon: MdHistory, label: 'Delivery History' },
]

const agentLinks = [
  { to: '/agent/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/agent/deliveries', icon: MdLocalShipping, label: 'My Deliveries' },
  { to: '/agent/history', icon: MdHistory, label: 'Delivery History' },
]

const linksByRole = { admin: adminLinks, customer: customerLinks, agent: agentLinks }

const roleColors = {
  admin: 'from-dairy-green-700 to-dairy-green-900',
  customer: 'from-blue-700 to-blue-900',
  agent: 'from-amber-700 to-amber-900',
}

const roleBadge = {
  admin: { label: 'Admin', cls: 'badge-green' },
  customer: { label: 'Customer', cls: 'badge-blue' },
  agent: { label: 'Agent', cls: 'badge-amber' },
}

const Sidebar = ({ role, open, onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = linksByRole[role] || []

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-64 z-30 flex flex-col
      bg-slate-900/40 backdrop-blur-2xl border-r border-white/5
      transform transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 bg-gradient-to-br ${roleColors[role]} shadow-lg relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
          <GiMilkCarton className="text-white text-xl" />
        </div>
        <div className="relative z-10">
          <h1 className="font-bold text-white text-lg leading-tight tracking-tight">Daily Dairy</h1>
          <p className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Premium Fresh</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/5 bg-white/5">
        <p className="text-sm font-semibold text-slate-100 truncate">{user?.name || 'User'}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`badge ${roleBadge[role]?.cls}`}>{roleBadge[role]?.label}</span>
          <span className="text-[10px] font-medium text-slate-500">{user?.phone}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive
                  ? 'bg-dairy-green-600/20 text-dairy-green-400 border border-dairy-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent hover:border-white/5'
              }`
            }
          >
            <Icon className="text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span className="tracking-wide">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-300 w-full group"
        >
          <MdLogout className="text-xl transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
