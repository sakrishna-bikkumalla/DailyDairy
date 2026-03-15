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

export const createDailyDeliveries = async (date, customers, agentId = null) => {
  // Check if deliveries for this date already exist
  const q = query(collection(db, COLLECTION), where('date', '==', date))
  const existing = await getDocs(q)
  if (!existing.empty) return { alreadyExists: true }

  const batch = customers.map(customer =>
    addDoc(collection(db, COLLECTION), {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      locationUrl: customer.locationUrl || '',
      latitude: customer.latitude || null,
      longitude: customer.longitude || null,
      agentId: agentId,
      date,
      milkScheduledMl: customer.dailyMilkMl,
      milkDeliveredMl: 0,
      status: 'pending', // pending | delivered | skipped
      createdAt: serverTimestamp()
    })
  )
  await Promise.all(batch)
  return { created: customers.length }
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
