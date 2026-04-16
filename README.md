# Daily Dairy: Smart Dairy Delivery Management System 🥛🐄

**Daily Dairy** is a professional-grade, mobile-first management platform designed to digitize and automate dairy delivery operations. Built for modern vendors, it provides a seamless bridge between admins, customers, and delivery agents through a "High-Density" information-rich interface.

---

## 📱 Mobile-First "High-Density" UX
Our design philosophy focuses on maximizing data visibility while maintaining a premium, "living" interface.
- **Micro-Animations**: Real-time feedback and transitions for a responsive feel.
- **Glassmorphism**: Sleek, translucent card designs optimized for dark mode environments.
- **Adaptive Tables**: Legacy tables automatically transform into high-density card grids on mobile devices to prevent horizontal scrolling.

---

## 🚀 Core Modules

### 🛡️ Admin (Vendor) Control Center
- **Smart Manifests**: Dynamically generate delivery routes based on active subscriptions and approved requests.
- **Agent Orchestration**: Real-time tracking of agent progress and delivery completion statuses.
- **Subscription Lifecycle**: Comprehensive tracking of customer lifetime value (LTV), billing history, and delivery logs.
- **Automated Billing**: End-of-month invoice calculation based on actual delivered quantities.

### 🥛 Customer Experience
- **Request Management**: Submit and track requests for extra milk, custom delivery times, or vacation pauses.
- **Fulfillment Transparency**: Real-time visibility into whether an approved request has been delivered, skipped, or is still pending arrival.
- **Delivery Proof**: Direct access to photographic proof of delivery and historical logs.

### 🚚 Delivery Agent Interface
- **Optimized Routes**: High-density manifest lists with integrated Leaflet maps and Google Maps navigation.
- **Smart Fulfillment**: One-tap "Mark as Done" with support for partial quantity adjustments and photo uploads.
- **Auto-Focus Workflow**: Intelligent filters that automatically prioritize "Pending Arrival" tasks to keep agents focused on their next stop.

---

## 🛠️ Technology Stack

- **Frontend**: React.js + Vite (optimized for speed)
- **Styling**: Vanilla CSS + Tailwind CSS (Custom "Daily Dairy" Design System)
- **Backend/DB**: Google Firebase (Firestore, Hosting)
- **Authentication**: Custom Firestore-based logic (Phone Number + Password Hash)
- **Mapping**: Leaflet / OpenStreetMap
- **Storage**: Cloudinary (Proof of Delivery Image Storage)

---

## 💻 Technical Setup

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Initial Installation
1. Clone and install:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_CLOUDINARY_CLOUD_NAME=...
   ```

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm run build
firebase deploy
```

---

## 📖 Extended Documentation
- [Architecture Overview](file:///home/saikrishna-bikkumalla/dev-projects/dairy%20app%202/DailyDairy/ARCHITECTURE.md)
- [Mobile Design Standards](file:///home/saikrishna-bikkumalla/dev-projects/dairy%20app%202/DailyDairy/MOBILE_UX_STANDARDS.md)
- [Deployment Guide](file:///home/saikrishna-bikkumalla/dev-projects/dairy%20app%202/DailyDairy/DEVELOPMENT.md)

---
*Built with passion for the dairy industry.* 🐄🥛
