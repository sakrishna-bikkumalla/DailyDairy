import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GiMilkCarton } from 'react-icons/gi'
import { MdPhone, MdLock, MdLogin } from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'
import { loginWithPhone, seedDemoData } from '../services/authService'
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

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dairy-green-900 via-slate-900 to-slate-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute rounded-full bg-dairy-green-500"
              style={{
                width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
                top: `${10 + i * 12}%`, left: `${5 + i * 8}%`,
                opacity: 0.3 - i * 0.04
              }}
            />
          ))}
        </div>
        <div className="relative text-center">
          <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GiMilkCarton className="text-5xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">FarmToHome</h1>
          <p className="text-dairy-green-300 text-lg mb-8">Smart Dairy Delivery Management</p>
          <div className="space-y-3 text-left mt-8">
            {['Digitize milk delivery operations', 'Track deliveries in real-time', 'Navigate to customers via map', 'Auto-calculate monthly billing', 'Manage customer requests easily'].map(f => (
              <div key={f} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-dairy-green-500 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-16 h-16 bg-dairy-green-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <GiMilkCarton className="text-3xl text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FarmToHome</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-400 mt-1">Sign in with your phone number</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  className="form-input pl-11"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="form-input pl-11"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MdLogin className="text-lg" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center mb-4 font-medium uppercase tracking-wider">Demo Quick Login</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {demoAccounts.map(acc => (
                <button
                  key={acc.role}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                  className={`${acc.color} text-white text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full text-xs text-slate-500 hover:text-dairy-green-400 py-2 border border-slate-700 hover:border-dairy-green-700 rounded-xl transition-all duration-200"
            >
              {seeding ? '⏳ Seeding...' : '🌱 Seed Demo Data (First time only)'}
            </button>
            <div className="mt-3 p-3 bg-slate-800/60 rounded-xl text-xs text-slate-500 space-y-1">
              <p>Admin: <span className="text-slate-300">9999900001</span> / <span className="text-slate-300">admin123</span></p>
              <p>Customer: <span className="text-slate-300">9876543210</span> / <span className="text-slate-300">cust123</span></p>
              <p>Agent: <span className="text-slate-300">9111100001</span> / <span className="text-slate-300">agent123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
