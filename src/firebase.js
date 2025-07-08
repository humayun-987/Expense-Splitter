import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPJyLwFTSVaBj9H3JyB81EdJaSE4hjluM",
  authDomain: "unosq-23-1.firebaseapp.com",
  databaseURL: "https://unosq-23-1-default-rtdb.firebaseio.com",
  projectId: "unosq-23-1",
  storageBucket: "unosq-23-1.appspot.com",
  messagingSenderId: "842602193414",
  appId: "1:842602193414:web:5a67f90ba1cd1e041bd987",
  measurementId: "G-4GZNPN14WH"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
