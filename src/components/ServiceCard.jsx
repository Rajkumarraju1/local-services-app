import React from 'react';

export default function ServiceCard({ service, onBook }) {
    return (
        <div className="card glass hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
            <div className="mb-4 flex justify-between items-start">
                <span className="bg-primary-light text-primary text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                    {service.category}
                </span>
                <span className="text-2xl group-hover:scale-110 transition-transform">
                    {service.category === 'Electrician' ? '⚡' :
                        service.category === 'Plumber' ? '🔧' :
                            service.category === 'Cleaning' ? '🧹' :
                                service.category === 'Tutor' ? '📚' : '🛠️'}
                </span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-secondary group-hover:text-primary transition-colors">{service.title}</h3>
            <p className="text-muted text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">{service.description}</p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <div className="flex flex-col">
                    <span className="text-xs text-muted uppercase font-semibold">Price starts at</span>
                    <span className="font-extrabold text-xl text-secondary">₹{service.price}</span>
                </div>
                <button
                    onClick={() => onBook(service)}
                    className="btn btn-primary text-sm shadow-md hover:shadow-lg px-6"
                >
                    Book
                </button>
            </div>
        </div>
    );
}
