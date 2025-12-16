import { Link } from 'react-router-dom';
import catElectrician from '../assets/cat_electrician.png';
import catPlumber from '../assets/cat_plumber.png';
import catCleaning from '../assets/cat_cleaning.png';
import catTutor from '../assets/cat_tutor.png';
import catPainter from '../assets/cat_painter.png';
import catMechanic from '../assets/cat_mechanic.png';
import heroImg from '../assets/hero_illustration.png';

export default function Home() {
    const categories = [
        { name: 'Electrician', img: catElectrician },
        { name: 'Plumber', img: catPlumber },
        { name: 'Cleaning', img: catCleaning },
        { name: 'Tutor', img: catTutor },
        { name: 'Painter', img: catPainter },
        { name: 'Mechanic', img: catMechanic },
    ];

    return (
        <div className="space-y-12">
            <section className="hero md:text-left">
                <div className="container md:flex md:items-center md:justify-between">
                    <div className="md:w-1/2">
                        <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-primary bg-primary-light rounded-full">
                            Trusted by 10,000+ Neighbors
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                            Find Trusted Local Services <br className="hidden md:block" />
                            <span className="text-primary">Instantly</span>
                        </h1>
                        <p className="text-lg text-muted max-w-2xl mx-auto md:mx-0 mb-8">
                            From expert electricians to reliable tutors. Book verified professionals in your area with a single click.
                        </p>
                        <div className="flex justify-center md:justify-start gap-4">
                            <Link to="/services" className="btn btn-primary text-lg px-8">Find a Service</Link>
                            <Link to="/create-service" className="btn btn-outline text-lg px-8">List Your Service</Link>
                        </div>
                    </div>
                    <div className="hidden md:block md:w-1/2 pl-4">
                        <img
                            src={heroImg}
                            alt="Trustworthy Technician"
                            className="w-full max-w-lg mx-auto drop-shadow-xl hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat, index) => (
                    <Link
                        key={cat.name}
                        to={`/services?category=${cat.name}`}
                        className="card hover:border-primary cursor-pointer transition-colors group block h-full text-left overflow-hidden relative"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-12 h-12 shrink-0">
                                <img
                                    src={cat.img}
                                    alt={cat.name}
                                    className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl group-hover:text-primary mb-1">{cat.name}</h3>
                                <p className="text-sm text-muted">Expert {cat.name.toLowerCase()}s near you.</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
