import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlG1hKOgeFe5upzJqCmC_C-LG5xVmF0JA",
  authDomain: "ecodrop-app.firebaseapp.com",
  projectId: "ecodrop-app",
  storageBucket: "ecodrop-app.firebasestorage.app",
  messagingSenderId: "940834556017",
  appId: "1:940834556017:web:7c767d4fdad11722b5f3d0",
  measurementId: "G-EFZ3YJFEDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Analytics
export const analytics = getAnalytics(app);

export default app;
