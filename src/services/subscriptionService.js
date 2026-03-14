import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Calculates a comprehensive summary of a single customer's subscription history.
 * Aggregates lifetime milk delivered, delivery occurrences, and costs.
 */
export const getCustomerSubscriptionDetails = async (customerId) => {
  // 1. Fetch the customer document
  const custSnap = await getDocs(query(collection(db, 'customers'), where('__name__', '==', customerId)))
  if (custSnap.empty) throw new Error("Customer not found")
  
  const customer = { id: custSnap.docs[0].id, ...custSnap.docs[0].data() }
  const pricePerLiter = customer.pricePerLiter || 60 // fallback if undefined
  
  // 2. Fetch all historical deliveries for this customer
  const q = query(collection(db, 'deliveries'), where('customerId', '==', customerId))
  const snap = await getDocs(q)
  
  const allDeliveries = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  
  // 3. Aggregate totals
  const completedDeliveries = allDeliveries.filter(d => d.status === 'delivered')
  
  const lifetimeMl = completedDeliveries.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
  const lifetimeLiters = lifetimeMl / 1000
  const lifetimeBilled = lifetimeLiters * pricePerLiter
  
  // 4. Sort for timeline display (newest first)
  const sortedHistory = allDeliveries.sort((a, b) => b.date.localeCompare(a.date))

  return {
    customer,
    stats: {
      totalDeliveriesScheduled: allDeliveries.length,
      totalDeliveriesCompleted: completedDeliveries.length,
      lifetimeMl,
      lifetimeLiters,
      lifetimeBilled,
      pricePerLiter
    },
    history: sortedHistory
  }
}
