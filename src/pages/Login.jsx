import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await loginUser(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to login. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 glass rounded-2xl animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Welcome Back
            </h2>
            <form onSubmit={handleLogin} className="space-y-6">
                {error && <div className="bg-red-50 text-error p-3 rounded-lg text-sm border border-red-100">{error}</div>}

                <div className="input-group">
                    <label className="label">Email Address</label>
                    <input
                        type="email"
                        className="input"
                        placeholder="you@example.com"
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
                    />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Sign In'}
                </button>
            </form>
            <p className="text-center mt-6 text-sm text-muted">
                Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create Account</Link>
            </p>
        </div>
    );
}
