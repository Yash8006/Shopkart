import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  IndianRupee,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { orderService } from '../services/api';

const OrderDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getById(id);
        if (data.success) {
          setOrder(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load order details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="loader"></div>
        <p className="font-display text-sm font-bold uppercase tracking-wide">Loading order #{id?.slice(-6)}…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-tomato" />
          <h2 className="font-display text-lg font-bold mb-1">Order not found</h2>
          <p className="text-sm text-ink/60 mb-5">{error || 'This order does not exist or you do not have permission to view it.'}</p>
          <Link to="/orders" className="btn-ink">
            <ArrowLeft className="w-4 h-4" /> All orders
          </Link>
        </div>
      </div>
    );
  }

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="page-wrap max-w-5xl">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-6 hover:underline decoration-2 underline-offset-4">
        <ArrowLeft className="w-4 h-4" /> All orders
      </Link>

      {/* Receipt header */}
      <section className="box overflow-hidden mb-6">
        <div className={`${isPaid ? 'bg-mint' : 'bg-sun'} border-b-2 border-ink p-6 flex flex-wrap items-end justify-between gap-4`}>
          <div>
            <span className="tag bg-paper"><ShieldCheck className="w-3 h-3" /> ShopKart receipt</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-3 break-all">
              #{order._id}
            </h1>
            <p className="text-xs font-semibold mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {dateStr}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="tag bg-paper">Payment: {order.paymentStatus}</span>
            <span className="tag bg-ink text-cream border-ink">Status: {order.status}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-ink text-xs">
          <div className="p-4">
            <p className="font-bold uppercase tracking-wide text-ink/50 mb-0.5">Razorpay order ID</p>
            <p className="font-mono break-all">{order.razorpayOrderId || '—'}</p>
          </div>
          <div className="p-4">
            <p className="font-bold uppercase tracking-wide text-ink/50 mb-0.5">Razorpay payment ID</p>
            <p className="font-mono break-all">{order.razorpayPaymentId || '—'}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <section className="md:col-span-2 box">
          <div className="px-5 py-4 border-b-2 border-ink flex items-center justify-between">
            <h2 className="font-display font-bold flex items-center gap-2">
              <Package className="w-4 h-4" /> Items ({order.items?.length || 0})
            </h2>
            <span className="text-[11px] font-semibold text-ink/50">Prices at time of purchase</span>
          </div>
          <ul className="divide-y-2 divide-dashed divide-ink/15">
            {order.items?.map((item, idx) => (
              <li key={idx} className="px-5 py-4 flex items-center gap-4">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-md border-2 border-ink shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    ₹{item.price?.toLocaleString('en-IN')} &times; {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-display font-bold shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          {/* Address */}
          <section className="box p-5">
            <h2 className="font-display font-bold flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" /> Ship to
            </h2>
            {order.shippingAddress ? (
              <div className="text-sm space-y-0.5 text-ink/70">
                <p className="font-bold text-ink">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
                <p className="pt-1">Phone: {order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-ink/50">No address recorded</p>
            )}
          </section>

          {/* Payment */}
          <section className="box p-5">
            <h2 className="font-display font-bold flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" /> Payment
            </h2>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-ink/60">Method</span><span className="font-semibold">Razorpay Test</span></div>
              <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span className="font-bold text-mint-dark">FREE</span></div>
            </div>
            <div className="mt-3 pt-3 border-t-2 border-ink flex justify-between items-center">
              <span className="font-display font-bold">Total paid</span>
              <span className="font-display text-xl font-bold flex items-center">
                <IndianRupee className="w-4 h-4" />
                {order.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
