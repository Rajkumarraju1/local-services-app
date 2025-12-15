import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="space-y-12">
            <section className="hero">
                <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary bg-primary-light rounded-full">
                    Trusted by 10,000+ Neighbors
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                    Find Trusted Local Services <br className="hidden md:block" />
                    <span className="text-primary">Instantly</span>
                </h1>
                <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
                    From expert electricians to reliable tutors. Book verified professionals in your area with a single click.
                </p>
                <div className="flex justify-center gap-4">
                    <Link to="/services" className="btn btn-primary text-lg px-8">Find a Service</Link>
                    <Link to="/create-service" className="btn btn-outline text-lg px-8">List Your Service</Link>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Electrician', 'Plumber', 'Cleaning', 'Tutor', 'Painter', 'Mechanic'].map((service, index) => (
                    <div
                        key={service}
                        className="card hover:border-primary cursor-pointer transition-colors group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="w-12 h-12 bg-primary-light rounded-full flex-center mb-4 text-2xl">
                            {['⚡', '🔧', '🧹', '📚', '🎨', '🚗'][index]}
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-primary mb-2">{service}</h3>
                        <p className="text-sm text-muted">Book expert {service.toLowerCase()}s near you with guaranteed satisfaction.</p>
                    </div>
                ))}
            </section>
        </div>
    );
}
