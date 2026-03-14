# FarmToHome: Smart Dairy Delivery Management System

A full-stack, comprehensive web application built to digitize and streamline milk delivery operations for dairy vendors. The system supports three distinct roles—**Admin (Vendor)**, **Customer**, and **Delivery Agent**—each with their own tailored dashboards, features, and workflows.

---

## 🚀 Features

### 🛡️ Admin (Vendor) Module
* **Dashboard:** High-level analytics, including total customers, daily delivery progress, and pending requests.
* **Customer Management:** Full CRUD operations for customers. Capture detailed addresses (Street/Colony, Landmark, Pincode, City, State, Country) and precise GPS locations via an interactive Leaflet map.
* **Agent Management:** Add and manage delivery personnel.
* **Daily Deliveries:** Dynamically generate delivery manifests for any given day based on active customer subscriptions. Assign specific agents to specific deliveries.
* **Manage Subscriptions:** Easily track the lifetime value of every customer. Search customers by name or phone number, and click on them to view lifetime milk delivered, total revenue billed, and a chronological log of all historical deliveries.
* **Customer Requests:** Review, approve, or reject customer requests (Extra Milk, Morning/Evening specifics, Pauses). Rejecting a request allows the admin to provide a concrete reason (e.g., "No Stock") which is communicated back to the user.
* **Billing System:** Automated monthly billing calculator that aggregates completed deliveries and computes total amounts due per customer based on custom price-per-liter rates.

### 🥛 Customer Module
* **Dashboard:** View upcoming scheduled deliveries at a glance.
* **Submit Requests:** 
  * Request *Extra Milk* or *Morning/Evening Milk*. 
  * Submit *Custom Requests* specifying exact date, quantity, preferred time (Morning/Evening), and milk type (Cow/Buffalo).
  * Request a *Pause* in delivery for a specified date range (e.g., going on vacation).
* **Delivery History:** 
  * View a visual log of all past deliveries.
  * See photographic proof of delivery (photos taken by agents at the doorstep).
* **Request History:** Check the status of special requests (Pending, Approved, Rejected) including polite feedback and rejection reasons from the admin.

### 🚚 Delivery Agent Module
* **Agent Dashboard:** Track daily assigned deliveries and completion progress.
* **Delivery Route:** View an interactive map (Leaflet) plotting all assigned customers for the day. Click on markers to access Google Maps navigation.
* **Proof of Delivery:** Mark deliveries as completed, optionally adjusting the delivered quantity (e.g., if the customer requested less at the door), and upload a photo of the delivered milk as proof.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite
* **Styling:** Tailwind CSS (Custom dairy-themed color palette: greens, creams, ambers)
* **Routing:** React Router v6 (Protected Routes based on User Roles)
* **Mapping & Location:** Leaflet.js, React-Leaflet, OpenStreetMap
* **Backend / Database:** Firebase Firestore (NoSQL Document Database)
* **Authentication:** Firebase Auth
* **Storage:** Cloudinary (for fast, reliable Delivery Photo uploads)
* **Icons & UI:** React Icons, React Hot Toast

---

## 💻 How to Run Locally

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [npm](https://www.npmjs.com/) or [yarn]

### 2. Clone the Repository
If you haven't already, clone the project and navigate to the root directory:
```bash
git clone https://gitlab.com/dairyfoam-project/farmtohome.git
cd farmtohome
```

### 3. Install Dependencies
Install all required NPM packages:
```bash
npm install
```

### 4. Environment Setup
The project relies on Firebase and Cloudinary. You must create a `.env` file in the root of the `farmtohome` directory with your specific API keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 5. Start the Development Server
Run the Vite development server:
```bash
npm run dev
```

### 6. View the App
Open your browser and navigate to the local URL provided in your terminal, usually:
```
http://localhost:5173
```

---

## 🔐 Login Roles (Demo)
By default, the login page is equipped with a **Demo Login** section that allows you to bypass email/password entry and log in instantly as an Admin, Customer, or Agent using pre-seeded Firestore data to test the routing and permissions. 

*Enjoy managing your dairy deliveries efficiently!* 🐄🥛
