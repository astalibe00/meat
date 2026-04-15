import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { motion } from 'framer-motion';

export default function Navigation() {
  const location = useLocation();
  const path = location.pathname;
  const itemCount = useCartStore((s) => s.getItemCount());

  const navItems = [
    { name: 'Asosiy', path: '/', icon: '🏠' },
    { name: 'Mahsulotlar', path: '/products', icon: '🗂' },
    { name: 'Savatcha', path: '/cart', icon: '🛒', badge: itemCount },
    { name: 'Buyurtmalar', path: '/orders', icon: '🧾' },
  ];

  return (
    <nav className="fixed bottom-0 w-full glass border-t border-gray-200/50 px-2 py-2 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = item.path === '/' ? path === '/' : path.startsWith(item.path);
        return (
          <Link
            key={item.name}
            to={item.path}
            className="relative flex flex-col items-center px-3 py-1 rounded-xl transition-all duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="text-xl relative z-10">
              {item.icon}
              {item.badge ? (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </span>
            <span className={`text-[10px] font-semibold mt-0.5 relative z-10 ${
              isActive ? 'text-primary' : 'text-textSecondary'
            }`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
