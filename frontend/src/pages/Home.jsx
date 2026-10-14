import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  KeyRound,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { customerService } from '../services/api';
import { useCart } from '../context/CartContext';

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { totalQuantity } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password Change Modal / Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await customerService.getMe();
        if (isMounted) {
          setUser(profile);
          setError('');
        }
      } catch (err) {
        console.error('Failed to fetch profile (unauthenticated):', err);
        if (isMounted) {
          setUser(null);
          // If not logged in, automatically redirect to /login (Task 3 requirement)
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: '', error: '' });

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordStatus({ success: '', error: 'Please fill in both password fields' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ success: '', error: 'New password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await customerService.changePassword(passwordData);
      setPasswordStatus({ success: res.message || 'Password changed successfully!', error: '' });
      setPasswordData({ oldPassword: '', newPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ success: '', error: '' });
      }, 2000);
    } catch (err) {
      setPasswordStatus({
        success: '',
        error: err.response?.data?.message || 'Failed to update password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 p-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Fetching your profile…</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const shortcuts = [
    { to: '/products', label: 'Browse the shop', note: 'New arrivals & bestsellers', icon: ShoppingBag, color: 'bg-sun' },
    { to: '/cart', label: 'Open your bag', note: `${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} waiting`, icon: CreditCard, color: 'bg-mint' },
    { to: '/orders', label: 'Track orders', note: 'Payments & delivery status', icon: PackageCheck, color: 'bg-lilac' },
  ];

  const securityNotes = [
    { title: 'HttpOnly cookie session', body: 'Your login token lives in an HttpOnly cookie, so page scripts can never read it.' },
    { title: 'Bcrypt-hashed passwords', body: 'Passwords are salted and hashed before they are written to MongoDB.' },
    { title: 'Verified on every request', body: 'Protected routes like /customers/me check the JWT signature on the server first.' },
    { title: 'Password never returned', body: 'Profile responses always exclude the password hash field.' },
  ];

  return (
    <div className="page-wrap">
      {/* Hero */}
      <section className="box bg-sun p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-12 w-56 h-56 rounded-full bg-tomato border-2 border-ink hidden sm:block" />
        <div className="absolute right-24 top-6 w-14 h-14 rotate-12 bg-mint border-2 border-ink hidden sm:block" />
        <div className="relative max-w-xl">
          <span className="tag bg-paper mb-4">
            <Sparkles className="w-3 h-3" /> Signed in
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] mt-3">
            Hey {user.fullName?.split(' ')[0] || 'there'}, ready to shop?
          </h1>
          <p className="mt-3 text-base font-medium text-ink/75">
            This is your ShopKart dashboard. Manage your account, jump back into the catalogue or check on recent orders.
          </p>
          <button onClick={() => navigate('/products')} className="btn-ink mt-6">
            Start shopping <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile */}
        <section className="lg:col-span-4 box p-6 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-lilac border-2 border-ink shadow-brut-sm flex items-center justify-center font-display text-2xl font-bold">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold truncate">{user.fullName}</h2>
              <span className="tag bg-mint-soft mt-1">
                <ShieldCheck className="w-3 h-3" /> Active
              </span>
            </div>
          </div>

          <dl className="mt-6 divide-y-2 divide-dashed divide-ink/15 text-sm">
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone },
              { icon: KeyRound, label: 'Auth', value: 'JWT + HttpOnly cookie' },
              { icon: User, label: 'Customer ID', value: user._id, mono: true },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="py-3 flex items-center gap-3">
                <Icon className="w-4 h-4 text-ink/50 shrink-0" />
                <dt className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
                <dd className={`font-semibold truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <button onClick={() => setShowPasswordModal(true)} className="btn-paper w-full mt-auto">
            <KeyRound className="w-4 h-4" />
            Change password
          </button>
        </section>

        <div className="lg:col-span-8 space-y-6">
          {/* Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {shortcuts.map(({ to, label, note, icon: Icon, color }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`${color} text-left border-2 border-ink rounded-lg p-5 shadow-brut hover:-translate-y-1 hover:shadow-brut-lg transition-all cursor-pointer`}
              >
                <Icon className="w-7 h-7 mb-6" />
                <p className="font-display font-bold text-lg leading-tight">{label}</p>
                <p className="text-xs font-medium text-ink/70 mt-1">{note}</p>
              </button>
            ))}
          </div>

          {/* Security */}
          <section className="box p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-display text-lg font-bold">How your account is protected</h3>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityNotes.map((note, i) => (
                <li key={note.title} className="flex gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-md bg-ink text-cream font-display font-bold text-sm flex items-center justify-center">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{note.title}</p>
                    <p className="text-xs text-ink/60 leading-relaxed mt-0.5">{note.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="box max-w-md w-full overflow-hidden">
            <div className="bg-sun border-b-2 border-ink px-6 py-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-display text-lg font-bold">Update password</h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-ink/60 mb-4">
                Confirm your current password, then pick a new one with at least 6 characters.
              </p>

              {passwordStatus.error && (
                <div className="alert-bad mb-4 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordStatus.error}</span>
                </div>
              )}

              {passwordStatus.success && (
                <div className="alert-good mb-4 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordStatus.success}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="field-label">Current password</label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">New password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                    className="field"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-paper flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={passwordLoading} className="btn-ink flex-1">
                    {passwordLoading ? 'Saving…' : 'Save password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
