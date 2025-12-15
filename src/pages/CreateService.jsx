import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addService } from '../services/dataService';
import { useAuth } from '../lib/AuthContext';

export default function CreateService() {
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Electrician',
        price: '',
        description: '',
        location: ''
    });

    if (!currentUser) return <p className="p-4">Please login to continue.</p>;
    // Ideally check for provider role here too

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addService({
                ...formData,
                providerId: currentUser.uid,
                providerName: currentUser.email // Simplified for now
            });
            navigate('/services');
        } catch (error) {
            console.error("Failed to create service:", error);
            alert('Error creating service: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">List a New Service</h1>
            <p className="text-muted mb-8">Share your expertise with the community.</p>

            <form onSubmit={handleSubmit} className="space-y-6 card glass p-8">
                <div className="input-group">
                    <label className="label">Service Title</label>
                    <input
                        className="input"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Professional House Wiring"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="input-group">
                        <label className="label">Category</label>
                        <select
                            className="input appearance-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {['Electrician', 'Plumber', 'Cleaning', 'Tutor', 'Painter', 'Mechanic'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="label">Price (₹)</label>
                        <input
                            type="number"
                            className="input"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Location / Service Area</label>
                    <input
                        className="input"
                        required
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., New York, NY"
                    />
                </div>

                <div className="input-group">
                    <label className="label">Description</label>
                    <textarea
                        className="input h-32 resize-none"
                        required
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what you offer..."
                    ></textarea>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                    {loading ? 'Publishing...' : 'Publish Service 🚀'}
                </button>
            </form>
        </div>
    );
}
