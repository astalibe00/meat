import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { formatPrice } from '../lib/utils';

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🛒</p>
          <h2 className="text-xl font-bold text-textPrimary mb-2">Savatcha bo'sh</h2>
          <p className="text-textSecondary text-sm mb-6">
            Mahsulotlarni ko'rib chiqing va savatga qo'shing
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:bg-primary-dark transition-colors"
          >
            Mahsulotlarni ko'rish
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-44">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-textPrimary">Savatcha</h1>
        <button
          onClick={clearCart}
          className="text-sm text-danger font-medium hover:underline"
        >
          Tozalash
        </button>
      </div>

      <AnimatePresence>
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.product_id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="card p-3"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  🍽
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm text-textPrimary truncate pr-2">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-textSecondary hover:text-danger transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-primary font-bold text-sm mt-1">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 bg-gray-100 rounded-full font-bold text-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      −
                    </motion.button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 bg-primary text-white rounded-full font-bold text-sm flex items-center justify-center hover:bg-primary-dark transition-colors"
                    >
                      +
                    </motion.button>
                    <span className="ml-auto text-sm font-bold text-textPrimary">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Bottom summary */}
      <div className="fixed bottom-20 left-0 w-full p-4 glass border-t border-gray-200/50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-textSecondary font-medium">Jami:</span>
          <span className="text-xl font-bold text-textPrimary">{formatPrice(getTotal())}</span>
        </div>
        <Link to="/checkout">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
          >
            Buyurtma berish
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
