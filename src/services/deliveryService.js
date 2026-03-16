import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION = 'deliveries'

export const createDailyDeliveries = async (date) => {
  // 1. Fetch existing deliveries for this date to avoid duplicates
  const qExist = query(collection(db, COLLECTION), where('date', '==', date))
  const existingSnap = await getDocs(qExist)
  const existingSubIds = new Set()
  const existingReqIds = new Set()
  
  existingSnap.docs.forEach(d => {
    const data = d.data()
    if (data.subscriptionId) existingSubIds.add(data.subscriptionId)
    if (data.requestId) existingReqIds.add(data.requestId)
  })

  // 2. Fetch all customers
  const custSnap = await getDocs(collection(db, 'customers'))
  const customers = custSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const customerMap = customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {})

  // 3. Fetch active subscriptions for this date
  const subSnap = await getDocs(query(collection(db, 'subscriptions'), where('status', '==', 'active')))
  const activeSubs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => date >= s.startDate && date <= s.endDate)
    .filter(s => !existingSubIds.has(s.id)) // Only those not yet generated

  // 4. Fetch approved requests for this date
  const reqSnap = await getDocs(query(
    collection(db, 'requests'), 
    where('status', '==', 'approved')
  ))
  const allApprovedRequests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  
  const deliveryRequests = allApprovedRequests.filter(r => 
    ['extra_milk', 'morning_milk', 'evening_milk', 'custom'].includes(r.requestType) && 
    r.date === date &&
    !existingReqIds.has(r.id) // Only those not yet generated
  )
  
  // Pause requests covering this date
  const pauseRequests = allApprovedRequests.filter(r => r.requestType === 'pause_delivery' && date >= r.startDate && date <= r.endDate)
  const pausedCustomerIds = new Set(pauseRequests.map(r => r.customerId))

  const deliveriesToCreate = []

  // 5. Build missing deliveries for subscriptions
  activeSubs.forEach(sub => {
    if (pausedCustomerIds.has(sub.customerId)) return 

    const cust = customerMap[sub.customerId]
    if (!cust) return
    deliveriesToCreate.push({
      customerId: sub.customerId,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      locationUrl: cust.locationUrl || '',
      latitude: cust.latitude || null,
      longitude: cust.longitude || null,
      date,
      milkScheduledMl: sub.dailyQuantityMl,
      milkDeliveredMl: 0,
      status: 'pending',
      subscriptionId: sub.id,
      pricePerLiter: sub.pricePerLiter || 60,
      createdAt: serverTimestamp()
    })
  })

  // 6. Build missing deliveries for requests
  deliveryRequests.forEach(req => {
    const cust = customerMap[req.customerId]
    if (!cust) return
    
    const activeSub = activeSubs.find(s => s.customerId === req.customerId)
    const price = activeSub?.pricePerLiter || 60

    deliveriesToCreate.push({
      customerId: req.customerId,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      locationUrl: cust.locationUrl || '',
      latitude: cust.latitude || null,
      longitude: cust.longitude || null,
      date,
      milkScheduledMl: req.milkMl,
      milkDeliveredMl: 0,
      status: 'pending',
      requestId: req.id,
      requestType: req.requestType,
      pricePerLiter: price,
      createdAt: serverTimestamp()
    })
  })

  // 7. Batch write
  const promises = deliveriesToCreate.map(d => addDoc(collection(db, COLLECTION), d))
  await Promise.all(promises)

  return { created: deliveriesToCreate.length, totalExisting: existingSnap.size }
}

export const getDeliveriesByDate = async (date) => {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  results.sort((a, b) => a.customerName.localeCompare(b.customerName))
  return results
}

export const getDeliveriesByAgent = async (agentId, date) => {
  const q = query(
    collection(db, COLLECTION),
    where('agentId', '==', agentId),
    where('date', '==', date)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getDeliveriesByCustomer = async (customerId) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId)
  )
  const snap = await getDocs(q)
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  results.sort((a, b) => b.date.localeCompare(a.date))
  return results
}

export const uploadDeliveryPhoto = async (file) => {
  if (!file) return null;
  
  try {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
    const { storage } = await import('../firebase/config')
    
    // Create a unique filename
    const filename = `deliveries/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storageRef = ref(storage, filename)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (e) {
    console.error("Image upload failed:", e);
    throw new Error(e.message || "Failed to upload image. Please try again.");
  }
}

export const markDelivered = async (deliveryId, milkDeliveredMl, photoUrl = null) => {
  const updateData = {
    milkDeliveredMl,
    status: 'delivered',
    deliveredAt: serverTimestamp()
  };
  if (photoUrl) updateData.photoUrl = photoUrl;
  
  return await updateDoc(doc(db, COLLECTION, deliveryId), updateData)
}

export const markSkipped = async (deliveryId, reason = '') => {
  return await updateDoc(doc(db, COLLECTION, deliveryId), {
    status: 'skipped',
    skipReason: reason,
    updatedAt: serverTimestamp()
  })
}

export const assignAgent = async (deliveryId, agentId) => {
  return await updateDoc(doc(db, COLLECTION, deliveryId), { agentId })
}

export const getDeliveryStats = async (date) => {
  const deliveries = await getDeliveriesByDate(date)
  const total = deliveries.length
  const completed = deliveries.filter(d => d.status === 'delivered').length
  const pending = deliveries.filter(d => d.status === 'pending').length
  const skipped = deliveries.filter(d => d.status === 'skipped').length
  const totalMlScheduled = deliveries.reduce((s, d) => s + (d.milkScheduledMl || 0), 0)
  const totalMlDelivered = deliveries.reduce((s, d) => s + (d.milkDeliveredMl || 0), 0)
  return { total, completed, pending, skipped, totalMlScheduled, totalMlDelivered }
}

/**
 * Creates a single delivery record for an approved request if deliveries for that date 
 * have already been generated.
 */
export const createDeliveryForRequest = async (request) => {
  const activeTypes = ['extra_milk', 'morning_milk', 'evening_milk', 'custom']
  if (!activeTypes.includes(request.requestType)) return null

  const qExist = query(collection(db, COLLECTION), where('date', '==', request.date))
  const existing = await getDocs(qExist)
  if (existing.empty) return null

  const qReq = query(collection(db, COLLECTION), where('requestId', '==', request.id))
  const existingReq = await getDocs(qReq)
  if (!existingReq.empty) return null

  const custSnap = await getDocs(query(collection(db, 'customers'), where('__name__', '==', request.customerId)))
  if (custSnap.empty) return null
  const cust = custSnap.docs[0].data()

  return await addDoc(collection(db, COLLECTION), {
    customerId: request.customerId,
    customerName: cust.name,
    customerPhone: cust.phone,
    customerAddress: cust.address,
    locationUrl: cust.locationUrl || '',
    latitude: cust.latitude || null,
    longitude: cust.longitude || null,
    date: request.date,
    milkScheduledMl: request.milkMl,
    milkDeliveredMl: 0,
    status: 'pending',
    requestId: request.id,
    requestType: request.requestType,
    pricePerLiter: request.pricePerLiter || cust.pricePerLiter || 60,
    createdAt: serverTimestamp()
  })
}
