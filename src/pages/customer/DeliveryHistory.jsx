import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getDeliveriesByCustomer } from '../../services/deliveryService'
import { formatDate } from '../../utils/dateUtils'
import { formatMl } from '../../utils/mlUtils'
import DeliveryHistoryView from '../../components/DeliveryHistoryView'
import StatusBadge from '../../components/StatusBadge'

const DeliveryHistory = () => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.linkedId) { setLoading(false); return }
    getDeliveriesByCustomer(user.linkedId)
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const totalMl = deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.milkDeliveredMl || 0), 0)

  const stats = [
    { label: 'Total Days', value: deliveries.length },
    { label: 'Delivered', value: deliveries.filter(d => d.status === 'delivered').length, color: 'text-dairy-green-400' },
    { label: 'Total Milk', value: formatMl(totalMl), color: 'text-blue-400' },
  ]

  const columns = [
    { header: 'Date', render: d => <span className="text-slate-300 text-sm">{formatDate(d.date)}</span> },
    { header: 'Scheduled', render: d => <span className="badge-blue">{formatMl(d.milkScheduledMl || 0)}</span> },
    { header: 'Delivered', render: d => <span className="text-sm text-slate-300">{d.status === 'delivered' ? formatMl(d.milkDeliveredMl) : '-'}</span> },
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

  return (
    <DeliveryHistoryView
      title="Delivery History"
      subtitle="All your past milk deliveries"
      loading={loading}
      deliveries={deliveries}
      stats={stats}
      columns={columns}
    />
  )
}

export default DeliveryHistory
