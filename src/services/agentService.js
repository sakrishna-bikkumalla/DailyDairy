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

const COLLECTION = 'agents'

export const getAgents = async (adminId) => {
  const q = query(
    collection(db, COLLECTION),
    where('adminId', '==', adminId)
  )
  const snap = await getDocs(q)
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return results.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export const addAgent = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  })
}

// Creates an agent record AND a login account in the users collection.
// Password = admin-provided (data.password) or defaults to agent's phone number.
export const createAgentWithAccount = async (data) => {
  // Strip password from agent profile data — it belongs in users doc only
  const { password: providedPassword, ...agentData } = data
  const cleanPhone = (data.phone || '').trim()
  const loginPassword = (providedPassword && providedPassword.trim()) ? providedPassword.trim() : cleanPhone

  // 1. Create the agent profile doc (no password stored here)
  const agentRef = await addDoc(collection(db, COLLECTION), {
    ...agentData,
    phone: cleanPhone,
    createdAt: serverTimestamp()
  })

  // 2. Create the users login doc linked to this agent
  await addDoc(collection(db, 'users'), {
    name: data.name,
    phone: cleanPhone,
    password: loginPassword,
    role: 'agent',
    linkedId: agentRef.id,
    adminId: data.adminId,  // inherit admin's tenant ID
    createdAt: serverTimestamp()
  })

  return { agentId: agentRef.id, defaultPassword: loginPassword }
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
