export const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const getMonthRange = (month, year) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`
  return { start, end }
}

export const getMonthName = (month) => {
  return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
}
