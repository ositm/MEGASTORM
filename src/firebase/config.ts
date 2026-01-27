
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBBlBIh9aUZXTmEQ74hiutoeDl40fs8DPg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lablink-df67e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lablink-df67e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lablink-df67e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "153996736002",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:153996736002:web:c2817da9067ebb3272d91b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-31SD4Y913N"
};

export const firebaseConfig = config;
