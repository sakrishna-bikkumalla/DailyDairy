import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdClose, MdPhone, MdPerson, MdShield, MdLogout,
  MdAccessTime, MdEdit, MdSave, MdLock, MdVisibility,
  MdVisibilityOff, MdArrowBack, MdCheckCircle
} from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'
import { updateUserProfile } from '../services/authService'
import toast from 'react-hot-toast'

const roleMeta = {
  admin: {
    label: 'Administrator',
    color: 'text-dairy-green-400',
    bg: 'bg-dairy-green-900/40',
    border: 'border-dairy-green-700/50',
    avatarBg: 'bg-dairy-green-700',
    badge: 'bg-dairy-green-800 text-dairy-green-200',
    inputFocus: 'focus:border-dairy-green-500 focus:ring-dairy-green-500/20',
    saveBg: 'bg-dairy-green-700 hover:bg-dairy-green-600',
    icon: <MdShield className="text-lg" />,
  },
  customer: {
    label: 'Customer',
    color: 'text-blue-400',
    bg: 'bg-blue-900/40',
    border: 'border-blue-700/50',
    avatarBg: 'bg-blue-700',
    badge: 'bg-blue-800 text-blue-200',
    inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
    saveBg: 'bg-blue-700 hover:bg-blue-600',
    icon: <MdPerson className="text-lg" />,
  },
  agent: {
    label: 'Delivery Agent',
    color: 'text-amber-400',
    bg: 'bg-amber-900/40',
    border: 'border-amber-700/50',
    avatarBg: 'bg-amber-700',
    badge: 'bg-amber-800 text-amber-200',
    inputFocus: 'focus:border-amber-500 focus:ring-amber-500/20',
    saveBg: 'bg-amber-700 hover:bg-amber-600',
    icon: <MdPerson className="text-lg" />,
  },
}

/* ─── View Mode ─────────────────────────────────────────────── */
const ViewProfile = ({ user, meta, onEdit, onLogout, onClose }) => {
  const formatPhone = (phone) => {
    if (!phone) return '—'
    return phone.replace(/(\d{5})(\d{5})/, '+91 $1 $2')
  }

  const memberSince = () => {
    if (!user?.createdAt) return null
    const date = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
    if (isNaN(date)) return null
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const since = memberSince()

  return (
    <div className="p-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className={`relative w-20 h-20 rounded-2xl ${meta.avatarBg} flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
          <button
            onClick={onEdit}
            title="Edit Profile"
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200 shadow-md"
          >
            <MdEdit className="text-sm" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">{user?.name || 'Unknown User'}</h2>
        <span className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${meta.badge}`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Info cards */}
      <div className="space-y-3">
        <div className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
          <MdPhone className={`text-xl ${meta.color} flex-shrink-0`} />
          <div>
            <p className="text-xs text-slate-500 font-medium mb-0.5">Phone Number</p>
            <p className="text-sm text-slate-200 font-semibold">{formatPhone(user?.phone)}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
          <MdShield className={`text-xl ${meta.color} flex-shrink-0`} />
          <div>
            <p className="text-xs text-slate-500 font-medium mb-0.5">Role</p>
            <p className={`text-sm font-semibold capitalize ${meta.color}`}>{user?.role || '—'}</p>
          </div>
        </div>

        {since && (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
            <MdAccessTime className={`text-xl ${meta.color} flex-shrink-0`} />
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Member Since</p>
              <p className="text-sm text-slate-200 font-semibold">{since}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit + Logout buttons */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={onEdit}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${meta.saveBg} text-white transition-all duration-200 font-semibold text-sm`}
        >
          <MdEdit className="text-base" />
          Edit Profile
        </button>
        <button
          onClick={onLogout}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-800/60 hover:text-white transition-all duration-200 font-semibold text-sm"
        >
          <MdLogout className="text-base" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

/* ─── Edit Mode ─────────────────────────────────────────────── */
const EditProfile = ({ user, meta, onBack, onSaved }) => {
  const { updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(phone.trim())) errs.phone = 'Enter a valid 10-digit number'
    if (password && password.length < 6) errs.password = 'Min 6 characters'
    if (password && password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const updates = { name: name.trim(), phone: phone.trim() }
      if (password) updates.password = password
      await updateUserProfile(user.id, updates)
      updateUser(updates)
      toast.success('Profile updated successfully!')
      onSaved()
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const inputBase = `w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all ring-1 ring-transparent ${meta.inputFocus}`

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MdArrowBack className="text-lg" />
        </button>
        <div>
          <h3 className="text-white font-bold text-base">Edit Profile</h3>
          <p className="text-xs text-slate-500">Update your account details</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">
            <MdPerson className="inline mr-1.5 text-sm" />Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter full name"
            className={`${inputBase} ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">
            <MdPhone className="inline mr-1.5 text-sm" />Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="10-digit phone number"
            maxLength={10}
            className={`${inputBase} ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs text-slate-400 font-medium mb-1.5">
            <MdLock className="inline mr-1.5 text-sm" />New Password
            <span className="ml-1 text-slate-600">(leave blank to keep current)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password"
              className={`${inputBase} pr-10 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password — only show if password has been entered */}
        {password.length > 0 && (
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              <MdLock className="inline mr-1.5 text-sm" />Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`${inputBase} pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirm ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-200 font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${meta.saveBg} text-white transition-all duration-200 font-semibold text-sm disabled:opacity-60`}
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <MdSave className="text-base" />
          }
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

/* ─── Main Modal Shell ──────────────────────────────────────── */
const ProfileModal = ({ onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const [mode, setMode] = useState('view') // 'view' | 'edit'

  const meta = roleMeta[user?.role] || roleMeta.customer

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') { mode === 'edit' ? setMode('view') : onClose() } }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, mode])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeInOverlay 0.15s ease' }}
    >
      <div
        key={mode}
        className={`relative w-full max-w-sm mx-4 rounded-2xl bg-slate-900 border ${meta.border} shadow-2xl`}
        style={{ animation: 'slideUpModal 0.2s ease' }}
      >
        {/* Header gradient bar */}
        <div className={`h-1.5 rounded-t-2xl ${meta.avatarBg} opacity-80`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MdClose className="text-lg" />
        </button>

        {mode === 'view' ? (
          <ViewProfile
            user={user}
            meta={meta}
            onEdit={() => setMode('edit')}
            onLogout={handleLogout}
            onClose={onClose}
          />
        ) : (
          <EditProfile
            user={user}
            meta={meta}
            onBack={() => setMode('view')}
            onSaved={() => setMode('view')}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(24px) scale(0.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}

export default ProfileModal
