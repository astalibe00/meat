import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice, shortId, formatDate } from '../lib/utils';
import { OrderItemSkeleton } from '../components/Skeleton';

// Mock orders — will come from API
const MOCK_ORDERS = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    items: [
      { name: 'Osh (Palov)', quantity: 2, price: 35000 },
      { name: 'Coca-Cola 1L', quantity: 1, price: 12000 },
    ],
    total_price: 82000,
    status: 'preparing',
    created_at: '2026-04-15T10:30:00Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    items: [
      { name: 'Lag\'mon', quantity: 1, price: 28000 },
    ],
    total_price: 28000,
    status: 'completed',
    created_at: '2026-04-14T18:00:00Z',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    items: [
      { name: 'Somsa', quantity: 4, price: 8000 },
      { name: 'Fanta 0.5L', quantity: 2, price: 8000 },
    ],
    total_price: 48000,
    status: 'delivering',
    created_at: '2026-04-15T12:00:00Z',
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Kutilmoqda', color: 'text-warning', bg: 'bg-warning/15', icon: '⏳' },
  accepted: { label: 'Qabul qilindi', color: 'text-blue-600', bg: 'bg-blue-100', icon: '✅' },
  preparing: { label: 'Tayyorlanmoqda', color: 'text-warning', bg: 'bg-warning/15', icon: '👨‍🍳' },
  delivering: { label: 'Yetkazilmoqda', color: 'text-primary', bg: 'bg-primary/10', icon: '🚗' },
  completed: { label: 'Yetkazildi', color: 'text-success', bg: 'bg-success/15', icon: '🎉' },
  cancelled: { label: 'Bekor qilindi', color: 'text-danger', bg: 'bg-danger/10', icon: '❌' },
};

export default function Orders() {
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4 text-textPrimary">Buyurtmalar</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <OrderItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (MOCK_ORDERS.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-6xl mb-4">🧾</p>
          <h2 className="text-xl font-bold text-textPrimary mb-2">Buyurtmalar yo'q</h2>
          <p className="text-textSecondary text-sm mb-6">
            Siz hali hech qanday buyurtma bermadingiz
          </p>
          <Link
            to="/products"
            className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:bg-primary-dark transition-colors"
          >
            Buyurtma berish
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4 text-textPrimary">Buyurtmalar</h1>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order, idx) => {
          const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Link to={`/orders/${order.id}`} className="block">
                <div className="card p-4 active:scale-[0.99] transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-textPrimary text-sm">
                        Buyurtma {shortId(order.id)}
                      </p>
                      <p className="text-xs text-textSecondary mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`${status.bg} ${status.color} px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                      <span>{status.icon}</span>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-xs text-textSecondary mb-2">
                    {order.items.map((item, i) => (
                      <span key={i}>
                        {item.name} ×{item.quantity}
                        {i < order.items.length - 1 && ', '}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs text-textSecondary">Jami</span>
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(order.total_price)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
