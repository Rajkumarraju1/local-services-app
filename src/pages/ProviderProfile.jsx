import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, getServicesByProvider } from '../services/dataService';
import ServiceCard from '../components/ServiceCard';

export default function ProviderProfile() {
    const { id } = useParams();
    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, srvs] = await Promise.all([
                    getUserProfile(id),
                    getServicesByProvider(id)
                ]);
                setProvider(user);
                setServices(srvs);
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) return <div className="text-center py-12">Loading Profile...</div>;
    if (!provider) return <div className="text-center py-12">Provider not found</div>;

    // Calculate aggregate stats
    const totalReviews = services.reduce((acc, s) => acc + (s.reviewCount || 0), 0);
    const totalRatingSum = services.reduce((acc, s) => acc + ((s.averageRating || 0) * (s.reviewCount || 0)), 0);
    const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : 0;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header / Bio Section */}
            <div className="card bg-white border border-slate-100 p-8 shadow-sm text-center md:text-left md:flex items-start gap-8">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-4xl mx-auto md:mx-0 shrink-0">
                    {provider.displayName ? provider.displayName[0].toUpperCase() : 'P'}
                </div>
                <div className="flex-1 mt-4 md:mt-0">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
                        {provider.displayName || 'Service Provider'}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-600 mb-4">
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                            ★ {averageRating} ({totalReviews} Reviews)
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-3 py-1 rounded-full">
                            📋 {services.length} Services
                        </span>
                    </div>
                    <p className="text-muted leading-relaxed max-w-2xl mx-auto md:mx-0">
                        {provider.bio || "This provider hasn't added a bio yet."}
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <span>🛠️</span> Services Offered
                </h2>
                {services.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-muted">
                        No active listings.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map(service => (
                            <Link key={service.id} to={`/book/${service.id}`} className="block h-full">
                                <ServiceCard service={service} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
