import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { subscribeToBookings, updateBookingStatus, addReview, getUserProfile, updateUserProfile, getServicesByProvider, promoteService } from '../services/dataService';
import { Link } from 'react-router-dom';
import ChatModal from '../components/ChatModal';

export default function Dashboard() {
    const { currentUser, userRole } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatBooking, setChatBooking] = useState(null);
    const [notification, setNotification] = useState(null);
    const bookingsRef = useRef([]);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        let unsubscribe;

        async function initDashboard() {
            if (currentUser) {
                // Subscribe to real-time bookings
                unsubscribe = subscribeToBookings(currentUser.uid, userRole, (newBookings) => {
                    setBookings(newBookings);

                    // Notification Logic
                    if (!isFirstLoad.current && newBookings.length > bookingsRef.current.length) {
                        // Determine if it's a new booking (basic check by length)
                        // Ideally we check for new IDs, but length increase is sufficient for "New Booking" alert
                        if (userRole === 'provider') {
                            setNotification("🔔 New Booking Received!");
                            setTimeout(() => setNotification(null), 5000); // Hide after 5s
                        }
                    }

                    bookingsRef.current = newBookings;
                    isFirstLoad.current = false;
                    setLoading(false);
                });

                if (userRole === 'provider') {
                    getServicesByProvider(currentUser.uid).then(srvs => setProviderServices(srvs));
                }
            }
        }
        initDashboard();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser, userRole]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await updateBookingStatus(bookingId, newStatus);
            // Optimistic update
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            ));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', bookingId: null, serviceId: null });

    const openReviewModal = (booking) => {
        setReviewForm({
            rating: 5,
            comment: '',
            bookingId: booking.id,
            serviceId: booking.serviceId || booking.providerId // Fallback if needed, but dataService should save serviceId
        });
        setReviewModalOpen(true);
    };

    // Profile State
    const [profile, setProfile] = useState({ displayName: '', bio: '' });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    useEffect(() => {
        if (currentUser && userRole === 'provider') {
            getUserProfile(currentUser.uid).then(data => {
                if (data) setProfile({ displayName: data.displayName || '', bio: data.bio || '' });
            });
        }
    }, [currentUser, userRole]);

    const [providerServices, setProviderServices] = useState([]);
    const [boostModalOpen, setBoostModalOpen] = useState(false);
    const [serviceToBoost, setServiceToBoost] = useState(null);

    const handleBoostClick = (service) => {
        setServiceToBoost(service);
        setBoostModalOpen(true);
    };

    // Load Razorpay SDK Helper
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleConfirmBoost = async () => {
        if (!serviceToBoost) return;
        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load.');
                return;
            }

            const options = {
                key: "rzp_test_RQzTCSQezDt3qq",
                amount: 9900, // ₹99.00
                currency: "INR",
                name: "Local Services App",
                description: `Boost: ${serviceToBoost.title}`,
                image: "https://via.placeholder.com/150",
                handler: async function (response) {
                    try {
                        await promoteService(serviceToBoost.id);
                        alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}. "${serviceToBoost.title}" is now FEATURED ⚡`);
                        setBoostModalOpen(false);

                        // Update local state
                        setProviderServices(providerServices.map(s =>
                            s.id === serviceToBoost.id ? { ...s, isPromoted: true } : s
                        ));
                    } catch (error) {
                        console.error(error);
                        alert('Payment successful but failed to update service.');
                    }
                },
                prefill: {
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    email: currentUser.email
                },
                theme: {
                    color: "#f59e0b" // Amber for boost
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error(error);
            alert('Payment initiation failed');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateUserProfile(currentUser.uid, profile);
            alert('Profile updated!');
            setIsEditingProfile(false);
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await addReview({
                ...reviewForm,
                userId: currentUser.uid,
                userName: currentUser.email
            });
            alert('Review submitted successfully!');
            setReviewModalOpen(false);
            // Optionally mark local booking as reviewed to hide button
        } catch (error) {
            console.error(error);
            alert('Failed to submit review');
        }
    };

    if (!currentUser) return <p>Please login.</p>;

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-24 right-4 z-50 animate-bounce-in">
                    <div className="bg-white border-l-4 border-indigo-500 shadow-xl rounded-lg p-4 flex items-center gap-3 pr-8">
                        <span className="text-2xl">🔔</span>
                        <div>
                            <h4 className="font-bold text-gray-800">New Update</h4>
                            <p className="text-indigo-600 font-medium">{notification}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-bold mb-4">Rate this Service</h3>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Rating</label>
                                <div className="flex gap-2 text-2xl">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            className={`transition-transform hover:scale-110 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Comment</label>
                                <textarea
                                    className="input h-24"
                                    required
                                    placeholder="How was your experience?"
                                    value={reviewForm.comment}
                                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setReviewModalOpen(false)} className="btn btn-outline flex-1">Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Submit Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {chatBooking && (
                <ChatModal
                    booking={chatBooking}
                    currentUser={currentUser}
                    onClose={() => setChatBooking(null)}
                />
            )}

            <div className="flex-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Dashboard</h1>
                    <p className="text-muted">Welcome back, {currentUser.email}</p>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-light text-primary rounded-full mt-2 capitalize">
                        {userRole} Account
                    </span>
                </div>
                {userRole === 'provider' && (
                    <div className="flex gap-2">
                        <Link to="/create-service" className="btn btn-primary shadow-lg hover:shadow-xl">
                            + List New Service
                        </Link>
                    </div>
                )}
            </div>

            {/* Provider Boost Section */}
            {userRole === 'provider' && (
                <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-900">
                        <span>🚀</span> Promote Your Services
                    </h2>
                    {providerServices.length === 0 ? (
                        <p className="text-muted text-sm">Create a service first to promote it.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {providerServices.map(service => (
                                <div key={service.id} className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-700">{service.title}</div>
                                        {service.isPromoted ? (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit mt-1">
                                                ⚡ FEATURED
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted">Standard Listing</span>
                                        )}
                                    </div>
                                    {!service.isPromoted && (
                                        <button
                                            onClick={() => handleBoostClick(service)}
                                            className="btn btn-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            ⚡ Boost
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Boost Modal */}
            {boostModalOpen && serviceToBoost && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                            ⚡
                        </div>
                        <h3 className="text-xl font-bold mb-2">Boost "{serviceToBoost.title}"</h3>
                        <p className="text-muted mb-6">
                            Get 3x more views by pinning your service to the top of search results.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Duration</span>
                                <span className="font-semibold">7 Days</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                                <span className="text-sm text-slate-600">Total</span>
                                <span className="text-xl font-bold text-primary">₹99.00</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmBoost}
                                className="btn btn-primary w-full py-3 text-lg shadow-lg hover:shadow-amber-500/20"
                            >
                                Pay ₹99 & Boost
                            </button>
                            <button
                                onClick={() => setBoostModalOpen(false)}
                                className="btn btn-ghost w-full"
                            >
                                No thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Provider Boost Section */}
            {userRole === 'provider' && (
                <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-900">
                        <span>🚀</span> Promote Your Services
                    </h2>
                    {providerServices.length === 0 ? (
                        <p className="text-muted text-sm">Create a service first to promote it.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {providerServices.map(service => (
                                <div key={service.id} className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-700">{service.title}</div>
                                        {service.isPromoted ? (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit mt-1">
                                                ⚡ FEATURED
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted">Standard Listing</span>
                                        )}
                                    </div>
                                    {!service.isPromoted && (
                                        <button
                                            onClick={() => handleBoostClick(service)}
                                            className="btn btn-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white border-none shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            ⚡ Boost
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Boost Modal */}
            {boostModalOpen && serviceToBoost && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                            ⚡
                        </div>
                        <h3 className="text-xl font-bold mb-2">Boost "{serviceToBoost.title}"</h3>
                        <p className="text-muted mb-6">
                            Get 3x more views by pinning your service to the top of search results.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-600">Duration</span>
                                <span className="font-semibold">7 Days</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                                <span className="text-sm text-slate-600">Total</span>
                                <span className="text-xl font-bold text-primary">₹99.00</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleConfirmBoost}
                                className="btn btn-primary w-full py-3 text-lg shadow-lg hover:shadow-amber-500/20"
                            >
                                Pay ₹99 & Boost
                            </button>
                            <button
                                onClick={() => setBoostModalOpen(false)}
                                className="btn btn-ghost w-full"
                            >
                                No thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Provider Profile Section */}
            {userRole === 'provider' && (
                <div className="card bg-white border border-slate-100 p-6 relative group">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span>👤</span> Your Public Profile
                        </h2>
                        {!isEditingProfile && (
                            <button
                                onClick={() => setIsEditingProfile(true)}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {isEditingProfile ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium mb-1">Display Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. John's Plumbing"
                                    value={profile.displayName}
                                    onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Bio</label>
                                <textarea
                                    className="input h-24"
                                    placeholder="Tell customers about your experience..."
                                    value={profile.bio}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-sm btn-ghost">Cancel</button>
                                <button type="submit" className="btn btn-sm btn-primary">Save Profile</button>
                            </div>
                        </form>
                    ) : (
                        <div className="prose prose-sm">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-xl">
                                    {profile.displayName ? profile.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold m-0">{profile.displayName || 'No Display Name Set'}</h3>
                                    <Link to={`/profile/${currentUser.uid}`} className="text-xs text-primary hover:underline">View Public Page ↗</Link>
                                </div>
                            </div>
                            <p className="text-muted">{profile.bio || 'No bio added yet. Add a bio to build trust with customers.'}</p>
                        </div>
                    )}
                </div>
            )}


            <div className="card glass">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <span>📅</span> Your Bookings
                </h2>
                {loading ? (
                    <div className="text-center py-12 text-muted">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-muted mb-4">No bookings found.</p>
                        <Link to="/services" className="text-primary font-medium hover:underline">Browse Services</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-6 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-6 md:px-0">
                            <table className="min-w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-muted text-xs md:text-sm uppercase tracking-wider">
                                        <th className="px-4 py-4 text-left">Service</th>
                                        <th className="px-4 py-4 hidden md:table-cell text-left">Date</th>
                                        <th className="px-4 py-4 text-left">Status</th>
                                        <th className="px-4 py-4 text-left">Price</th>
                                        <th className="px-4 py-4 hidden md:table-cell text-left">Details</th>
                                        <th className="px-4 py-4 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bookings.map(b => (
                                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-secondary">{b.serviceTitle}</div>
                                                <div className="md:hidden text-xs text-muted mt-1">{new Date(b.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted hidden md:table-cell">{new Date(b.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${b.status === 'confirmed' || b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    b.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-secondary">₹{b.price}</td>
                                            <td className="px-4 py-4 text-sm text-muted max-w-xs truncate hidden md:table-cell">{b.notes}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {['pending', 'confirmed'].includes(b.status) && (
                                                        <button
                                                            onClick={() => {
                                                                setChatBooking(b);
                                                            }}
                                                            className="btn btn-sm btn-ghost border border-slate-200 text-slate-600 hover:text-primary hover:border-primary"
                                                            title="Chat"
                                                        >
                                                            💬
                                                        </button>
                                                    )}

                                                    {userRole === 'provider' && (
                                                        <>
                                                            {b.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                                                                        className="btn btn-primary text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 border-none"
                                                                        title="Accept"
                                                                    >
                                                                        Pass
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(b.id, 'cancelled')}
                                                                        className="btn btn-outline text-xs px-3 py-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                                        title="Reject"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {b.status === 'confirmed' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(b.id, 'completed')}
                                                                    className="btn btn-outline text-xs px-3 py-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                                                                >
                                                                    Mark Complete
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {userRole !== 'provider' && b.status === 'completed' && (
                                                        <button
                                                            onClick={() => openReviewModal(b)}
                                                            className="btn btn-sm btn-primary text-xs"
                                                        >
                                                            ★ Rate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
