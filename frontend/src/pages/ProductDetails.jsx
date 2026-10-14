import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Package,
  IndianRupee,
  ShoppingCart,
  Loader2,
  AlertCircle,
  PackageX,
  Boxes,
  FileText,
  Heart,
  Plus,
  Minus,
} from 'lucide-react';
import { productService, wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Wishlist state ──────────────────────────────────────────────────────────
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistChecked, setWishlistChecked] = useState(false); // has initial check run?

  // ── Cart state ──────────────────────────────────────────────────────────────
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await productService.getById(id);
        setProduct(data.product);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID.');
        } else {
          setError('Something went wrong while loading this product.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Check if this product is already in the user's wishlist (runs once after product loads)
  useEffect(() => {
    if (!user || !id || wishlistChecked) return;
    wishlistService.getAll()
      .then((data) => {
        const ids = new Set((data.wishlist || []).map((p) => p._id));
        setWishlisted(ids.has(id));
        setWishlistChecked(true);
      })
      .catch(() => setWishlistChecked(true));
  }, [user, id, wishlistChecked]);

  if (!user) return null;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Loading product…</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <div className="w-14 h-14 rounded-md bg-tomato-soft border-2 border-ink mx-auto mb-4 flex items-center justify-center">
            {error.includes('not found') || error.includes('Invalid') ? (
              <PackageX className="w-7 h-7" />
            ) : (
              <AlertCircle className="w-7 h-7" />
            )}
          </div>
          <p className="font-display text-lg font-bold mb-1">Hmm, can&apos;t show this</p>
          <p className="text-sm text-ink/60 mb-5">{error}</p>
          <Link to="/products" className="btn-ink">Back to shop</Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isInStock = product.stock > 0;

  // Find this product in the cart
  const cartItem = cartItems.find((item) => item.product?._id === product._id);
  const cartQty = cartItem?.quantity || 0;

  // ── Wishlist Handler ─────────────────────────────────────────────────────────
  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistService.remove(product._id);
        setWishlisted(false);
      } else {
        await wishlistService.add(product._id);
        setWishlisted(true);
      }
    } catch (err) {
      if (err?.response?.status === 409) setWishlisted(true);
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
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
      const result = await removeFromCart(product._id);
      if (!result.success) setCartError(result.message || 'Could not remove item');
    } else {
      const result = await updateQuantity(product._id, cartQty - 1);
      if (!result.success) setCartError(result.message || 'Could not update');
    }
    setCartActionLoading(false);
  };

  return (
    <div className="page-wrap">
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-6">
        <Link to="/products" className="inline-flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
          <ArrowLeft className="w-4 h-4" /> Shop
        </Link>
        <span className="text-ink/30">/</span>
        <span className="text-ink/60">{product.category}</span>
        <span className="text-ink/30">/</span>
        <span className="truncate text-ink/60 normal-case">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="relative">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-lg bg-tomato border-2 border-ink" />
          <div className="relative aspect-square rounded-lg border-2 border-ink overflow-hidden bg-sun-soft">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
              }}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <span className="tag bg-lilac-soft self-start">
            <Tag className="w-3 h-3" /> {product.category}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-md bg-sun border-2 border-ink shadow-brut-sm font-display text-2xl font-bold">
              <IndianRupee className="w-5 h-5" />
              {product.price.toLocaleString('en-IN')}
            </span>
            <span className={`tag ${isInStock ? 'bg-mint-soft' : 'bg-tomato-soft'}`}>
              <Boxes className="w-3 h-3" />
              {isInStock ? `${product.stock} units left` : 'Out of stock'}
            </span>
          </div>

          <div className="mt-6 box-flat p-5 bg-paper">
            <h2 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" /> About this item
            </h2>
            <p className="text-sm text-ink/70 leading-relaxed">{product.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-dashed border-ink/15 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase text-ink/50">Category</p>
                <p className="font-bold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />{product.category}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-ink/50">In stock</p>
                <p className="font-bold flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />{product.stock} units</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {isInStock ? (
              cartQty === 0 ? (
                <button onClick={handleAddToCart} disabled={cartActionLoading} className="btn-ink flex-1 py-3.5">
                  <ShoppingCart className="w-5 h-5" />
                  {cartActionLoading ? 'Adding…' : 'Add to bag'}
                </button>
              ) : (
                <div className={`flex-1 flex items-center rounded-md border-2 border-ink bg-mint shadow-brut-sm overflow-hidden ${cartActionLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <button
                    onClick={handleDecrease}
                    className="px-4 py-3.5 border-r-2 border-ink hover:bg-mint-dark transition-colors cursor-pointer"
                    title={cartQty === 1 ? 'Remove from cart' : 'Decrease quantity'}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center font-display">
                    <span className="text-xl font-bold">{cartQty}</span>
                    <span className="text-xs font-bold ml-1.5">in bag</span>
                  </div>
                  <button
                    onClick={handleIncrease}
                    disabled={cartQty >= product.stock}
                    className="px-4 py-3.5 border-l-2 border-ink hover:bg-mint-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Increase quantity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )
            ) : (
              <button disabled className="btn-paper flex-1 py-3.5">
                <ShoppingCart className="w-5 h-5" />
                Sold out
              </button>
            )}

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`${wishlisted ? 'btn-tomato' : 'btn-paper'} sm:w-auto py-3.5`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-white' : ''}`} />
              {wishlistLoading ? 'Saving…' : wishlisted ? 'Saved' : 'Save'}
            </button>
          </div>

          {cartError && <p className="field-msg mt-3">{cartError}</p>}
          {!isInStock && (
            <p className="text-xs text-ink/50 mt-3">This product is currently unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
