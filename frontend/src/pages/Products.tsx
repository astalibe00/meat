import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { formatPrice } from '../lib/utils';
import { useToast } from '../components/Toast';
import { ProductListSkeleton } from '../components/Skeleton';

const MOCK_CATEGORIES = [
  { id: 'all', name: 'Barchasi', icon: '🍽' },
  { id: '2', name: 'Taomlar', icon: '🥘' },
  { id: '3', name: 'Ichimliklar', icon: '🥤' },
  { id: '4', name: 'Shirinliklar', icon: '🍰' },
  { id: '5', name: 'Salatlar', icon: '🥗' },
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Osh (Palov)', price: 35000, description: 'An\'anaviy o\'zbek oshi', image_url: '', category_id: '2' },
  { id: '2', name: 'Lag\'mon', price: 28000, description: 'Qo\'lda tortilgan lag\'mon', image_url: '', category_id: '2' },
  { id: '3', name: 'Coca-Cola 1L', price: 12000, description: 'Sovuq ichimlik', image_url: '', category_id: '3' },
  { id: '4', name: 'Medovik tort', price: 45000, description: 'Mazali asal torti', image_url: '', category_id: '4' },
  { id: '5', name: 'Cesar salat', price: 32000, description: 'Yangi sabzavotlar bilan', image_url: '', category_id: '5' },
  { id: '6', name: 'Somsa', price: 8000, description: 'Go\'shtli somsa', image_url: '', category_id: '2' },
  { id: '7', name: 'Shashlik', price: 40000, description: 'Ko\'mirda pishirilgan', image_url: '', category_id: '2' },
  { id: '8', name: 'Fanta 0.5L', price: 8000, description: 'Apelsinli ichimlik', image_url: '', category_id: '3' },
];

type SortOption = 'popular' | 'price_asc' | 'price_desc';

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [isLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { showToast, ToastComponent } = useToast();

  let products = activeCategory === 'all'
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter((p) => p.category_id === activeCategory);

  if (sortBy === 'price_asc') {
    products = [...products].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    products = [...products].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="p-4">
      <ToastComponent />

      <h1 className="text-xl font-bold mb-4 text-textPrimary">Mahsulotlar</h1>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-textPrimary hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sort options */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'popular' as SortOption, label: 'Mashhur' },
          { key: 'price_asc' as SortOption, label: 'Arzon → Qimmat' },
          { key: 'price_desc' as SortOption, label: 'Qimmat → Arzon' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === opt.key
                ? 'bg-textPrimary text-white'
                : 'bg-gray-50 text-textSecondary border border-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ProductListSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link to={`/products/${product.id}`} className="block">
                <div className="card p-3 relative">
                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
                  >
                    {isFavorite(product.id) ? '❤️' : '🤍'}
                  </button>

                  <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-2 flex items-center justify-center text-3xl">
                    🍽
                  </div>
                  <h3 className="font-semibold text-sm text-textPrimary truncate">{product.name}</h3>
                  <p className="text-[11px] text-textSecondary truncate mt-0.5">{product.description}</p>
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

      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-textSecondary font-medium">Bu kategoriyada mahsulot yo'q</p>
        </div>
      )}
    </div>
  );
}
