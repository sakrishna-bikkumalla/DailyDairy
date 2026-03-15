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
      bg-slate-900 border-r border-slate-800
      transform transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 bg-gradient-to-br ${roleColors[role]}`}>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <GiMilkCarton className="text-white text-xl" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">FarmToHome</h1>
          <p className="text-white/60 text-xs">Dairy Management</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900">
        <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`badge ${roleBadge[role]?.cls}`}>{roleBadge[role]?.label}</span>
          <span className="text-xs text-slate-500">{user?.phone}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-dairy-green-700 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            <Icon className="text-lg flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-150 w-full"
        >
          <MdLogout className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
