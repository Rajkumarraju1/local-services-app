import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById, addBooking, getReviews } from '../services/dataService';
import { useAuth } from '../lib/AuthContext';

export default function BookService() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    console.log('Rendering BookService', { id, loading, service, reviews });

    useEffect(() => {
        async function fetchServiceAndReviews() {
            try {
                console.log('Fetching service/reviews for', id);
                const [serviceData, reviewsData] = await Promise.all([
                    getServiceById(id),
                    getReviews(id)
                ]);
                console.log('Fetched data:', { serviceData, reviewsData });
                setService(serviceData);
                setReviews(reviewsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchServiceAndReviews();
    }, [id]);

    // Load Razorpay SDK Helper
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to book a service");
            navigate('/login');
            return;
        }

        if (!date) {
            alert("Please select a date and time");
            return;
        }

        setSubmitting(true);

        try {
            // Load Razorpay SDK
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load. Are you online?');
                setSubmitting(false);
                return;
            }

            // Razorpay Options
            const options = {
                key: "rzp_test_RQzTCSQezDt3qq", // User provided Test Key
                amount: service.price * 100, // Amount in paise
                currency: "INR",
                name: "Local Services App",
                description: `Booking for ${service.title}`,
                image: "https://via.placeholder.com/150", // Optional: Add app logo here
                handler: async function (response) {
                    // Payment Success Handler
                    try {
                        await addBooking({
                            serviceId: id,
                            serviceTitle: service.title,
                            providerId: service.providerId,
                            customerId: currentUser.uid,
                            customerEmail: currentUser.email,
                            price: service.price,
                            date,
                            notes,
                            paymentStatus: 'paid',
                            paymentId: response.razorpay_payment_id,
                            paidAt: new Date().toISOString()
                        });
                        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                        navigate('/dashboard');
                    } catch (error) {
                        console.error(error);
                        alert("Payment successful but failed to save booking. Please contact support.");
                    }
                },
                prefill: {
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    email: currentUser.email,
                    contact: "" // Can add customer phone if available
                },
                theme: {
                    color: "#4f46e5"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert(`Payment FAILED: ${response.error.description}`);
                setSubmitting(false);
            });
            rzp.open();

        } catch (error) {
            console.error("Booking Error:", error);
            alert("An error occurred during booking initialization.");
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!service) return <div>Service not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="card bg-white shadow-lg border-t-4 border-primary">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary mb-1">{service.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted mb-4 uppercase tracking-wide font-semibold">
                            <span>{service.category}</span>
                            {service.averageRating > 0 && (
                                <span className="text-amber-500 flex items-center gap-1">
                                    • ★ {service.averageRating} ({service.reviewCount} reviews)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-primary">₹{service.price}</div>
                        <div className="text-xs text-muted">starting price</div>
                    </div>
                </div>
                <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-4 mt-2">{service.description || "No description provided."}</p>
            </div>

            <form onSubmit={handleBook} className="card glass space-y-6">
                <h3 className="text-lg font-semibold border-b border-slate-100 pb-2">📅 Schedule Appointment</h3>
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
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                    {submitting ? 'Processing Payment...' : 'Pay & Confirm Booking'}
                </button>
            </form>

            {/* Reviews Section */}
            <div>
                <h3 className="text-xl font-bold mb-4">Client Reviews ({(reviews || []).length})</h3>
                {(!reviews || reviews.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-muted">
                        No reviews yet. Be the first to book and rate!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(reviews || []).map(review => (
                            <div key={review.id} className="card bg-white p-5 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold text-secondary">{review.userName || 'Anonymous'}</div>
                                    <div className="text-amber-500 text-sm font-bold">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm">{review.comment}</p>
                                <div className="text-xs text-muted mt-3">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
