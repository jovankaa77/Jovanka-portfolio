import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA3MShpjP0Up78gXjhrdFDa9PvlNimNzQE",
  authDomain: "porfolio-c7784.firebaseapp.com",
  projectId: "porfolio-c7784",
  storageBucket: "porfolio-c7784.firebasestorage.app",
  messagingSenderId: "998104124909",
  appId: "1:998104124909:web:c518c610f9eeb7a3792be4",
  measurementId: "G-1NEE7LWCBS",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
