import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPerson, MdPhone, MdEmail, MdBusiness, MdLocationCity, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { GiMilkCarton } from 'react-icons/gi';
import { useAuth } from '../contexts/AuthContext';
import { registerAdmin } from '../services/authService';
import toast from 'react-hot-toast';

const Field = ({ label, icon, error, children }) => (
  <div>
    <label className="block text-xs text-slate-400 font-medium mb-1.5">
      {icon && <span className="inline mr-1.5">{icon}</span>}
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

const SectionHeader = ({ children }) => (
  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-3 mt-2">
    {children}
  </p>
);

const Signup = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim())) errs.phone = 'Enter a valid 10-digit number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!companyLocation.trim()) errs.companyLocation = 'Company location is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Min 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Show a toast so user knows about errors even if they can't see the field
      const firstError = Object.values(errs)[0];
      toast.error(firstError);
    }
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    
    try {
      const user = await registerAdmin(name, phone, email, password, companyName, companyLocation);
      signup(user);
      toast.success('Admin account created successfully!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to sign up');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (err) =>
    `w-full bg-slate-800 border ${err ? 'border-red-500' : 'border-slate-600'} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all ring-1 ring-transparent focus:border-dairy-green-500 focus:ring-dairy-green-500/20`;

  return (
    <div className="min-h-screen bg-transparent flex relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dairy-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Left panel - identical to Login */}
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

      {/* Right panel - Signup form */}
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
              <h2 className="text-3xl font-bold text-white tracking-tight">Register Admin</h2>
              <p className="text-slate-500 mt-2 font-medium">Setup your dairy management system</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {/* Company Info */}
              <SectionHeader>Company Info</SectionHeader>

              <Field label="Company Name *" icon={<MdBusiness className="text-sm" />} error={errors.companyName}>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Dairy Farm Name" className={inputClass(errors.companyName)} />
              </Field>

              <Field label="Company Location *" icon={<MdLocationCity className="text-sm" />} error={errors.companyLocation}>
                <input type="text" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} placeholder="City, State" className={inputClass(errors.companyLocation)} />
              </Field>

              {/* Admin Profile */}
              <SectionHeader>Admin Profile</SectionHeader>

              <Field label="Full Name *" icon={<MdPerson className="text-sm" />} error={errors.name}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={inputClass(errors.name)} />
              </Field>

              <Field label="Phone Number *" icon={<MdPhone className="text-sm" />} error={errors.phone}>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} minLength={10} maxLength={10} pattern="[0-9]{10}" placeholder="10-digit number" className={inputClass(errors.phone)} required />
              </Field>

              <Field label="Email (Optional)" icon={<MdEmail className="text-sm" />} error={errors.email}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass(errors.email)} />
              </Field>

              {/* Security */}
              <SectionHeader>Security</SectionHeader>

              <Field label="Password *" icon={<MdLock className="text-sm" />} error={errors.password}>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password (min 6 characters)" className={`${inputClass(errors.password)} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password *" icon={<MdLock className="text-sm" />} error={errors.confirmPassword}>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={`${inputClass(errors.confirmPassword)} pr-10`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showConfirm ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                  </button>
                </div>
              </Field>

              <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-4 text-base tracking-wide shadow-green-500/10 mt-2">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {saving ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-slate-400 hover:text-white font-medium transition-colors">
                Already have an account? <span className="text-dairy-green-400">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
