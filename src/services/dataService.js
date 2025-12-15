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
