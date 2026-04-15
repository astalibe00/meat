import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { formatPrice } from '../lib/utils';
import { useToast } from '../components/Toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const [phone, setPhone] = useState('+998');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const total = getTotal();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async () => {
    // Validation
    if (phone.length < 13) {
      showToast('Telefon raqamni to\'liq kiriting', 'error');
      return;
    }
    if (address.trim().length < 5) {
      showToast('Manzilni kiriting (kamida 5 belgi)', 'error');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));

    // In production: api.post('/orders', { phone, location: address, payment_method: paymentMethod })
    clearCart();
    setIsSubmitting(false);
    showToast('Buyurtma muvaffaqiyatli yuborildi!', 'success');
    setTimeout(() => navigate('/orders/demo-123'), 500);
  };

  const PAYMENT_METHODS = [
    { id: 'cash', label: '💵 Naqd pul', available: true },
    { id: 'click', label: '💳 Click', available: false },
    { id: 'payme', label: '💳 Payme', available: false },
  ];

  return (
    <div className="p-4 pb-32">
      <ToastComponent />

      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-primary font-medium text-sm"
      >
        ← Ortga
      </button>
      <h1 className="text-2xl font-bold mb-6 text-textPrimary">Rasmiylashtirish</h1>

      <div className="space-y-5">
        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-textPrimary">Telefon raqam</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            maxLength={17}
            className="input-field"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-textPrimary">Yetkazish manzili</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Toshkent shahar, Chilonzor tumani, ..."
            className="input-field resize-none"
          />
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-textPrimary">To'lov turi</label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => method.available && setPaymentMethod(method.id)}
                disabled={!method.available}
                className={`w-full p-3.5 rounded-2xl text-left font-medium text-sm flex items-center justify-between transition-all ${
                  paymentMethod === method.id
                    ? 'border-2 border-primary bg-primary/5 text-primary'
                    : method.available
                    ? 'border border-gray-200 text-textPrimary hover:border-gray-300'
                    : 'border border-gray-100 text-gray-400 bg-gray-50'
                }`}
              >
                <span>{method.label}</span>
                {!method.available && (
                  <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-semibold">
                    Tez orada
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div>
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full flex justify-between items-center py-3 text-sm font-semibold text-textPrimary"
          >
            <span>Buyurtma tafsilotlari ({items.length} mahsulot)</span>
            <span className={`transition-transform ${showSummary ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2 mt-1"
            >
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm py-1">
                  <span className="text-textSecondary">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-sm">
                <span>Yetkazish:</span>
                <span className="text-success">Bepul</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom confirm */}
      <div className="fixed bottom-20 left-0 w-full p-4 glass border-t border-gray-200/50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-textSecondary font-medium">Jami:</span>
          <span className="text-xl font-bold text-textPrimary">{formatPrice(total)}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`btn-primary flex items-center justify-center gap-2 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Yuborilmoqda...</span>
            </>
          ) : (
            <span>Tasdiqlash — {formatPrice(total)}</span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
