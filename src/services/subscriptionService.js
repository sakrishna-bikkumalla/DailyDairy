import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { mlToLiters } from '../utils/mlUtils'

const COLLECTION = 'subscriptions'

// --- CRUD Operations ---

export const getSubscriptionsByCustomer = async (customerId) => {
  const q = query(collection(db, COLLECTION), where('customerId', '==', customerId))
  const snap = await getDocs(q)
  const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // Sort by start date, newest first
  return subs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

export const addSubscription = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    status: data.status || 'active',
    createdAt: serverTimestamp()
  })
}

export const updateSubscription = async (id, data) => {
  return await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export const deleteSubscription = async (id) => {
  // Perform soft delete
  await updateDoc(doc(db, COLLECTION, id), {
    status: 'deleted',
    updatedAt: serverTimestamp()
  })
  return await cancelFutureDeliveries(id)
}

export const stopSubscription = async (id) => {
  await updateDoc(doc(db, COLLECTION, id), {
    status: 'stopped',
    updatedAt: serverTimestamp()
  })
  return await cancelFutureDeliveries(id)
}

export const resumeSubscription = async (id) => {
  return await updateDoc(doc(db, COLLECTION, id), {
    status: 'active',
    updatedAt: serverTimestamp()
  })
}

/**
 * Cancels all pending deliveries associated with a subscription.
 * Used when a subscription is stopped or deleted.
 */
export const cancelFutureDeliveries = async (subscriptionId) => {
  const q = query(
    collection(db, 'deliveries'),
    where('subscriptionId', '==', subscriptionId),
    where('status', '==', 'pending')
  )
  
  const snap = await getDocs(q)
  const promises = snap.docs.map(d => deleteDoc(doc(db, 'deliveries', d.id)))
  await Promise.all(promises)
}

// --- Analytics & Details ---

/**
 * Gets a customer and their subscriptions, attaching delivery history
 * and calculated metrics (days left, estimated vs actual cost) to each subscription.
 */
export const getCustomerSubscriptionDetails = async (customerId) => {
  // 1. Fetch Customer
  const custDoc = await getDoc(doc(db, 'customers', customerId))
  if (!custDoc.exists()) throw new Error("Customer not found")
  const customer = { id: custDoc.id, ...custDoc.data() }

  // 2. Fetch Subscriptions
  const subscriptions = await getSubscriptionsByCustomer(customerId)

  // 3. Fetch all deliveries for this customer
  const delSnap = await getDocs(query(collection(db, 'deliveries'), where('customerId', '==', customerId)))
  const allDeliveries = delSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // 4. Map metrics per subscription
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  const enrichedSubscriptions = subscriptions.map(sub => {
    const start = new Date(sub.startDate)
    const end = new Date(sub.endDate)
    const now = new Date(today)
    
    // Calculates total days inclusive
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    // Days completed up to today (maxed at totalDays)
    let daysCompleted = Math.ceil((now - start) / (1000 * 60 * 60 * 24)) + 1
    if (now < start) daysCompleted = 0
    if (now > end) daysCompleted = totalDays
    
    const daysLeft = totalDays - daysCompleted

    // Filter deliveries strictly within this subscription's date bounds
    const subDeliveries = allDeliveries.filter(d => d.date >= sub.startDate && d.date <= sub.endDate)
    const completedDeliveries = subDeliveries.filter(d => d.status === 'delivered')
    
    // ml / liters
    const totalMlDelivered = completedDeliveries.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
    const totalLitersDelivered = totalMlDelivered / 1000
    
    // Costs
    const price = sub.pricePerLiter || 60
    const scheduledLitersDay = (sub.dailyQuantityMl || 0) / 1000
    const estimatedCost = totalDays * scheduledLitersDay * price
    
    // Calculate actual cost based on individual delivery pricing
    const actualCost = completedDeliveries.reduce((sum, d) => {
      const deliveryPrice = d.pricePerLiter || price
      return sum + (mlToLiters(d.milkDeliveredMl || 0) * deliveryPrice)
    }, 0)

    return {
      ...sub,
      metrics: {
        totalDays,
        daysCompleted,
        daysLeft: Math.max(0, daysLeft),
        deliveriesScheduled: subDeliveries.length,
        deliveriesCompleted: completedDeliveries.length,
        totalLitersDelivered,
        estimatedCost,
        actualCost
      },
      // Sort newest delivery first
      history: subDeliveries.sort((a, b) => b.date.localeCompare(a.date))
    }
  })

  // Lifetime metrics summarizing everything
  const lifetimeCompleted = allDeliveries.filter(d => d.status === 'delivered')
  const lifetimeMl = lifetimeCompleted.reduce((sum, d) => sum + (d.milkDeliveredMl || 0), 0)
  const lifetimeLiters = lifetimeMl / 1000
  const lifetimeBilled = lifetimeCompleted.reduce((sum, d) => {
    const deliveryPrice = d.pricePerLiter || 60
    return sum + (mlToLiters(d.milkDeliveredMl || 0) * deliveryPrice)
  }, 0)

  return {
    customer,
    lifetimeStats: {
      totalDeliveries: allDeliveries.length,
      completedDeliveries: lifetimeCompleted.length,
      lifetimeLiters,
      lifetimeBilled
    },
    subscriptions: enrichedSubscriptions,
    // Provide full history in case you want to see deliveries outside any active subscription bounds bounds
    fullHistory: allDeliveries.sort((a, b) => b.date.localeCompare(a.date))
  }
}

/**
 * Synchronizes pending deliveries for a specific subscription.
 * Call this after adding or updating a subscription to ensure future
 * deliveries match the new subscription parameters.
 */
export const syncPendingDeliveries = async (subscriptionId) => {
  const subSnap = await getDoc(doc(db, COLLECTION, subscriptionId))
  if (!subSnap.exists()) return
  const sub = { id: subSnap.id, ...subSnap.data() }

  // Get all pending deliveries for this customer within plan dates
  const q = query(
    collection(db, 'deliveries'),
    where('customerId', '==', sub.customerId),
    where('status', '==', 'pending')
  )
  
  const snap = await getDocs(q)
  const pendingInRange = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.date >= sub.startDate && d.date <= sub.endDate)

  // Update them to match new quantity
  const promises = pendingInRange.map(d => 
    updateDoc(doc(db, 'deliveries', d.id), {
      milkScheduledMl: sub.dailyQuantityMl,
      subscriptionId: sub.id // Link it if not already linked
    })
  )
  
  await Promise.all(promises)
}

