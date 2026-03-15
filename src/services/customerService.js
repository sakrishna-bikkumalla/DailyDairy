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

// Creates a customer record AND a login account in the users collection.
// Password = admin-provided (data.password) or defaults to customer's phone number.
export const createCustomerWithAccount = async (data) => {
  // Strip password from customer profile data — it belongs in users doc only
  const { password: providedPassword, ...customerData } = data
  const loginPassword = (providedPassword && providedPassword.trim()) ? providedPassword.trim() : data.phone

  // 1. Create the customer profile doc (no password stored here)
  const customerRef = await addDoc(collection(db, COLLECTION), {
    ...customerData,
    createdAt: serverTimestamp()
  })

  // 2. Create the users login doc linked to this customer
  await addDoc(collection(db, 'users'), {
    name: data.name,
    phone: data.phone,
    password: loginPassword,
    role: 'customer',
    linkedId: customerRef.id,
    createdAt: serverTimestamp()
  })

  return { customerId: customerRef.id, defaultPassword: loginPassword }
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
