import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
      <div className="card w-full max-w-sm bg-base-100 border border-base-300 shadow-md">
        <div className="card-body p-6 sm:p-8">
          <div className="text-center space-y-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content mx-auto flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-base-content">Alistair</h2>
            <p className="text-sm text-base-content/60">Create your account</p>
          </div>

          {error && (
            <div className="alert alert-error text-xs py-2 px-3 mb-2 flex items-center gap-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-base-content/70">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alistair Reader"
                  className="input input-bordered input-sm w-full pl-9 text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-base-content/70">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input input-bordered input-sm w-full pl-9 text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-base-content/70">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input input-bordered input-sm w-full pl-9 text-sm focus:outline-none focus:border-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm w-full mt-2 font-medium"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          <div className="text-center mt-4 text-xs text-base-content/60">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
