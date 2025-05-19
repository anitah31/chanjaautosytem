// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD80Dcol38jA_UVOaGSSi4vDIgAQwoaEGs",
  authDomain: "chanja-autos.firebaseapp.com",
  projectId: "chanja-autos",
  storageBucket: "chanja-autos.firebasestorage.app",
  messagingSenderId: "228700649583",
  appId: "1:228700649583:web:e3401894f709cc12dbf59a",
  measurementId: "G-FRTV3QWLXE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);