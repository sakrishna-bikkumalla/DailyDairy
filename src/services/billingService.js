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

  // Get customer's price per liter
  const custSnap = await getDocs(query(collection(db, 'customers'), where('__name__', '==', customerId)))

  let pricePerLiter = 60 // default
  if (!custSnap.empty) {
    pricePerLiter = custSnap.docs[0].data().pricePerLiter || 60
  }

  const totalMl = deliveries.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
  const totalLiters = mlToLiters(totalMl)
  const totalAmount = totalLiters * pricePerLiter

  return {
    deliveries,
    totalMl,
    totalLiters,
    pricePerLiter,
    totalAmount,
    month,
    year
  }
}
