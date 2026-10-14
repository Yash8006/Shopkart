import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  IndianRupee,
  AlertCircle,
  PackageOpen,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// Individual row for each cart item
const CartItem = ({ item, onUpdateQty, onRemove }) => {
  const { product, quantity } = item;
  const [loading, setLoading] = React.useState(false);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1) return; // can't go below 1 — use Remove button instead
    if (newQty > product.stock) return; // respect stock limit
    setLoading(true);
    await onUpdateQty(product._id, newQty);
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    await onRemove(product._id);
    setLoading(false);
  };

  const lineTotal = product.price * quantity;

  return (
    <div className={`flex items-center gap-4 py-4 transition-opacity ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-md overflow-hidden bg-sun-soft border-2 border-ink">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/96?text=N/A';
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{product.category}</p>
        <h3 className="font-display font-bold leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-xs text-ink/60 mt-0.5 flex items-center">
          <IndianRupee className="w-3 h-3" />{product.price.toLocaleString('en-IN')} / unit
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <div className="inline-flex items-center rounded-md border-2 border-ink bg-paper overflow-hidden">
            <button
              onClick={() => handleQtyChange(quantity - 1)}
              disabled={quantity <= 1 || loading}
              className="px-2 py-1 hover:bg-sun-soft transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 font-display font-bold text-sm border-x-2 border-ink min-w-[2.5rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQtyChange(quantity + 1)}
              disabled={quantity >= product.stock || loading}
              className="px-2 py-1 hover:bg-sun-soft transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="p-1.5 rounded-md border-2 border-transparent hover:border-ink hover:bg-tomato hover:text-white transition disabled:opacity-50 cursor-pointer"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-display font-bold text-lg flex items-center justify-end">
          <IndianRupee className="w-4 h-4" />
          {lineTotal.toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
};

// ── Cart Page ──────────────────────────────────────────────────────────────────
const Cart = ({ user }) => {
  const navigate = useNavigate();
  const { cartItems, loading, error, fetchCart, updateQuantity, removeFromCart, subtotal, totalQuantity } = useCart();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Load cart from backend when page mounts
  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Opening your bag…</p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-tomato" />
          <p className="font-display text-lg font-bold">Couldn&apos;t load your bag</p>
          <p className="text-sm text-ink/60 mt-1 mb-5">{error}</p>
          <button onClick={fetchCart} className="btn-ink">Retry</button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-mint-soft border-2 border-ink mx-auto mb-4 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <p className="font-display text-xl font-bold">Your bag is empty</p>
          <p className="text-sm text-ink/60 mt-1.5 mb-5">Add something you like and it will show up here.</p>
          <Link to="/products" className="btn-sun">Go shopping</Link>
        </div>
      </div>
    );
  }

  // ── Cart with Items ──
  return (
    <div className="page-wrap">
      <div className="mb-8">
        <span className="eyebrow bg-mint">Shopping bag</span>
        <h1 className="page-title mt-3">Your bag</h1>
        <p className="text-sm text-ink/60 mt-1">
          {cartItems.length} product{cartItems.length !== 1 ? 's' : ''} &middot; {totalQuantity} unit{totalQuantity !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 box px-5 divide-y-2 divide-dashed divide-ink/15">
          {cartItems.map((item) => (
            <CartItem
              key={item.product._id}
              item={item}
              onUpdateQty={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
          <div className="py-4">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold underline decoration-sun decoration-[3px] underline-offset-4">
              <PackageOpen className="w-4 h-4" /> Add more items
            </Link>
          </div>
        </section>

        <aside className="lg:col-span-1 sticky top-24">
          <div className="box overflow-hidden">
            <div className="bg-ink text-cream px-5 py-3 font-display font-bold uppercase tracking-wide text-sm">
              Bill summary
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              {cartItems.map((item) => (
                <div key={item.product._id} className="flex justify-between gap-3">
                  <span className="truncate text-ink/70">
                    {item.product.name} <span className="text-ink/40">×{item.quantity}</span>
                  </span>
                  <span className="font-semibold shrink-0 flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    {(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-ink/70">
                <span>Delivery</span>
                <span className="font-bold text-mint-dark">FREE</span>
              </div>
              <div className="pt-3 mt-1 border-t-2 border-ink flex justify-between items-center">
                <span className="font-display font-bold">To pay</span>
                <span className="font-display text-2xl font-bold flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <button className="btn-tomato w-full py-3 mt-3" onClick={() => navigate('/checkout')}>
                Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
