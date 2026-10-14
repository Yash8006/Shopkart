import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  IndianRupee,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  XCircle,
  Key,
  Info,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalQuantity, clearCart } = useCart();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Gateway status
  const [gatewayStatus, setGatewayStatus] = useState({ isConfigured: false, keyId: null });
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Sandbox simulation modal state
  const [simulationModal, setSimulationModal] = useState({
    isOpen: false,
    orderId: null,
    razorpayOrderId: null,
    amount: 0,
    isProcessing: false,
  });

  useEffect(() => {
    const checkGateway = async () => {
      try {
        const res = await orderService.getRazorpayConfig();
        if (res.success) {
          setGatewayStatus({
            isConfigured: res.isConfigured,
            keyId: res.keyId,
          });
        }
      } catch (err) {
        console.warn('Could not fetch razorpay config:', err);
      }
    };
    checkGateway();
  }, []);

  // Validate form before submitting
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Valid 10-digit phone number is required';
    }

    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';

    const cleanPincode = formData.pincode.trim();
    if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
      errors.pincode = 'Pincode must contain exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError(null);
  };

  // Main Checkout & Payment Trigger
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setServerError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create pending ShopKart order and Razorpay order on backend
      const data = await orderService.createPaymentOrder(formData);
      const { orderId, razorpayOrderId, amount, currency, keyId, isSimulated } = data;

      // Check if this order is in simulated mode or has placeholder keys
      const requiresSimulation = Boolean(
        isSimulated ||
        !razorpayOrderId ||
        razorpayOrderId.startsWith('order_sim_') ||
        !keyId ||
        keyId.includes('ShopKartKey123')
      );

      if (requiresSimulation) {
        // Open the local interactive Razorpay Sandbox modal
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId: razorpayOrderId || `order_sim_${Date.now()}`,
          amount,
          isProcessing: false,
        });
        return;
      }

      // Live Test Mode with real Razorpay credentials
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        // Fallback if CDN failed
        console.warn('Razorpay SDK script failed to load. Opening sandbox dialog.');
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId,
          amount,
          isProcessing: false,
        });
        return;
      }

      // Step 2: Open official Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${orderId.slice(-6)} Checkout`,
        order_id: razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: user?.email || '',
          contact: formData.phone,
        },
        theme: {
          color: '#FF5A36',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setServerError('Payment was cancelled. Your cart has been preserved.');
          },
        },
        handler: async function (response) {
          // Step 3: Payment succeeded in modal -> verify signature on backend
          try {
            const verificationPayload = {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const result = await orderService.verifyPayment(verificationPayload);

            if (result.success) {
              clearCart();
              navigate(`/order-success/${orderId}`);
            } else {
              setServerError(result.message || 'Payment signature verification failed.');
              setIsSubmitting(false);
            }
          } catch (err) {
            setServerError(
              err?.response?.data?.message || 'Failed to verify payment with server. Cart preserved.'
            );
            setIsSubmitting(false);
          }
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setIsSubmitting(false);
          setServerError(
            response.error?.description || 'Payment failed. Please retry with a valid test card.'
          );
        });
        rzp.open();
      } catch (openErr) {
        console.warn('Error launching Razorpay modal:', openErr);
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId,
          amount,
          isProcessing: false,
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to initialize checkout. Please retry.';
      setServerError(errMsg);
      setIsSubmitting(false);
    }
  };

  // Complete simulated payment with Success
  const handleSimulatedSuccess = async () => {
    setSimulationModal((prev) => ({ ...prev, isProcessing: true }));
    try {
      const simPayload = {
        orderId: simulationModal.orderId,
        razorpay_order_id: simulationModal.razorpayOrderId,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'simulated_test_signature',
      };

      const result = await orderService.verifyPayment(simPayload);
      if (result.success) {
        clearCart();
        setSimulationModal({ isOpen: false, orderId: null, razorpayOrderId: null, amount: 0, isProcessing: false });
        navigate(`/order-success/${simulationModal.orderId}`);
      } else {
        setServerError(result.message || 'Simulation verification failed');
        setSimulationModal((prev) => ({ ...prev, isProcessing: false, isOpen: false }));
      }
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Verification error occurred.');
      setSimulationModal((prev) => ({ ...prev, isProcessing: false, isOpen: false }));
    }
  };

  // Complete simulated payment with Failure
  const handleSimulatedFailure = async () => {
    setSimulationModal((prev) => ({ ...prev, isProcessing: true }));
    try {
      const failPayload = {
        orderId: simulationModal.orderId,
        razorpay_order_id: simulationModal.razorpayOrderId,
        razorpay_payment_id: `pay_failed_${Date.now()}`,
        razorpay_signature: 'invalid_signature_simulation',
      };

      await orderService.verifyPayment(failPayload);
    } catch (err) {
      // Expected to fail signature verification
      setServerError('Simulated Payment Failed / Rejected. Your cart and items have been preserved.');
    } finally {
      setSimulationModal({ isOpen: false, orderId: null, razorpayOrderId: null, amount: 0, isProcessing: false });
    }
  };

  const addressFields = [
    { name: 'fullName', label: 'Full name', placeholder: 'e.g. Aarav Sharma', type: 'text', span: 'sm:col-span-2' },
    { name: 'phone', label: 'Mobile number', placeholder: '10-digit number, e.g. 9876543210', type: 'tel', span: 'sm:col-span-2' },
    { name: 'addressLine1', label: 'House no. & street', placeholder: 'e.g. Flat 4B, 22 MG Road', type: 'text', span: 'sm:col-span-2' },
    { name: 'city', label: 'City', placeholder: 'e.g. Bengaluru', type: 'text' },
    { name: 'state', label: 'State', placeholder: 'e.g. Karnataka', type: 'text' },
    { name: 'pincode', label: 'Pincode', placeholder: '6 digits, e.g. 560001', type: 'text', maxLength: 6 },
  ];

  // If cart is empty, render friendly empty state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="box max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-sun-soft border-2 border-ink mx-auto mb-4 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-display text-xl font-bold mb-1.5">Nothing to check out</h2>
          <p className="text-sm text-ink/60 mb-5">Add a few items to your bag first.</p>
          <Link to="/products" className="btn-sun">
            <ArrowLeft className="w-4 h-4" /> Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* Progress */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide hover:underline decoration-2 underline-offset-4">
          <ArrowLeft className="w-4 h-4" /> Back to bag
        </Link>
        <ol className="flex items-center gap-2 text-[11px] font-display font-bold uppercase tracking-wide">
          <li className="px-2 py-1 rounded border-2 border-ink bg-paper line-through decoration-2">1 Bag</li>
          <li className="w-5 h-0.5 bg-ink" />
          <li className="px-2 py-1 rounded border-2 border-ink bg-sun">2 Address &amp; pay</li>
          <li className="w-5 h-0.5 bg-ink/30" />
          <li className="px-2 py-1 rounded border-2 border-ink/30 text-ink/40">3 Done</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <h1 className="page-title">Checkout</h1>
        {gatewayStatus.isConfigured ? (
          <span className="tag bg-mint-soft normal-case">
            <span className="w-2 h-2 rounded-full bg-mint-dark animate-pulse" />
            Razorpay test keys connected ({gatewayStatus.keyId?.slice(0, 12)}…)
          </span>
        ) : (
          <button onClick={() => setShowKeyGuide(true)} className="tag bg-sun-soft normal-case cursor-pointer hover:bg-sun">
            <Sparkles className="w-3 h-3" />
            Local sandbox mode &middot; how to add live keys
          </button>
        )}
      </div>

      {serverError && (
        <div className="alert-bad mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Heads up: </span>
            {serverError}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Address form */}
        <section className="lg:col-span-7 box overflow-hidden">
          <div className="bg-sun border-b-2 border-ink px-6 py-4 flex items-center gap-3">
            <Truck className="w-5 h-5" />
            <div>
              <h2 className="font-display font-bold">Delivery address</h2>
              <p className="text-xs font-medium text-ink/70">We ship free across India</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} id="checkoutForm" className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addressFields.map(({ name, label, placeholder, type, span, maxLength }) => (
              <div key={name} className={span || ''}>
                <label className="field-label">
                  {label} <span className="text-tomato">*</span>
                </label>
                <input
                  type={type}
                  name={name}
                  maxLength={maxLength}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`field ${formErrors[name] ? 'field-bad' : ''}`}
                />
                {formErrors[name] && <p className="field-msg">{formErrors[name]}</p>}
              </div>
            ))}
          </form>
        </section>

        {/* Summary */}
        <aside className="lg:col-span-5 sticky top-24">
          <div className="box overflow-hidden">
            <div className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
              <span className="font-display font-bold uppercase tracking-wide text-sm">Your order</span>
              <span className="text-xs font-semibold text-cream/70">{totalQuantity} items</span>
            </div>

            <div className="p-5">
              <div className="max-h-60 overflow-y-auto pr-1 divide-y-2 divide-dashed divide-ink/15">
                {cartItems.map((item) => (
                  <div key={item.product?._id || Math.random()} className="py-3 first:pt-0 flex items-center gap-3">
                    <img
                      src={
                        item.product?.image ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'
                      }
                      alt={item.product?.name || 'Product'}
                      className="w-12 h-12 object-cover rounded-md border-2 border-ink shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.product?.name}</p>
                      <p className="text-xs text-ink/60">
                        {item.quantity} &times; ₹{item.product?.price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-sm font-display font-bold shrink-0">
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-ink/15 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Delivery</span><span className="font-bold text-mint-dark">FREE</span></div>
                <div className="flex justify-between"><span className="text-ink/60">Taxes &amp; fees</span><span>₹0</span></div>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-ink flex justify-between items-center">
                <span className="font-display font-bold">Grand total</span>
                <span className="font-display text-2xl font-bold flex items-center">
                  <IndianRupee className="w-5 h-5" />
                  {subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button type="submit" form="checkoutForm" disabled={isSubmitting} className="btn-tomato w-full py-3.5 mt-5">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to gateway…</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{subtotal.toLocaleString('en-IN')} securely</span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-semibold text-ink/60">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Razorpay test mode</span>
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> SSL encrypted</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Razorpay Interactive Sandbox Simulator Modal */}
      {simulationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60">
          <div className="box max-w-md w-full overflow-hidden">
            <div className="bg-tomato border-b-2 border-ink px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-paper border-2 border-ink flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold leading-tight">Razorpay Sandbox</h3>
                  <span className="text-xs font-semibold text-ink/75">Simulated test gateway</span>
                </div>
              </div>
              <button
                onClick={() => setSimulationModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-md border-2 border-transparent hover:border-ink hover:bg-paper transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="box-flat bg-sun-soft p-4 text-center">
                <span className="field-label mb-1">Amount due</span>
                <div className="font-display text-4xl font-bold flex items-center justify-center">
                  <IndianRupee className="w-7 h-7 stroke-[2.6]" />
                  {(simulationModal.amount / 100).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-[11px] text-ink/60 mt-1 font-mono break-all">
                  {simulationModal.razorpayOrderId}
                </p>
              </div>

              <dl className="text-xs space-y-1.5">
                <div className="flex justify-between"><dt className="text-ink/60">Customer</dt><dd className="font-bold">{formData.fullName}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">Phone</dt><dd className="font-bold">{formData.phone}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">Environment</dt><dd className="font-bold text-mint-dark">Local dev (test mode)</dd></div>
              </dl>

              <p className="text-xs text-ink/60 text-center">
                No live keys found, so this dialog mimics Razorpay&apos;s payment + signature verification flow locally.
              </p>

              <div className="space-y-3">
                <button onClick={handleSimulatedSuccess} disabled={simulationModal.isProcessing} className="btn-mint w-full py-3">
                  {simulationModal.isProcessing ? (
                    <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Approve payment (success)</span>
                </button>
                <button onClick={handleSimulatedFailure} disabled={simulationModal.isProcessing} className="btn-paper w-full py-2.5 text-xs">
                  <XCircle className="w-4 h-4 text-tomato" />
                  <span>Decline payment (failure)</span>
                </button>
              </div>

              <div className="text-center pt-3 border-t-2 border-dashed border-ink/15">
                <button
                  type="button"
                  onClick={() => {
                    setSimulationModal((prev) => ({ ...prev, isOpen: false }));
                    setShowKeyGuide(true);
                  }}
                  className="text-xs font-bold inline-flex items-center gap-1 underline decoration-tomato decoration-2 underline-offset-4 cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  Want the real Razorpay popup? See the key guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Key Setup Guidance Modal */}
      {showKeyGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60">
          <div className="box max-w-lg w-full overflow-hidden">
            <div className="bg-ink text-cream px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-sun text-ink border-2 border-cream flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold">Add your Razorpay keys</h3>
                  <span className="text-xs text-cream/60">Takes about 2 minutes</span>
                </div>
              </div>
              <button
                onClick={() => setShowKeyGuide(false)}
                className="text-cream/70 hover:text-cream p-1 rounded-md hover:bg-cream/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <ol className="space-y-3 text-xs leading-relaxed text-ink/75">
                {[
                  <>
                    <strong className="text-ink">Log in</strong> at{' '}
                    <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="font-bold underline decoration-tomato decoration-2 underline-offset-2 inline-flex items-center gap-0.5">
                      dashboard.razorpay.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    (free, no business documents needed for test mode).
                  </>,
                  <>
                    <strong className="text-ink">Turn on Test Mode</strong> using the toggle in the top bar.
                  </>,
                  <>
                    <strong className="text-ink">Generate keys</strong> under{' '}
                    <code className="bg-sun-soft px-1 py-0.5 rounded border border-ink/20">Account &amp; Settings &rarr; API Keys</code>.
                  </>,
                  <>
                    <strong className="text-ink">Copy both values</strong> — they look like:
                    <div className="mt-1.5 p-2 bg-sun-soft border-2 border-ink rounded-md font-mono text-[11px] text-ink space-y-1">
                      <div>Key ID: rzp_test_xxxxxxxxxxxxxx</div>
                      <div>Key Secret: yyyyyyyyyyyyyyyyyyyyyyyy</div>
                    </div>
                  </>,
                  <>
                    <strong className="text-ink">Paste them into backend/.env:</strong>
                    <div className="mt-1.5 p-2.5 bg-ink text-sun rounded-md font-mono text-[11px]">
                      RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx<br />
                      RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyyyyyyyyyy
                    </div>
                  </>,
                  <>
                    <strong className="text-ink">Restart the backend</strong> with{' '}
                    <code className="bg-sun-soft px-1 py-0.5 rounded border border-ink/20 font-mono">npm run backend</code> and the real Razorpay popup will open at checkout.
                  </>,
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 rounded bg-ink text-cream font-display font-bold text-[11px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="pt-0.5">{step}</div>
                  </li>
                ))}
              </ol>

              <div className="alert-good text-xs block">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <Info className="w-3.5 h-3.5" /> Test card details
                </span>
                Card{' '}
                <code className="bg-paper px-1.5 py-0.5 rounded border-2 border-ink font-mono font-bold">
                  4012 0000 0000 0002
                </code>
                , any future expiry (e.g. 12/28), any CVV (e.g. 123) and any 4-digit OTP (e.g. 1234).
              </div>

              <button type="button" onClick={() => setShowKeyGuide(false)} className="btn-ink w-full">
                Got it, back to checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
