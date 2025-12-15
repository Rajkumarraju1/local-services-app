import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCrAzLdxHnc004x2WayZl5JJxa_Bn6iPTk",
    authDomain: "local-services-app-fd246.firebaseapp.com",
    projectId: "local-services-app-fd246",
    storageBucket: "local-services-app-fd246.firebasestorage.app",
    messagingSenderId: "777053509850",
    appId: "1:777053509850:web:9b98bb09b1618ed326ade3",
    measurementId: "G-26RMS6K9MV"
};

console.log("Initializing app...");
try {
    const app = initializeApp(firebaseConfig);
    console.log("App initialized.");

    // Test Firestore
    console.log("Testing Firestore connection...");
    const db = getFirestore(app);
    try {
        const docRef = await addDoc(collection(db, "test_connection"), {
            test: true,
            timestamp: new Date().toISOString()
        });
        console.log("Firestore write successful. Doc ID:", docRef.id);
    } catch (e) {
        console.error("Firestore write failed:", e.message);
        if (e.code) console.error("Error code:", e.code);
    }

    // Test Analytics initialization (might fail in Node environment without polyfills, but checking for crash)
    // Analytics usually requires window/document.
    try {
        // In node this usually warns or does nothing, but shouldn't crash unless config is very wrong.
        // However, typical firebase SDK for web might expect browser env for analytics.
        // We will skip actual analytics call but just check if getAnalytics throws.
        // const analytics = getAnalytics(app); // Commenting out as it WILL fail in Node (no window)
        // console.log("Analytics initialized (mock check).");
    } catch (e) {
        console.error("Analytics initialization failed:", e.message);
    }

} catch (e) {
    console.error("Fatal error:", e);
}
