import { useEffect, useState } from 'react';
import { getServices } from '../services/dataService';
import ServiceCard from '../components/ServiceCard';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function Services() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'All';

    // Initialize state from URL param, fallback to 'All'
    // We'll trust the URL as the source of truth for initial load
    const [category, setCategory] = useState(initialCategory);
    const [locationSearch, setLocationSearch] = useState('');

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Sync state if URL changes (e.g. back button)
    useEffect(() => {
        const cat = searchParams.get('category') || 'All';
        if (cat !== category) {
            setCategory(cat);
        }
    }, [searchParams]);

    // Update URL when category changes via dropdown
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        if (newCategory === 'All') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', newCategory);
        }
        setSearchParams(searchParams);
    };

    useEffect(() => {
        loadServices();
    }, [category]);

    async function loadServices() {
        setLoading(true);
        try {
            const data = await getServices(category);
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredServices = services.filter(service => {
        if (!locationSearch) return true;
        return service.location?.toLowerCase().includes(locationSearch.toLowerCase());
    });

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">Find Local Services</h1>
                    <p className="text-base md:text-lg text-muted">Connect with trusted professionals in your neighborhood.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto bg-white p-1.5 rounded-full shadow-lg border border-slate-200">
                    <div className="pl-4 text-slate-400">📍</div>
                    <input
                        type="text"
                        placeholder="Filter by city..."
                        className="outline-none text-sm bg-transparent w-full md:w-40 py-2"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                    />
                    <div className="h-6 w-px bg-slate-200"></div>
                    <select
                        className="flex-1 md:flex-none bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer px-3 py-2 outline-none w-full md:w-auto"
                        value={category}
                        onChange={handleCategoryChange}
                    >
                        <option value="All">All Categories</option>
                        {['Electrician', 'Plumber', 'Cleaning', 'Tutor', 'Painter', 'Mechanic'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                    <Link to="/create-service" className="btn btn-primary btn-sm rounded-full text-xs px-4 py-2 whitespace-nowrap">
                        + Post
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <p className="mt-4 text-muted">Finding pros near you...</p>
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-secondary mb-2">No services found</h3>
                    <p className="text-muted mb-6">
                        {locationSearch
                            ? `No ${category === 'All' ? '' : category} services found in "${locationSearch}".`
                            : `We couldn't find any ${category} services at the moment.`}
                    </p>
                    <Link to="/create-service" className="btn btn-outline">
                        Be the first to list a service!
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(s => (
                        <ServiceCard
                            key={s.id}
                            service={s}
                            onBook={() => navigate(`/book/${s.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
