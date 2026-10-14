import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, MapPin, IndianRupee } from 'lucide-react';
import { orderService } from '../services/api';

const OrderSuccess = ({ user }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getById(id);
        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Error loading confirmed order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  return (
    <div className="page-wrap max-w-3xl">
      <section className="box overflow-hidden">
        <div className="bg-mint border-b-2 border-ink px-6 py-10 text-center relative overflow-hidden">
          <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-sun border-2 border-ink" />
          <div className="absolute -right-4 bottom-4 w-12 h-12 rotate-12 bg-tomato border-2 border-ink" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-paper border-2 border-ink shadow-brut-sm mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 stroke-[2.4]" />
            </div>
            <span className="tag bg-paper mt-5">Payment verified &middot; test mode</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-3">You&apos;re all set!</h1>
            <p className="text-sm font-medium text-ink/75 max-w-md mx-auto mt-2">
              Thanks, <span className="font-bold text-ink">{user?.fullName || 'Customer'}</span>. Your payment went through and we&apos;re getting your order ready.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b-2 border-dashed border-ink/15">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">Order reference</p>
              <p className="font-mono text-sm font-bold break-all">{id}</p>
            </div>
            <span className="tag bg-mint-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-dark animate-pulse" />
              {order?.status || 'PLACED'}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm font-semibold text-ink/60">Loading order details…</div>
          ) : order ? (
            <div className="pt-5 space-y-6">
              <div>
                <h3 className="field-label">What you bought</h3>
                <ul className="divide-y-2 divide-dashed divide-ink/15">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="py-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                          alt={item.name}
                          className="w-11 h-11 object-cover rounded-md border-2 border-ink shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{item.name}</p>
                          <p className="text-xs text-ink/60">{item.quantity} &times; ₹{item.price?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <span className="font-display font-bold shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {order.shippingAddress && (
                <div className="box-flat p-4 bg-sun-soft">
                  <h3 className="field-label flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Delivering to
                  </h3>
                  <p className="text-sm font-bold">{order.shippingAddress.fullName} &middot; {order.shippingAddress.phone}</p>
                  <p className="text-sm text-ink/70">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t-2 border-ink">
                <span className="font-display font-bold text-lg">Total paid</span>
                <span className="font-display text-2xl font-bold flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {order.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Link to="/orders" className="btn-ink w-full sm:w-auto">
          <Package className="w-4 h-4" /> See my orders
        </Link>
        <Link to="/products" className="btn-paper w-full sm:w-auto">
          <ShoppingBag className="w-4 h-4" /> Keep shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
