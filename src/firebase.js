// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; 
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyhaOb9vVaN63bcfsGkwBj8yj8p7c_zlw",
  authDomain: "real-chat-app-aea1f.firebaseapp.com",
  databaseURL:"https://real-chat-app-aea1f-default-rtdb.firebaseio.com/",
  projectId: "real-chat-app-aea1f",
  storageBucket: "real-chat-app-aea1f.firebasestorage.app",
  messagingSenderId: "1073749749965",
  appId: "1:1073749749965:web:6ac064766d51142e267984",
  measurementId: "G-BWZ6ZNS8BH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); 
export { app, db, storage,auth };
export const rtdb = getDatabase(app);
//const analytics = getAnalytics(app);