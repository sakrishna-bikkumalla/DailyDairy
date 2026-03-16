import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { mlToLiters } from '../utils/mlUtils'

export const calculateMonthlyBilling = async (customerId, month, year) => {
  // Get all deliveries for this customer in the given month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const q = query(
    collection(db, 'deliveries'),
    where('customerId', '==', customerId)
  )
  const snap = await getDocs(q)
  
  // Filter in JS to avoid requiring a composite index in Firestore
  const deliveries = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => 
      d.date >= startDate && 
      d.date <= endDate && 
      d.status === 'delivered'
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalMl = deliveries.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
  const totalLiters = mlToLiters(totalMl)
  
  // Calculate total amount using per-delivery pricing
  const totalAmount = deliveries.reduce((sum, d) => {
    const price = d.pricePerLiter || 60
    return sum + (mlToLiters(d.milkDeliveredMl || 0) * price)
  }, 0)

  return {
    deliveries,
    totalMl,
    totalLiters,
    totalAmount,
    month,
    year
  }
}
