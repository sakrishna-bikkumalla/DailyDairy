# Architecture Overview: Daily Dairy

Daily Dairy is built as a single-page application (SPA) using a **Client-Side Service-Oriented Architecture (CSSOA)**. It leverages Firebase Firestore for real-time data persistence and Firebase Hosting for distribution.

## 🏛️ Application Layers

### 1. Presentation Layer (React Component Tree)
- **Modular Components**: Reusable UI elements in `src/components/`.
- **Role-Based Routing**: Protected routes enforce access based on the logged-in user's role (Admin, Agent, Customer).
- **Responsive Layouts**: Unified styling system using Tailwind CSS with specialized mobile adaptations for high-density information display.

### 2. Logic & State Management
- **Context API (`src/contexts/`)**:
    - **AuthContext**: Manages user sessions and role-based permissions using a custom Firestore-based credential system.
- **Service Hooks**: Custom hooks (`src/hooks/`) for reusable UI logic.
- **Service Layer (`src/services/`)**:
    - Decouples the UI from Firestore details. 
    - Each service (e.g., `deliveryService.js`, `requestService.js`) handles CRUD operations and complex data aggregation (like month-end billing).

### 3. Data Infrastructure (Firebase & Firestore)
- **Firestore**: A NoSQL document database.
- **Real-Time Synchronicity**: Used primarily for delivery tracking and request approval flows.
- **Cloudinary**: Externally managed binary storage for high-speed delivery photo uploads.

---

## 📂 Firestore Collection Schema

### `admins`
- Identity and billing configurations for dairy vendors.

### `agents`
- Profile data for delivery personnel, linked to an Admin.

### `customers`
- Demographic and subscription data, linked to an Admin.
- Includes lat/lng for route mapping.

### `subscriptions`
- Defines the "Expected" daily delivery for a customer.
- Fields: `dailyQuantityMl`, `pricePerLiter`, `startDate`, `endDate`.

### `requests`
- Special customer instructions (Extra milk, Pause, etc.).
- Linked to specific dates and statuses.

### `deliveries`
- The daily execution log.
- Fields: `milkScheduledMl`, `milkDeliveredMl`, `status` (pending/delivered/skipped), `requestId`.

---

## 🔐 Security & Access Control

1. **Custom Authentication**: Uses a secure Firestore `users` collection to store and verify credentials (Phone Number + Password).
2. **Route Protection**: The `App.jsx` router checks the `user.role` stored in the state before rendering protected dashboard components.
3. **Admin Hierarchy**: Agents and Customers are scoped to an `adminId`, ensuring data isolation between different dairy vendors.
