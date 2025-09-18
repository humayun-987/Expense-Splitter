// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpuN5VJIzI-NYO8ARRZ0MZfTSK3Kfzhxw",
  authDomain: "expense-splitter-d0293.firebaseapp.com",
  projectId: "expense-splitter-d0293",
  storageBucket: "expense-splitter-d0293.firebasestorage.app",
  messagingSenderId: "755741304036",
  appId: "1:755741304036:web:431855ae260b22ccd2f8f1",
  measurementId: "G-V4N480D78P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };