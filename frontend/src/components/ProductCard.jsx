import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, IndianRupee, Heart, ShoppingCart, Plus, Minus } from 'lucide-react';
import { wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';

/**
 * ProductCard — used on the /products page.
 *
 * Props:
 *   product          — the product object
 *   user             — logged-in user (null if not authenticated)
 *   initialWishlisted — boolean: is this product already in the user's wishlist?
 *                       Passed from Products.jsx which fetches wishlist IDs on mount.
 *   onWishlistChange — callback(productId, isSaved) so parent can keep its Set in sync
 */
const ProductCard = ({ product, user, initialWishlisted = false, onWishlistChange }) => {
  const isInStock = product.stock > 0;

  // ── Wishlist state ──────────────────────────────────────────────────────────
  // Initialised from the prop (which comes from a real API fetch in Products.jsx),
  // so it survives page refreshes correctly.
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  // Keep in sync if the parent re-fetches and passes a new prop value
  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  // ── Cart state (from global CartContext) ────────────────────────────────────
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

  // Find this product's current entry in the cart (if any)
  const cartItem = cartItems.find((item) => item.product?._id === product._id);
  const cartQty = cartItem?.quantity || 0;

  // Per-button loading flags for + / - / add actions
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // ── Wishlist Handler ─────────────────────────────────────────────────────────
  const handleWishlistToggle = async () => {
    if (!user) {
      setWishlistError('Please log in first');
      return;
    }
    if (wishlistLoading) return;

    setWishlistLoading(true);
    setWishlistError('');

    try {
      if (wishlisted) {
        // Already saved → remove it
        await wishlistService.remove(product._id);
        setWishlisted(false);
        onWishlistChange?.(product._id, false);
      } else {
        // Not saved → add it (use toggle endpoint to be safe even if already exists)
        await wishlistService.add(product._id);
        setWishlisted(true);
        onWishlistChange?.(product._id, true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      // 409 means already in wishlist — treat as saved
      if (err?.response?.status === 409) {
        setWishlisted(true);
        onWishlistChange?.(product._id, true);
      } else {
        setWishlistError('Could not update wishlist. Try again.');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!user) { setCartError('Please log in first'); return; }
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    const result = await addToCart(product._id);
    if (!result.success) setCartError(result.message || 'Could not add to cart');
    setCartActionLoading(false);
  };

  const handleIncrease = async () => {
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    const result = await updateQuantity(product._id, cartQty + 1);
    if (!result.success) setCartError(result.message || 'Could not update quantity');
    setCartActionLoading(false);
  };

  const handleDecrease = async () => {
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    if (cartQty <= 1) {
      // Remove from cart entirely when quantity would drop to 0
      const result = await removeFromCart(product._id);
      if (!result.success) setCartError(result.message || 'Could not remove item');
    } else {
      const result = await updateQuantity(product._id, cartQty - 1);
      if (!result.success) setCartError(result.message || 'Could not update quantity');
    }
    setCartActionLoading(false);
  };

  return (
    <div className="group box overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-brut-lg transition-all duration-200">
      <div className="relative aspect-[4/3] overflow-hidden bg-sun-soft border-b-2 border-ink">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        <span className="tag absolute top-3 left-3 bg-paper">
          <Tag className="w-3 h-3" />
          {product.category}
        </span>
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center shadow-brut-sm transition-transform hover:scale-110 cursor-pointer disabled:opacity-60 ${
            wishlisted ? 'bg-tomato text-white' : 'bg-paper text-ink'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''} ${wishlistLoading ? 'animate-pulse' : ''}`} />
        </button>
        <span
          className={`tag absolute bottom-3 left-3 ${isInStock ? 'bg-mint-soft' : 'bg-tomato-soft'}`}
        >
          {isInStock ? `${product.stock} left` : 'Sold out'}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-display text-base font-bold leading-snug line-clamp-2">
            {product.name}
          </h3>
          <span className="shrink-0 flex items-center px-2 py-0.5 rounded bg-sun border-2 border-ink font-display font-bold text-sm">
            <IndianRupee className="w-3.5 h-3.5" />
            {product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-sm text-ink/60 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        {wishlistError && (
          <p className="field-msg mb-2">{wishlistError}</p>
        )}

        <div className="flex gap-2">
          <Link to={`/products/${product._id}`} className="btn-paper flex-1 px-3">
            Details
          </Link>

          {isInStock && (
            cartQty === 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={cartActionLoading}
                className="btn-ink flex-1 px-3"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartActionLoading ? 'Adding…' : 'Add'}
              </button>
            ) : (
              <div className={`flex-1 flex items-center justify-between rounded-md border-2 border-ink bg-mint overflow-hidden ${cartActionLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                <button
                  onClick={handleDecrease}
                  className="h-full px-2.5 hover:bg-mint-dark transition-colors cursor-pointer"
                  title={cartQty === 1 ? 'Remove from cart' : 'Decrease quantity'}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-display font-bold text-sm">{cartQty}</span>
                <button
                  onClick={handleIncrease}
                  disabled={cartQty >= product.stock}
                  className="h-full px-2.5 hover:bg-mint-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )
          )}
        </div>
        {cartError && (
          <p className="field-msg text-center mt-2">{cartError}</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
