import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION = 'customers'

export const getCustomers = async () => {
  const q = query(collection(db, COLLECTION), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getCustomerById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const addCustomer = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  })
}

export const updateCustomer = async (id, data) => {
  return await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export const deleteCustomer = async (id) => {
  return await deleteDoc(doc(db, COLLECTION, id))
}
