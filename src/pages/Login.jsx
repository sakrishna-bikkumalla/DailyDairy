import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GiMilkCarton } from 'react-icons/gi'
import { MdPhone, MdLock, MdLogin } from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'
import { loginWithPhone, seedDemoData, clearDemoData } from '../services/authService'
import toast from 'react-hot-toast'

const demoAccounts = [
  { label: 'Admin', phone: '9999900001', password: 'admin123', role: 'admin', color: 'bg-dairy-green-700 hover:bg-dairy-green-600' },
  { label: 'Customer', phone: '9876543210', password: 'cust123', role: 'customer', color: 'bg-blue-700 hover:bg-blue-600' },
  { label: 'Agent', phone: '9111100001', password: 'agent123', role: 'agent', color: 'bg-amber-700 hover:bg-amber-600' },
]

const Login = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone || !password) { toast.error('Please enter phone and password'); return }
    setLoading(true)
    try {
      const user = await loginWithPhone(phone, password)
      login(user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      if (user.role === 'admin') navigate('/admin/dashboard')
      else if (user.role === 'customer') navigate('/customer/dashboard')
      else if (user.role === 'agent') navigate('/agent/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (acc) => {
    setLoading(true)
    try {
      const user = await loginWithPhone(acc.phone, acc.password)
      login(user)
      toast.success(`Demo login as ${acc.label}`)
      if (user.role === 'admin') navigate('/admin/dashboard')
      else if (user.role === 'customer') navigate('/customer/dashboard')
      else if (user.role === 'agent') navigate('/agent/dashboard')
    } catch {
      toast.error('Demo data not seeded yet. Click "Seed Demo Data" first.')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const result = await seedDemoData()
      if (result.alreadySeeded) toast.success('Demo data already exists!')
      else toast.success(`Seeded ${result.customers} customers, ${result.agents} agents`)
    } catch (err) {
      toast.error('Seed failed: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to remove all demo data? This will delete seeded users, customers, and their related records.')) return
    setLoading(true)
    try {
      const result = await clearDemoData()
      toast.success(`Removed demo records successfully.`)
    } catch (err) {
      toast.error('Clear failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dairy-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900/20 backdrop-blur-sm border-r border-white/5 flex-col items-center justify-center p-12 relative overflow-hidden z-10">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute rounded-full border border-dairy-green-500/20"
              style={{
                width: `${120 + i * 100}px`, height: `${120 + i * 100}px`,
                top: `${50}%`, left: `${50}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0.2 - i * 0.03
              }}
            />
          ))}
        </div>
        <div className="relative text-center">
          <div className="w-28 h-28 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/10 group animate-float">
            <GiMilkCarton className="text-6xl text-white group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">Daily Dairy</h1>
          <p className="text-dairy-green-400 text-xl mb-12 font-medium">Smart Dairy Delivery Management</p>
          <div className="space-y-4 text-left mt-8 inline-block">
            {['Digitize milk delivery operations', 'Track deliveries in real-time', 'Navigate to customers via map', 'Auto-calculate monthly billing', 'Manage customer requests easily'].map(f => (
              <div key={f} className="flex items-center gap-4 text-slate-300 group">
                <div className="w-6 h-6 rounded-lg bg-dairy-green-500/20 border border-dairy-green-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-dairy-green-500/40 transition-colors">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-dairy-green-400"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-base font-medium transition-colors group-hover:text-white">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-20">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <div className="w-20 h-20 bg-dairy-green-600/20 backdrop-blur-xl border border-dairy-green-500/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <GiMilkCarton className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Daily Dairy</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="card p-8 lg:p-10 border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-500 mt-2 font-medium">Sign in with your phone number</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Phone Number</label>
                <div className="relative group">
                  <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dairy-green-500 transition-colors" />
                  <input
                    type="tel"
                    className="form-input pl-12 bg-slate-950/40 border-slate-800 focus:border-dairy-green-500/50"
                    placeholder="10-digit phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400 ml-1">Password</label>
                <div className="relative group">
                  <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dairy-green-500 transition-colors" />
                  <input
                    type="password"
                    className="form-input pl-12 bg-slate-950/40 border-slate-800 focus:border-dairy-green-500/50"
                    placeholder="Enter password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base tracking-wide shadow-green-500/10">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdLogin className="text-xl" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo section */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[10px] text-slate-500 text-center mb-6 font-black uppercase tracking-[0.2em]">Quick Access</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.role}
                    onClick={() => handleDemoLogin(acc)}
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold py-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding || loading}
                className="w-full text-[10px] font-bold text-slate-500 hover:text-dairy-green-400 py-3 border border-white/5 hover:border-dairy-green-500/30 rounded-xl transition-all duration-300 uppercase tracking-widest bg-white/5 hover:bg-dairy-green-500/5 mb-2"
              >
                {seeding ? '⏳ Seeding...' : '🌱 Seed Demo Data'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="w-full text-[10px] font-bold text-slate-500 hover:text-red-400 py-3 border border-white/5 hover:border-red-500/30 rounded-xl transition-all duration-300 uppercase tracking-widest bg-white/5 hover:bg-red-500/5"
              >
                {loading ? '⏳ Clearing...' : '🗑️ Remove Demo Data'}
              </button>
              <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-500 space-y-2 font-medium">
                <p className="flex justify-between items-center"><span>Admin:</span> <span className="text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">8919332393 / 123456789</span></p>
                <p className="flex justify-between items-center"><span>Customer:</span> <span className="text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">9876543210 / cust123</span></p>
                <p className="flex justify-between items-center"><span>Agent:</span> <span className="text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">9111100001 / agent123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
