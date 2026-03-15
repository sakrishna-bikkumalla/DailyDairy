import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

export const updateUserProfile = async (userId, { name, phone, password }) => {
  const updates = {}
  if (name !== undefined) updates.name = name.trim()
  if (phone !== undefined) updates.phone = phone.trim()
  if (password) updates.password = password  // only update if provided (non-empty)
  updates.updatedAt = serverTimestamp()
  await updateDoc(doc(db, 'users', userId), updates)
}

// Auth is handled via Firestore users collection (phone number + hashed password)
// For simplicity in production this should use Firebase Auth with custom auth flow
// Here we store users with: phone, passwordHash, role, name, linkedId (customerId or agentId)

export const loginWithPhone = async (phone, password) => {
  const q = query(collection(db, 'users'), where('phone', '==', phone))
  const snap = await getDocs(q)
  if (snap.empty) throw new Error('No account found with this phone number')

  const userDoc = snap.docs[0]
  const userData = userDoc.data()

  // Simple password comparison (in production, use bcrypt or Firebase Auth)
  if (userData.password !== password) throw new Error('Incorrect password')

  return { id: userDoc.id, ...userData }
}

export const getUserById = async (id) => {
  const snap = await getDoc(doc(db, 'users', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const seedDemoData = async () => {
  // Check if demo data already exists
  const q = query(collection(db, 'users'), where('phone', '==', '9999900001'))
  const existing = await getDocs(q)
  if (!existing.empty) return { alreadySeeded: true }

  // Create demo users
  const adminRef = await addDoc(collection(db, 'users'), {
    phone: '9999900001',
    password: 'admin123',
    role: 'admin',
    name: 'Ravi Kumar (Admin)',
    createdAt: serverTimestamp()
  })

  // Demo customers
  const customers = [
    { name: 'Ramesh Sharma', phone: '9876543210', address: 'House No 12, Main Road, Nagpur', dailyMilkMl: 500, pricePerLiter: 60, latitude: 21.1458, longitude: 79.0882 },
    { name: 'Lakshmi Devi', phone: '9876543211', address: 'Near Temple, West Street, Nagpur', dailyMilkMl: 750, pricePerLiter: 60, latitude: 21.1500, longitude: 79.0900 },
    { name: 'Suresh Patil', phone: '9876543212', address: 'Shivaji Nagar, Plot 5, Nagpur', dailyMilkMl: 1000, pricePerLiter: 55, latitude: 21.1420, longitude: 79.0850 },
    { name: 'Priya Nair', phone: '9876543213', address: 'Gandhi Road, Flat 3B, Nagpur', dailyMilkMl: 500, pricePerLiter: 60, latitude: 21.1480, longitude: 79.0920 },
    { name: 'Arjun Singh', phone: '9876543214', address: 'Orange City Township, Nagpur', dailyMilkMl: 1500, pricePerLiter: 55, latitude: 21.1460, longitude: 79.0870 },
  ]

  const customerRefs = []
  for (const c of customers) {
    const ref = await addDoc(collection(db, 'customers'), { ...c, createdAt: serverTimestamp() })
    customerRefs.push({ id: ref.id, ...c })
  }

  // Demo agents
  const agents = [
    { name: 'Vijay Yadav', phone: '9111100001', assignedArea: 'North Zone' },
    { name: 'Santosh Kumar', phone: '9111100002', assignedArea: 'South Zone' },
  ]

  const agentRefs = []
  for (const a of agents) {
    const ref = await addDoc(collection(db, 'agents'), { ...a, createdAt: serverTimestamp() })
    agentRefs.push({ id: ref.id, ...a })
  }

  // Create customer user accounts
  await addDoc(collection(db, 'users'), {
    phone: '9876543210',
    password: 'cust123',
    role: 'customer',
    name: 'Ramesh Sharma',
    linkedId: customerRefs[0].id,
    createdAt: serverTimestamp()
  })

  // Create agent user accounts
  await addDoc(collection(db, 'users'), {
    phone: '9111100001',
    password: 'agent123',
    role: 'agent',
    name: 'Vijay Yadav',
    linkedId: agentRefs[0].id,
    createdAt: serverTimestamp()
  })

  // Create some demo requests
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  await addDoc(collection(db, 'requests'), {
    customerId: customerRefs[0].id,
    customerName: 'Ramesh Sharma',
    requestType: 'extra_milk',
    milkMl: 1000,
    date: tomorrowStr,
    status: 'pending',
    createdAt: serverTimestamp()
  })

  await addDoc(collection(db, 'requests'), {
    customerId: customerRefs[1].id,
    customerName: 'Lakshmi Devi',
    requestType: 'pause_delivery',
    startDate: tomorrowStr,
    endDate: tomorrowStr,
    reason: 'Going to village',
    status: 'pending',
    createdAt: serverTimestamp()
  })

  return { seeded: true, customers: customerRefs.length, agents: agentRefs.length }
}
