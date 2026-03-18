import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

export const updateUserProfile = async (userId, data) => {
  const { name, phone, password, email, companyName, companyLocation } = data;
  const updates = {}
  if (name !== undefined) updates.name = name.trim()
  if (phone !== undefined) updates.phone = phone.trim()
  if (email !== undefined) updates.email = email.trim()
  if (companyName !== undefined) updates.companyName = companyName.trim()
  if (companyLocation !== undefined) updates.companyLocation = companyLocation.trim()
  if (password) updates.password = password  // only update if provided (non-empty)
  updates.updatedAt = serverTimestamp()
  await updateDoc(doc(db, 'users', userId), updates)
}

// Auth is handled via Firestore users collection (phone number + hashed password)
// For simplicity in production this should use Firebase Auth with custom auth flow
// Here we store users with: phone, passwordHash, role, name, linkedId (customerId or agentId)

export const loginWithPhone = async (phone, password) => {
  const cleanPhone = (phone || '').trim()
  const q = query(collection(db, 'users'), where('phone', '==', cleanPhone))
  const snap = await getDocs(q)
  if (snap.empty) {
    const allUsersSnap = await getDocs(collection(db, 'users'))
    const allPhones = allUsersSnap.docs.map(d => `'${d.data().phone}'(${d.data().role})`).join(', ')
    throw new Error(`Account '${cleanPhone}' missing. DB has: ${allPhones}`)
  }

  const userDoc = snap.docs[0]
  const userData = userDoc.data()

  // Simple password comparison (in production, use bcrypt or Firebase Auth)
  if (userData.password !== password) throw new Error('Incorrect password')

  return { id: userDoc.id, ...userData }
}

export const registerAdmin = async (name, phone, email, password, companyName, companyLocation) => {
  const usersRef = collection(db, 'users')

  // Check if a user with this phone number already exists
  const phoneCheck = query(usersRef, where('phone', '==', phone.trim()))
  const phoneSnap = await getDocs(phoneCheck)
  if (!phoneSnap.empty) {
    throw new Error('An account with this phone number already exists')
  }

  const docRef = await addDoc(usersRef, {
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : null,
    password: password,
    role: 'admin',
    companyName: companyName.trim(),
    companyLocation: companyLocation.trim(),
    createdAt: serverTimestamp()
  })

  return {
    id: docRef.id,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : null,
    password: password,
    role: 'admin',
    companyName: companyName.trim(),
    companyLocation: companyLocation.trim(),
  }
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
    { name: 'Ramesh Sharma', phone: '9876543210', address: 'House No 12, Main Road, Nagpur', latitude: 21.1458, longitude: 79.0882 },
    { name: 'Lakshmi Devi', phone: '9876543211', address: 'Near Temple, West Street, Nagpur', latitude: 21.1500, longitude: 79.0900 },
    { name: 'Suresh Patil', phone: '9876543212', address: 'Shivaji Nagar, Plot 5, Nagpur', latitude: 21.1420, longitude: 79.0850 },
    { name: 'Priya Nair', phone: '9876543213', address: 'Gandhi Road, Flat 3B, Nagpur', latitude: 21.1480, longitude: 79.0920 },
    { name: 'Arjun Singh', phone: '9876543214', address: 'Orange City Township, Nagpur', latitude: 21.1460, longitude: 79.0870 },
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

export const clearDemoData = async () => {
  const collections = ['users', 'customers', 'agents', 'requests', 'subscriptions', 'deliveries'];
  const results = { deletedCount: 0 };
  
  // Define identifiable demo values
  const demoUserPhones = ['9999900001', '9876543210', '9111100001'];
  const demoCustomerPhones = ['9876543210', '9876543211', '9876543212', '9876543213', '9876543214'];
  const demoAgentPhones = ['9111100001', '9111100002'];
  const demoNames = ['Ravi Kumar (Admin)', 'Ramesh Sharma', 'Lakshmi Devi', 'Suresh Patil', 'Priya Nair', 'Arjun Singh', 'Vijay Yadav', 'Santosh Kumar'];

  // 1. Delete Users
  for (const phone of demoUserPhones) {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'users', d.id));
      results.deletedCount++;
    }
  }

  // 2. Delete Customers
  for (const phone of demoCustomerPhones) {
    const q = query(collection(db, 'customers'), where('phone', '==', phone));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      // Also delete related subscriptions and deliveries
      const subSnap = await getDocs(query(collection(db, 'subscriptions'), where('customerId', '==', d.id)));
      for (const s of subSnap.docs) await deleteDoc(doc(db, 'subscriptions', s.id));
      
      const delivSnap = await getDocs(query(collection(db, 'deliveries'), where('customerId', '==', d.id)));
      for (const deliv of delivSnap.docs) await deleteDoc(doc(db, 'deliveries', deliv.id));

      const reqSnap = await getDocs(query(collection(db, 'requests'), where('customerId', '==', d.id)));
      for (const r of reqSnap.docs) await deleteDoc(doc(db, 'requests', r.id));

      await deleteDoc(doc(db, 'customers', d.id));
      results.deletedCount++;
    }
  }

  // 3. Delete Agents
  for (const phone of demoAgentPhones) {
    const q = query(collection(db, 'agents'), where('phone', '==', phone));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      // Also delete agent-assigned deliveries
      const delivSnap = await getDocs(query(collection(db, 'deliveries'), where('agentId', '==', d.id)));
      for (const deliv of delivSnap.docs) {
        await updateDoc(doc(db, 'deliveries', deliv.id), { agentId: null });
      }
      await deleteDoc(doc(db, 'agents', d.id));
      results.deletedCount++;
    }
  }

  return results;
}

