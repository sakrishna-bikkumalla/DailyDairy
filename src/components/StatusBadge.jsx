import React from 'react'

const statusBadgeMap = {
  delivered: <span className="badge-green">Delivered</span>,
  pending: <span className="badge-amber">Pending</span>,
  skipped: <span className="badge-red">Skipped</span>,
}

export const StatusBadge = ({ status }) => {
  return statusBadgeMap[status] || <span className="badge-slate">{status}</span>
}

export default StatusBadge
