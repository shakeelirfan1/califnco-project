
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAucNNh_DSBa7rVhRTq9oy1-zB_qK3NWqc",
  authDomain: "calfinco.firebaseapp.com",
  projectId: "calfinco",
  storageBucket: "calfinco.firebasestorage.app",
  messagingSenderId: "314587640683",
  appId: "1:314587640683:web:286f589bc1e96aadc4522e",
  measurementId: "G-KGYFDHLQJF"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
