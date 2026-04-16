import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllDeliveriesByAgent } from '../../services/deliveryService'
import { formatDate } from '../../utils/dateUtils'
import DeliveryHistoryView from '../../components/DeliveryHistoryView'
import StatusBadge from '../../components/StatusBadge'
import FilterBar from '../../components/FilterBar'
import { MdLocalShipping } from 'react-icons/md'

const AgentDeliveryHistory = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    getAllDeliveriesByAgent(user.linkedId)
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  // Get distinct customers present in deliveries
  const historicalCustomers = useMemo(() => {
    const map = new Map()
    deliveries.forEach(d => {
      if (!map.has(d.customerId)) {
        map.set(d.customerId, d.customerName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [deliveries])

  // Filter delivery list
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchesSearch = !search || 
        d.customerName?.toLowerCase().includes(search.toLowerCase()) || 
        d.customerPhone?.includes(search)
      
      const matchesFromDate = !fromDate || d.date >= fromDate
      const matchesToDate = !toDate || d.date <= toDate
      const matchesCustomer = !selectedCustomerId || d.customerId === selectedCustomerId
      
      return matchesSearch && matchesFromDate && matchesToDate && matchesCustomer
    })
  }, [deliveries, search, fromDate, toDate, selectedCustomerId])

  const stats = [
    { label: 'Total Deliveries', value: filteredDeliveries.length },
    { label: 'Completed', value: filteredDeliveries.filter(d => d.status === 'delivered').length, color: 'text-dairy-green-400' },
    { label: 'Customers', value: new Set(filteredDeliveries.map(d => d.customerId)).size, color: 'text-amber-400' },
  ]

  const columns = [
    { header: 'Date', render: d => <span className="text-slate-300 text-sm">{formatDate(d.date)}</span> },
    { header: 'Customer', render: d => (
      <div>
        <p className="text-sm font-medium text-white">{d.customerName}</p>
        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{d.customerAddress}</p>
      </div>
    )},
    { 
      header: 'Photo', 
      render: d => d.photoUrl ? (
        <a href={d.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">View Photo</a>
      ) : (
        <span className="text-xs text-slate-500">-</span>
      )
    },
    { header: 'Status', render: d => <StatusBadge status={d.status} /> },
  ]

  const filters = [
    { type: 'date', value: fromDate, onChange: setFromDate, title: 'From Date', separator: 'to' },
    { type: 'date', value: toDate, onChange: setToDate, title: 'To Date' },
    { 
      type: 'select', 
      value: selectedCustomerId, 
      onChange: setSelectedCustomerId, 
      placeholder: 'All Customers',
      options: historicalCustomers 
    }
  ]

  return (
    <DeliveryHistoryView
      title="My History"
      subtitle="History of all your past assignments"
      loading={loading}
      deliveries={filteredDeliveries}
      stats={stats}
      columns={columns}
      emptyIcon={MdLocalShipping}
      filterContent={
        <FilterBar 
          search={search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Search customers by name or phone..."
          filters={filters}
        />
      }
    />
  )
}

export default AgentDeliveryHistory
