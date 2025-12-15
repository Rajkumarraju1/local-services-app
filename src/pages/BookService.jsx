import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById, addBooking } from '../services/dataService';
import { useAuth } from '../lib/AuthContext';

export default function BookService() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchService() {
            try {
                const data = await getServiceById(id);
                setService(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchService();
    }, [id]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to book a service");
            navigate('/login');
            return;
        }

        setSubmitting(true);
        try {
            await addBooking({
                serviceId: id,
                serviceTitle: service.title,
                providerId: service.providerId,
                customerId: currentUser.uid,
                customerEmail: currentUser.email,
                price: service.price,
                date,
                notes
            });
            alert('Booking request sent!');
            navigate('/dashboard');
        } catch (error) {
            alert("Failed to book service");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!service) return <div>Service not found</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Book Service</h1>
            <div className="card mb-6">
                <h2 className="text-xl font-semibold">{service.title}</h2>
                <p className="text-gray-500">{service.category}</p>
                <div className="text-2xl font-bold text-primary mb-6">
                    ₹{service.price} <span className="text-sm font-normal text-muted">/ job</span>
                </div>
            </div>

            <form onSubmit={handleBook} className="space-y-6 card">
                <div>
                    <label className="block text-sm font-medium mb-1">Preferred Date & Time</label>
                    <input
                        type="datetime-local"
                        className="input"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Notes for Provider</label>
                    <textarea
                        className="input h-32"
                        placeholder="Describe your issue or requirements..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    ></textarea>
                </div>
                <button
                    disabled={submitting}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Processing...' : 'Confirm Booking'}
                </button>
            </form>
        </div>
    );
}
