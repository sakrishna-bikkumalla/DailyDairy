import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/admin/Dashboard'
import Customers from './pages/admin/Customers'
import Agents from './pages/admin/Agents'
import DailyDeliveries from './pages/admin/DailyDeliveries'
import Requests from './pages/admin/Requests'
import Subscriptions from './pages/admin/Subscriptions'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerSubscriptions from './pages/customer/Subscriptions'
import SubmitRequest from './pages/customer/SubmitRequest'
import RequestHistory from './pages/customer/RequestHistory'
import DeliveryHistory from './pages/customer/DeliveryHistory'
import AgentDashboard from './pages/agent/AgentDashboard'
import DeliveryList from './pages/agent/DeliveryList'
import AgentDeliveryHistory from './pages/agent/DeliveryHistory'
import Layout from './components/Layout'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-dairy-green-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

const HomeRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />
  if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout role="admin" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="agents" element={<Agents />} />
            <Route path="deliveries" element={<DailyDeliveries />} />
            <Route path="requests" element={<Requests />} />
            <Route path="subscriptions" element={<Subscriptions />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Layout role="customer" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="subscriptions" element={<CustomerSubscriptions />} />
            <Route path="request" element={<SubmitRequest />} />
            <Route path="requests" element={<RequestHistory />} />
            <Route path="history" element={<DeliveryHistory />} />
          </Route>

          {/* Agent Routes */}
          <Route path="/agent" element={
            <ProtectedRoute allowedRoles={['agent']}>
              <Layout role="agent" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="deliveries" element={<DeliveryList />} />
            <Route path="history" element={<AgentDeliveryHistory />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
