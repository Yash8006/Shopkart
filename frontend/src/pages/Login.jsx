import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { customerService } from '../services/api';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await customerService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        // Fetch current user details to update app state
        try {
          const profile = await customerService.getMe();
          if (setUser) setUser(profile);
        } catch (profileErr) {
          console.warn('Profile fetch after login warning:', profileErr);
        }
        // Navigate to protected home page
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid Credentials');
      } else {
        setError(err.response?.data?.message || 'Invalid Credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl grid md:grid-cols-2 box overflow-hidden">
        <aside className="hidden md:flex flex-col justify-between bg-tomato text-ink p-8 border-r-2 border-ink">
          <span className="eyebrow self-start">Members area</span>
          <div>
            <h2 className="font-display text-4xl font-bold leading-[1.05]">
              Good to see<br />you again.
            </h2>
            <p className="mt-3 text-sm font-medium text-ink/80 max-w-xs">
              Your bag, saved items and order history are waiting right where you left them.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="w-4 h-4 rounded-full bg-ink" />
            <span className="w-4 h-4 rounded-full bg-sun border-2 border-ink" />
            <span className="w-4 h-4 rounded-full bg-paper border-2 border-ink" />
          </div>
        </aside>

        <section className="p-6 sm:p-10 bg-paper">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-md bg-sun border-2 border-ink flex items-center justify-center shadow-brut-sm">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Sign in</h1>
              <p className="text-sm text-ink/60">Continue to your ShopKart account</p>
            </div>
          </div>

          {successMessage && (
            <div className="alert-good mb-5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="alert-bad mb-5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  required
                  className="field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-ink w-full py-3">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
                  <span>Checking…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-sm text-ink/70">
            New to ShopKart?{' '}
            <Link to="/register" className="font-bold text-ink underline decoration-tomato decoration-2 underline-offset-4 hover:bg-sun-soft">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
