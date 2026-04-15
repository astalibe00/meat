import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { formatPrice } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ProductListSkeleton } from '../components/Skeleton';

// Mock data — will be replaced with API calls
const MOCK_CATEGORIES = [
  { id: '1', name: 'Barchasi', icon: '🍽' },
  { id: '2', name: 'Taomlar', icon: '🥘' },
  { id: '3', name: 'Ichimliklar', icon: '🥤' },
  { id: '4', name: 'Shirinliklar', icon: '🍰' },
  { id: '5', name: 'Salatlar', icon: '🥗' },
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Osh (Palov)', price: 35000, image_url: '', category_id: '2' },
  { id: '2', name: 'Lag\'mon', price: 28000, image_url: '', category_id: '2' },
  { id: '3', name: 'Coca-Cola 1L', price: 12000, image_url: '', category_id: '3' },
  { id: '4', name: 'Medovik tort', price: 45000, image_url: '', category_id: '4' },
  { id: '5', name: 'Cesar salat', price: 32000, image_url: '', category_id: '5' },
  { id: '6', name: 'Somsa', price: 8000, image_url: '', category_id: '2' },
];

const BANNERS = [
  { id: 1, title: "Maxsus Taklif!", subtitle: "Barcha taomlar uchun 20% chegirma", gradient: "from-primary to-primary-dark" },
  { id: 2, title: "Tezkor Yetkazib Berish", subtitle: "30 daqiqada eshigingizgacha", gradient: "from-success to-emerald-700" },
  { id: 3, title: "Yangi Mahsulotlar", subtitle: "Har hafta yangi taomlar", gradient: "from-warning to-amber-600" },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const [isLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { showToast, ToastComponent } = useToast();

  const filteredProducts = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <ToastComponent />

      {/* Header */}
      <header className="flex justify-between items-center mb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">📍</span>
            <h1 className="text-lg font-bold text-textPrimary">Toshkent</h1>
          </div>
          <p className="text-xs text-textSecondary ml-6">Xush kelibsiz!</p>
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-200 transition-colors">
          🔔
        </div>
      </header>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot qidirish..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="mb-5 relative overflow-hidden rounded-2xl">
        <motion.div
          className="flex"
          animate={{ x: `-${activeBanner * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {BANNERS.map((banner) => (
            <div
              key={banner.id}
              className={`min-w-full h-32 bg-gradient-to-r ${banner.gradient} rounded-2xl p-5 text-white flex items-center shadow-lg`}
            >
              <div>
                <h2 className="text-lg font-bold">{banner.title}</h2>
                <p className="text-sm opacity-90 mt-1">{banner.subtitle}</p>
              </div>
            </div>
          ))}
        </motion.div>
        <div className="flex justify-center gap-1.5 mt-3">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeBanner ? 'bg-primary w-5' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className="btn-secondary flex items-center gap-1.5 shrink-0"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-bold">Mashhur Mahsulotlar</h2>
        <Link to="/products" className="text-primary text-sm font-semibold">
          Barchasi →
        </Link>
      </div>

      {isLoading ? (
        <ProductListSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/products/${product.id}`} className="block">
                <div className="card p-3">
                  <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-2 flex items-center justify-center text-3xl">
                    🍽
                  </div>
                  <h3 className="font-semibold text-sm text-textPrimary truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-primary font-bold text-sm">{formatPrice(product.price)}</p>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem({
                          product_id: product.id,
                          name: product.name,
                          price: product.price,
                          image_url: product.image_url,
                        });
                        showToast(`${product.name} savatga qo'shildi`);
                      }}
                      className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shadow-md hover:bg-primary-dark transition-colors"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-textSecondary font-medium">Mahsulot topilmadi</p>
        </div>
      )}
    </div>
  );
}
