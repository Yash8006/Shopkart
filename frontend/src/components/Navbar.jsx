import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogOut, Package, Heart, ShoppingCart, ClipboardList } from 'lucide-react';
import { customerService } from '../services/api';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity } = useCart();

  const handleLogout = async () => {
    try {
      await customerService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (setUser) setUser(null);
      navigate('/login');
    }
  };

  const links = [
    { to: '/products', label: 'Shop', icon: Package, active: location.pathname.startsWith('/products') },
    { to: '/wishlist', label: 'Saved', icon: Heart, active: location.pathname === '/wishlist' },
    { to: '/orders', label: 'Orders', icon: ClipboardList, active: location.pathname.startsWith('/orders') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ink text-cream border-b-2 border-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          <Link to="/home" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-md bg-sun text-ink border-2 border-cream flex items-center justify-center rotate-[-6deg] group-hover:rotate-0 transition-transform duration-200">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Shop<span className="text-sun">Kart</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {links.map(({ to, label, icon: Icon, active }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-display font-bold border-2 transition-colors ${
                      active
                        ? 'bg-cream text-ink border-cream'
                        : 'border-transparent text-cream/80 hover:text-cream hover:border-cream/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                ))}

                <Link
                  to="/cart"
                  className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-display font-bold border-2 border-ink transition-transform hover:-translate-y-0.5 ${
                    location.pathname === '/cart' ? 'bg-cream text-ink' : 'bg-sun text-ink'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Bag</span>
                  {totalQuantity > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-tomato text-white text-[10px] font-bold border-2 border-ink flex items-center justify-center leading-none">
                      {totalQuantity > 9 ? '9+' : totalQuantity}
                    </span>
                  )}
                </Link>

                <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-cream/20">
                  <div className="w-8 h-8 rounded-full bg-lilac text-ink border-2 border-cream flex items-center justify-center font-display font-bold text-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-cream/80 max-w-[8rem] truncate">{user.fullName}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="sm:ml-1 p-1.5 sm:p-2 rounded-md text-cream/70 hover:text-ink hover:bg-tomato border-2 border-transparent hover:border-ink transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-1.5 rounded-md text-sm font-display font-bold border-2 transition-colors ${
                    location.pathname === '/login'
                      ? 'bg-cream text-ink border-cream'
                      : 'border-cream/40 text-cream hover:border-cream'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-md text-sm font-display font-bold bg-sun text-ink border-2 border-sun hover:bg-cream hover:border-cream transition-colors"
                >
                  Join free
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
