# Development & Deployment Guide: Daily Dairy

This guide provides instructions for setting up the local development environment and deploying **Daily Dairy** to production using Firebase Hosting.

## 🛠️ Local Setup

### 1. Environment Configuration
Create a `.env` file in the root directory. You will need to obtain these credentials from your Firebase Console and Cloudinary Dashboard.

```bash
# Firebase Credentials (Firestore & Hosting)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your-project-id
# (Note: Auth Domain and Storage Bucket are optional for Firestore-only usage)

# Cloudinary (Proof of Delivery Uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### 2. Dependency Management
```bash
npm install
```

### 3. Running the Development Server
```bash
npm run dev
```

---

## 🚀 Deployment Workflow

### 1. Build for Production
Generate the optimized build files in the `dist/` folder:
```bash
npm run build
```

### 2. Initialize Firebase (One-time)
If you haven't initialized the project:
```bash
firebase init
```
- Select **Hosting**.
- Choose `dist` as your public directory.
- Configure as a **single-page app** (Yes).
- Do not overwrite `dist/index.html`.

### 3. Deploy to Live
```bash
firebase deploy
```

---

## 🧹 Maintenance Commands

- **Build Analysis**: Check chunk sizes and dependencies.
  ```bash
  npm run build
  ```
- **Local Preview**: Test the production build locally.
  ```bash
  npx vite preview
  ```

## 🛠️ Troubleshooting

### Chunk Size Warnings
If you see warnings about large chunks, ensure that `firebase` and `leaflet` are correctly being split. Check `vite.config.js` for optimization patterns.

### Image Upload Failures
Image uploads rely on a valid Cloudinary "Unsigned preset". Ensure your preset is configured for "Unsigned" access in the Cloudinary settings.
