import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, Eye, IndianRupee, Tag, AlertCircle, PackageOpen } from 'lucide-react';
import { wishlistService } from '../services/api';

// Individual card for items displayed on the Wishlist page
const WishlistCard = ({ product, onRemove, removing }) => {
  const isInStock = product.stock > 0;
  return (
    <div className="box overflow-hidden flex">
      <div className="relative w-32 sm:w-40 shrink-0 bg-sun-soft border-r-2 border-ink">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap gap-1.5">
          <span className="tag bg-lilac-soft"><Tag className="w-3 h-3" />{product.category}</span>
          <span className={`tag ${isInStock ? 'bg-mint-soft' : 'bg-tomato-soft'}`}>
            {isInStock ? `${product.stock} in stock` : 'Sold out'}
          </span>
        </div>
        <h3 className="font-display font-bold leading-snug line-clamp-2">{product.name}</h3>
        <p className="flex items-center font-display font-bold text-lg">
          <IndianRupee className="w-4 h-4" />
          {product.price.toLocaleString('en-IN')}
        </p>

        <div className="flex gap-2 mt-auto">
          <Link to={`/products/${product._id}`} className="btn-ink flex-1 px-3 py-2">
            <Eye className="w-4 h-4" /> View
          </Link>
          <button onClick={() => onRemove(product._id)} disabled={removing} className="btn-paper px-3 py-2" title="Remove">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{removing ? 'Removing…' : 'Remove'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Wishlist Page ──────────────────────────────────────────────────────────────
const Wishlist = ({ user }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await wishlistService.getAll();
      setWishlist(data.wishlist || []);
    } catch {
      setError("We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await wishlistService.remove(productId);
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
    } catch {
      alert('Failed to remove product. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Loading saved items…</p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-tomato" />
          <p className="font-display text-lg font-bold">Something went wrong</p>
          <p className="text-sm text-ink/60 mt-1 mb-5">{error}</p>
          <button onClick={fetchWishlist} className="btn-ink">Retry</button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-tomato-soft border-2 border-ink mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <p className="font-display text-xl font-bold">Nothing saved yet</p>
          <p className="text-sm text-ink/60 mt-1.5 mb-5">Tap the heart on any product to keep it here for later.</p>
          <Link to="/products" className="btn-sun">Explore products</Link>
        </div>
      </div>
    );
  }

  // ── Wishlist Cards ──
  return (
    <div className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="eyebrow bg-tomato-soft">Wishlist</span>
          <h1 className="page-title mt-3">Saved for later</h1>
          <p className="text-sm text-ink/60 mt-1">
            {wishlist.length} product{wishlist.length !== 1 ? 's' : ''} you&apos;ve hearted
          </p>
        </div>
        <Link to="/products" className="btn-paper self-start sm:self-auto">
          <PackageOpen className="w-4 h-4" /> Keep browsing
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {wishlist.map((product) => (
          <WishlistCard
            key={product._id}
            product={product}
            onRemove={handleRemove}
            removing={removingId === product._id}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
