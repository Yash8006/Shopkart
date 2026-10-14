import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  IndianRupee,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { orderService } from '../services/api';

const Orders = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getAll();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err?.response?.data?.message || 'Failed to load order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Loading orders…</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-tomato" />
          <h2 className="font-display text-lg font-bold mb-1">Couldn&apos;t load orders</h2>
          <p className="text-sm text-ink/60 mb-5">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-ink">Retry</button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-lilac-soft border-2 border-ink mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-display text-xl font-bold mb-1.5">No orders yet</h2>
          <p className="text-sm text-ink/60 mb-5">Once you check out, your orders will be listed here.</p>
          <Link to="/products" className="btn-sun">
            <ShoppingBag className="w-4 h-4" /> Shop now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="eyebrow bg-lilac">Order history</span>
          <h1 className="page-title mt-3">Your orders</h1>
          <p className="text-sm text-ink/60 mt-1">
            {orders.length} order{orders.length > 1 ? 's' : ''} placed so far
          </p>
        </div>
        <Link to="/products" className="btn-paper self-start sm:self-auto">
          <ShoppingBag className="w-4 h-4" /> Shop more
        </Link>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const dateStr = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—';

          const isPaid = order.paymentStatus === 'PAID';

          return (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block box hover:-translate-y-0.5 hover:shadow-brut-lg transition-all"
            >
              <div className="flex flex-col md:flex-row">
                <div className={`md:w-48 shrink-0 p-4 border-b-2 md:border-b-0 md:border-r-2 border-ink ${isPaid ? 'bg-mint' : 'bg-sun'} rounded-t-md md:rounded-l-md md:rounded-tr-none`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink/70">Order</p>
                  <p className="font-mono font-bold">#{order._id.slice(-8)}</p>
                  <p className="text-xs font-semibold mt-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {dateStr}
                  </p>
                  <span className="tag bg-paper mt-3">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-mint-dark' : 'bg-tomato animate-pulse'}`} />
                    {order.status || 'PENDING'}
                  </span>
                </div>

                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 pr-3 rounded-md border-2 border-ink bg-paper overflow-hidden">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                          alt={item.name}
                          className="w-10 h-10 object-cover border-r-2 border-ink"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate max-w-[10rem]">{item.name}</p>
                          <p className="text-[11px] text-ink/60">
                            {item.quantity} &times; ₹{item.price?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t-2 border-dashed border-ink/15">
                    <span className="font-display text-xl font-bold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {order.totalAmount?.toLocaleString('en-IN')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                      View details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
