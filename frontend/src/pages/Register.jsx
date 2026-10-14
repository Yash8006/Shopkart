import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { customerService } from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors on edit
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await customerService.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });

      if (response.success) {
        // Redirect to Login page with success state
        navigate('/login', {
          state: {
            successMessage: 'Account created successfully! Please log in with your credentials.',
            email: formData.email.trim(),
          },
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const serverMessage = err.response?.data?.message;
      if (err.response?.status === 409) {
        setError('Email already exists. Please log in or use a different email.');
      } else if (err.response?.status === 400) {
        setError(serverMessage || 'Validation failed. Please check all fields.');
      } else {
        setError(serverMessage || 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', icon: User, placeholder: 'Riya Mehta' },
    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
    { name: 'phone', label: 'Mobile number', type: 'tel', icon: Phone, placeholder: '98765 43210' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl grid md:grid-cols-5 box overflow-hidden">
        <section className="md:col-span-3 p-6 sm:p-10 bg-paper order-2 md:order-1">
          <span className="eyebrow mb-3">Step 1 &middot; Sign up</span>
          <h1 className="font-display text-3xl font-bold mt-2">Make your account</h1>
          <p className="text-sm text-ink/60 mt-1 mb-7">It takes less than a minute. No spam, promise.</p>

          {error && (
            <div className="alert-bad mb-5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
              <div key={name} className={name === 'fullName' ? 'sm:col-span-2' : ''}>
                <label className="field-label">{label}</label>
                <div className="relative">
                  <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`field pl-10 ${fieldErrors[name] ? 'field-bad' : ''}`}
                  />
                </div>
                {fieldErrors[name] && <p className="field-msg">{fieldErrors[name]}</p>}
              </div>
            ))}

            <div className="sm:col-span-2">
              <label className="field-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className={`field pl-10 pr-11 ${fieldErrors.password ? 'field-bad' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="field-msg">{fieldErrors.password}</p>}
            </div>

            <div className="sm:col-span-2 pt-1">
              <button type="submit" disabled={loading} className="btn-tomato w-full py-3">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Setting things up…</span>
                  </>
                ) : (
                  <>
                    <span>Create my account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-7 text-sm text-ink/70">
            Already a member?{' '}
            <Link to="/login" className="font-bold text-ink underline decoration-tomato decoration-2 underline-offset-4 hover:bg-sun-soft">
              Sign in instead
            </Link>
          </p>
        </section>

        <aside className="md:col-span-2 bg-mint p-8 border-b-2 md:border-b-0 md:border-l-2 border-ink flex flex-col justify-center gap-5 order-1 md:order-2">
          <h2 className="font-display text-3xl font-bold leading-tight">Why join<br />ShopKart?</h2>
          <ul className="space-y-3 text-sm font-medium">
            {['Save favourites to your wishlist', 'One bag synced across devices', 'Quick checkout with Razorpay', 'Track every order you place'].map((perk) => (
              <li key={perk} className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-paper border-2 border-ink flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default Register;
