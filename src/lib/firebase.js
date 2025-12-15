import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



console.log('Firebase initializing...');
const firebaseConfig = {
  apiKey: "AIzaSyCrAzLdxHnc004x2WayZl5JJxa_Bn6iPTk",
  authDomain: "local-services-app-fd246.firebaseapp.com",
  projectId: "local-services-app-fd246",
  storageBucket: "local-services-app-fd246.firebasestorage.app",
  messagingSenderId: "777053509850",
  appId: "1:777053509850:web:9b98bb09b1618ed326ade3",
  measurementId: "G-26RMS6K9MV"
};

const app = initializeApp(firebaseConfig);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics failed to initialize:", e);
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
