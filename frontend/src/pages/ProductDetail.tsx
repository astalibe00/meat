import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { formatPrice } from '../lib/utils';
import { useToast } from '../components/Toast';

// Mock — will be replaced with API
const MOCK_PRODUCTS: Record<string, { id: string; name: string; price: number; description: string; image_url: string; category_id: string }> = {
  '1': { id: '1', name: 'Osh (Palov)', price: 35000, description: 'An\'anaviy o\'zbek oshi. Eng yaxshi guruch, sabzi va mol go\'shtidan tayyorlangan. Barcha mahsulotlar tabiiy va sifatli.', image_url: '', category_id: '2' },
  '2': { id: '2', name: 'Lag\'mon', price: 28000, description: 'Qo\'lda tortilgan lag\'mon. Tabiiy sabzavotlar va maxsus ziravorlar bilan tayyorlangan.', image_url: '', category_id: '2' },
  '3': { id: '3', name: 'Coca-Cola 1L', price: 12000, description: 'Sovuq va serhosla ichimlik. 1 litrlik hajmda.', image_url: '', category_id: '3' },
  '4': { id: '4', name: 'Medovik tort', price: 45000, description: 'Mazali asal torti. 8 qatlamli, tabiiy asaldan tayyorlangan.', image_url: '', category_id: '4' },
  '5': { id: '5', name: 'Cesar salat', price: 32000, description: 'Yangi sabzavotlar, parmezan pishloq va maxsus sous bilan.', image_url: '', category_id: '5' },
  '6': { id: '6', name: 'Somsa', price: 8000, description: 'Go\'shtli somsa. Tandirda pishirilgan, issiq holda yetkaziladi.', image_url: '', category_id: '2' },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { showToast, ToastComponent } = useToast();

  const product = MOCK_PRODUCTS[id || '1'];

  if (!product) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-textSecondary font-medium mb-4">Mahsulot topilmadi</p>
        <button onClick={() => navigate('/')} className="text-primary font-semibold">
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      });
    }
    showToast(`${product.name} (${quantity} dona) savatga qo'shildi`);
  };

  return (
    <div className="pb-28">
      <ToastComponent />

      {/* Image area */}
      <div className="relative">
        <div className="w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
          🍽
        </div>

        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 glass w-10 h-10 rounded-full flex items-center justify-center shadow-md"
        >
          ←
        </motion.button>

        {/* Favorite button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-4 right-4 glass w-10 h-10 rounded-full flex items-center justify-center shadow-md"
        >
          {isFavorite(product.id) ? '❤️' : '🤍'}
        </motion.button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 -mt-4 bg-bgMain rounded-t-3xl relative"
      >
        <h1 className="text-2xl font-bold text-textPrimary">{product.name}</h1>
        <p className="text-primary font-bold text-xl mt-1">{formatPrice(product.price)}</p>

        <p className="text-textSecondary mt-4 leading-relaxed text-sm">
          {product.description}
        </p>

        {/* Quantity selector */}
        <div className="mt-6 flex items-center gap-1">
          <span className="text-sm font-semibold text-textSecondary mr-3">Miqdori:</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 bg-gray-100 rounded-full text-lg font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            −
          </motion.button>
          <span className="w-10 text-center text-xl font-bold">{quantity}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 bg-primary text-white rounded-full text-lg font-bold flex items-center justify-center hover:bg-primary-dark transition-colors"
          >
            +
          </motion.button>
        </div>

        {/* Delivery info */}
        <div className="mt-6 p-4 bg-success/10 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">🚚</span>
          <div>
            <p className="text-sm font-semibold text-textPrimary">Tezkor yetkazib berish</p>
            <p className="text-xs text-textSecondary">~30 daqiqa ichida</p>
          </div>
        </div>
      </motion.div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-20 left-0 w-full p-4 glass border-t border-gray-200/50">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <span>Savatga qo'shish</span>
          <span>—</span>
          <span>{formatPrice(totalPrice)}</span>
        </motion.button>
      </div>
    </div>
  );
}
