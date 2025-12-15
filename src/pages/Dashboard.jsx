import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getBookings, updateBookingStatus, addReview, getUserProfile, updateUserProfile } from '../services/dataService';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { currentUser, userRole } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBookings() {
            if (currentUser) {
                const data = await getBookings(currentUser.uid, userRole);
                setBookings(data);
                setLoading(false);
            }
        }
        fetchBookings();
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
                                                {userRole === 'provider' && (
                                                    <>
                                                        {b.status === 'pending' && (
                                                            <div className="flex gap-2">
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
                                                            </div>
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
