import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTION = 'agents'

export const getAgents = async () => {
  const q = query(collection(db, COLLECTION), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addAgent = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  })
}

export const updateAgent = async (id, data) => {
  return await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export const deleteAgent = async (id) => {
  return await deleteDoc(doc(db, COLLECTION, id))
}
