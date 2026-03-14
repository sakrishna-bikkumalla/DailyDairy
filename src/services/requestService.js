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

export const getRequests = async (status = null) => {
  let q
  if (status) {
    q = query(
      collection(db, COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
  } else {
    q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getCustomerRequests = async (customerId) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const updateRequestStatus = async (requestId, status) => {
  return await updateDoc(doc(db, COLLECTION, requestId), {
    status,
    reviewedAt: serverTimestamp()
  })
}
