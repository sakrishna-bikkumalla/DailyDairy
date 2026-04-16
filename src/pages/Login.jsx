import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GiMilkCarton } from 'react-icons/gi'
import { MdPhone, MdLock, MdLogin } from 'react-icons/md'
import { useAuth } from '../contexts/AuthContext'
import { loginWithPhone } from '../services/authService'
import toast from 'react-hot-toast'

const Login = () => {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('admin')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone || !password) { toast.error('Please enter phone and password'); return }
    setLoading(true)
    try {
      const user = await loginWithPhone(phone, password)
      if (user.role !== role) {
        toast.error(`Please login from the ${user.role} tab`)
        setLoading(false)
        return
      }
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
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-500 mt-2 font-medium">Sign In to your {role} account</p>
            </div>

            <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8 border border-white/5">
              {['admin', 'customer', 'agent'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg capitalize transition-all ${role === r ? 'bg-dairy-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {r}
                </button>
              ))}
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
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
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
              <div className="text-center mt-4">
                <Link to="/signup" className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
                  Don't have an admin account? Sign-up
                </Link>
              </div>
            </form>

            {/* How to use */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-[10px] text-slate-500 text-center mb-6 font-black uppercase tracking-[0.2em]">HOW TO USE</p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 shadow-inner border border-blue-500/20">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Register an Admin</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">Click "Sign-up" above to create an Admin account for your dairy business. You'll use this to manage everything.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-dairy-green-500/20 text-dairy-green-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 shadow-inner border border-dairy-green-500/20">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Create Customers & Agents</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">Login as the Admin to add your customers and delivery agents. They will automatically get accounts linked to their phone numbers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 shadow-inner border border-amber-500/20">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Login as Customer/Agent</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">Once the Admin creates them, Customers and Agents can log in here using their phone number and the password set by the Admin.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
