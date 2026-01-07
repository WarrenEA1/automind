// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <--- Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD53sYWZktMWaRbbA3WVMd2CWZmZLcpHTQ",
  authDomain: "automind-c7f46.firebaseapp.com",
  projectId: "automind-c7f46",
  storageBucket: "automind-c7f46.firebasestorage.app",
  messagingSenderId: "604661832430",
  appId: "1:604661832430:web:850dba3f701f5bf8a331ff",
  measurementId: "G-XMXRPRK7RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Firestore (The Database)
export const db = getFirestore(app);