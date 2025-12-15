import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer'); // 'customer' or 'provider'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerUser(email, password, role);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to register: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 glass rounded-2xl animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Create Account
            </h2>
            <form onSubmit={handleRegister} className="space-y-5">
                {error && <div className="bg-red-50 text-error p-3 rounded-lg text-sm border border-red-100">{error}</div>}

                <div>
                    <label className="label">I want to...</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className={`btn ${role === 'customer' ? 'btn-primary' : 'btn-outline'} w-full justify-center`}
                            onClick={() => setRole('customer')}
                        >
                            Hire
                        </button>
                        <button
                            type="button"
                            className={`btn ${role === 'provider' ? 'btn-primary' : 'btn-outline'} w-full justify-center`}
                            onClick={() => setRole('provider')}
                        >
                            Work
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Email Address</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="label">Password</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Get Started'}
                </button>
            </form>
            <p className="text-center mt-6 text-sm text-muted">
                Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
            </p>
        </div>
    );
}
