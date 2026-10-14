import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Package, AlertCircle, Loader2, PackageX, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, wishlistService } from '../services/api';

const Products = ({ user }) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');

  // Wishlist IDs — fetched once so ProductCard knows which items are already saved
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  // Categories list
  const categories = ['Electronics', 'Fashion', 'Books', 'Home', 'Sports', 'Beauty', 'Toys', 'Food'];

  // Fetch wishlist IDs once when the page loads (only when logged in)
  useEffect(() => {
    if (!user) return;
    wishlistService.getAll()
      .then((data) => {
        const ids = new Set((data.wishlist || []).map((p) => p._id));
        setWishlistedIds(ids);
      })
      .catch(() => {
        // Non-critical — wishlist state will just default to "not saved"
      });
  }, [user]);

  // Callback to add/remove an id from the local wishlistedIds set
  // so toggling on a card stays in sync without a full refetch
  const onWishlistChange = useCallback((productId, isSaved) => {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const data = await productService.getAll(params);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Debounced fetch when search/category/sort changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  if (!user) return null;

  return (
    <div className="page-wrap">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow">The catalogue</span>
          <h1 className="page-title mt-3">Everything in store</h1>
          <p className="text-sm text-ink/60 mt-1">Search, filter and sort to find what you need.</p>
        </div>
        {!loading && !error && (
          <p className="font-display text-sm font-bold">
            <span className="px-2 py-0.5 bg-ink text-cream rounded mr-1">{products.length}</span>
            result{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="box p-3 sm:p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name…"
            className="field pl-10"
          />
        </div>
        <div className="relative md:w-52">
          <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="field pl-10 appearance-none cursor-pointer"
          >
            <option value="">Sort: Featured</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Filter className="w-4 h-4 mr-1" />
        {['', ...categories].map((cat) => (
          <button
            key={cat || 'all'}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full border-2 border-ink text-xs font-bold font-display transition-all cursor-pointer ${
              category === cat ? 'bg-ink text-cream shadow-none' : 'bg-paper hover:bg-sun-soft shadow-brut-sm'
            }`}
          >
            {cat || 'All'}
          </button>
        ))}
        {(search || category || sort) && (
          <button
            onClick={() => { setSearch(''); setCategory(''); setSort(''); }}
            className="ml-auto text-xs font-bold underline decoration-tomato decoration-2 underline-offset-4 cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="loader"></div>
          <p className="font-display text-sm font-bold uppercase tracking-wide">Loading products…</p>
        </div>
      )}

      {!loading && error && (
        <div className="box max-w-md mx-auto p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-tomato" />
          <p className="font-display text-lg font-bold mb-1">That didn&apos;t work</p>
          <p className="text-sm text-ink/60 mb-5">{error}</p>
          <button onClick={fetchProducts} className="btn-ink">Retry</button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="box max-w-md mx-auto p-8 text-center">
          <PackageX className="w-10 h-10 mx-auto mb-3" />
          <p className="font-display text-lg font-bold mb-1">Nothing matches</p>
          <p className="text-sm text-ink/60">
            {search || category
              ? 'Try another keyword or category.'
              : 'Products will show up here once they are added.'}
          </p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              user={user}
              initialWishlisted={wishlistedIds.has(product._id)}
              onWishlistChange={onWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
