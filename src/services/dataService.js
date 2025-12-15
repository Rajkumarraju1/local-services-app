import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function addService(serviceData) {
    try {
        const docRef = await addDoc(collection(db, 'services'), {
            ...serviceData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding service: ", error);
        throw error;
    }
}

export async function getServices(category = null) {
    try {
        let q = collection(db, 'services');
        if (category && category !== 'All') {
            q = query(q, where('category', '==', category));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting services: ", error);
        throw error;
    }
}

export async function getServiceById(id) {
    const docRef = doc(db, 'services', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such service!");
    }
}

export async function addBooking(bookingData) {
    try {
        const docRef = await addDoc(collection(db, 'bookings'), {
            ...bookingData,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating booking: ", error);
        throw error;
    }
}

export async function getBookings(userId, role) {
    try {
        const field = role === 'customer' ? 'customerId' : 'providerId';
        const q = query(collection(db, 'bookings'), where(field, '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting bookings: ", error);
        return [];
    }
}



export async function updateBookingStatus(bookingId, status) {
    try {
        const docRef = doc(db, 'bookings', bookingId);
        await updateDoc(docRef, { status });
    } catch (error) {
        console.error("Error updating booking status: ", error);
        throw error;
    }
}
export async function getReviews(serviceId) {
    try {
        const q = query(collection(db, 'reviews'), where('serviceId', '==', serviceId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting reviews: ", error);
        return [];
    }
}

export async function addReview(reviewData) {
    // reviewData: { serviceId, bookingId, rating, comment, userId, userName }
    try {
        // 1. Add the review document
        await addDoc(collection(db, 'reviews'), {
            ...reviewData,
            createdAt: new Date().toISOString()
        });

        // 2. Update Service Aggregates (Average Rating)
        const serviceRef = doc(db, 'services', reviewData.serviceId);
        const serviceSnap = await getDoc(serviceRef);

        if (serviceSnap.exists()) {
            const service = serviceSnap.data();
            const currentCount = service.reviewCount || 0;
            const currentAvg = service.averageRating || 0;

            const newCount = currentCount + 1;
            // logic: (oldSum + newRating) / newCount
            const newAvg = ((currentAvg * currentCount) + Number(reviewData.rating)) / newCount;

            await updateDoc(serviceRef, {
                reviewCount: newCount,
                averageRating: Number(newAvg.toFixed(1)) // Keep it clean, e.g. 4.5
            });
        }
    } catch (error) {
        console.error("Error adding review: ", error);
        throw error;
    }
}

export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
}

export async function updateUserProfile(userId, data) {
    try {
        const docRef = doc(db, 'users', userId);
        // Using setDoc with merge: true to create if not exists or update
        // But since users are created on auth, updateDoc is safer if we assume existence, 
        // however registerUser might not create the doc layout we expect if extended.
        // We'll use updateDoc as the user doc should exist from AuthContext/Register.
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}

export async function getServicesByProvider(providerId) {
    try {
        const q = query(collection(db, 'services'), where('providerId', '==', providerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting provider services:", error);
        return [];
    }
}
