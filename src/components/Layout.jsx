import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { logoutUser } from '../services/authService';

export default function Layout() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="min-h-screen flex flex-col bg-dots">
            <header className="glass sticky top-0 z-50">
                <div className="container h-[var(--nav-height)] flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-primary flex-center gap-2" onClick={closeMenu}>
                        <span className="text-2xl">✨</span> LocalServe
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-2xl text-secondary p-2"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-4 items-center">
                        <NavLinks currentUser={currentUser} onLogout={handleLogout} />
                    </nav>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg absolute w-full left-0 animate-fade-in shadow-lg">
                        <nav className="flex flex-col p-4 gap-4">
                            <NavLinks
                                currentUser={currentUser}
                                onLogout={() => { handleLogout(); closeMenu(); }}
                                onLinkClick={closeMenu}
                                mobile
                            />
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1 container py-6 md:py-8 animate-fade-in px-4 md:px-6">
                <Outlet />
            </main>
            <footer className="border-t py-8 mt-auto bg-surface">
                <div className="container text-center text-sm text-muted">
                    © 2024 LocalServe. Verified Professionals.
                </div>
            </footer>
        </div>
    );
}

function NavLinks({ currentUser, onLogout, onLinkClick, mobile }) {
    const baseClass = mobile ? "w-full text-left py-2" : "";

    if (currentUser) {
        return (
            <>
                <Link to="/services" className={`btn btn-ghost text-sm font-medium ${baseClass}`} onClick={onLinkClick}>
                    Find Services
                </Link>
                <Link to="/dashboard" className={`btn btn-ghost text-sm font-medium ${baseClass}`} onClick={onLinkClick}>
                    Dashboard
                </Link>
                <button
                    onClick={onLogout}
                    className={`btn btn-ghost text-sm font-medium text-red-500 hover:text-red-700 ${baseClass}`}
                >
                    Logout
                </button>
            </>
        );
    }

    return (
        <>
            <Link to="/login" className={`btn btn-ghost text-sm font-medium ${baseClass}`} onClick={onLinkClick}>
                Login
            </Link>
            <Link to="/register" className={`btn btn-primary text-sm ${baseClass}`} onClick={onLinkClick}>
                Get Started
            </Link>
        </>
    );
}
