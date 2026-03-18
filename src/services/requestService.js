import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION = 'requests'

// request_type: 'extra_milk' | 'pause_delivery' | 'evening_milk'
// status: 'pending' | 'approved' | 'rejected'

export const submitRequest = async (customerId, customerName, type, data) => {
  return await addDoc(collection(db, COLLECTION), {
    customerId,
    customerName,
    requestType: type,
    status: 'pending',
    createdAt: serverTimestamp(),
    ...data
  })
}

export const getRequests = async (status = null, adminId = null) => {
  let constraints = []
  if (adminId) constraints.push(where('adminId', '==', adminId))
  if (status) constraints.push(where('status', '==', status))
  
  const q = query(collection(db, COLLECTION), ...constraints)
  const snap = await getDocs(q)
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
  return results
}

export const getCustomerRequests = async (customerId) => {
  const q = query(collection(db, COLLECTION), where('customerId', '==', customerId))
  const snap = await getDocs(q)
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  results.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
  return results
}

export const updateRequestStatus = async (requestId, status, rejectionReason = null) => {
  const data = {
    status,
    reviewedAt: serverTimestamp()
  }
  if (rejectionReason) data.rejectionReason = rejectionReason
  return await updateDoc(doc(db, COLLECTION, requestId), data)
}
