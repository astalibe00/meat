import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice, shortId } from '../lib/utils';

interface Step {
  label: string;
  icon: string;
  done: boolean;
  active?: boolean;
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In production: fetch from API + subscribe to Supabase Realtime
  const steps: Step[] = [
    { label: 'Qabul qilindi', icon: '📋', done: true },
    { label: 'Tasdiqlandi', icon: '✅', done: true },
    { label: 'Tayyorlanmoqda', icon: '👨‍🍳', done: false, active: true },
    { label: 'Yetkazilmoqda', icon: '🚗', done: false },
    { label: 'Yetkazildi', icon: '🎉', done: false },
  ];

  return (
    <div className="p-4 bg-bgMain min-h-screen pb-24">
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center text-primary font-medium text-sm"
      >
        ← Bosh sahifa
      </button>

      <h1 className="text-xl font-bold mb-1 text-textPrimary">
        Buyurtma {shortId(id || 'demo-123')}
      </h1>
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1 bg-warning/15 text-warning px-3 py-1 rounded-full text-xs font-semibold">
          <span className="animate-pulse-soft">●</span> Tayyorlanmoqda
        </span>
        <span className="text-xs text-textSecondary">~30 daqiqa</span>
      </div>

      {/* Timeline */}
      <div className="card p-5 mb-5">
        <div className="space-y-1">
          {steps.map((step, idx) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-stretch"
            >
              {/* Left: indicator + line */}
              <div className="flex flex-col items-center mr-4">
                <motion.div
                  initial={step.active ? { scale: 0.8 } : {}}
                  animate={step.active ? { scale: [1, 1.15, 1] } : {}}
                  transition={step.active ? { repeat: Infinity, duration: 2 } : {}}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 shrink-0 ${
                    step.done
                      ? 'bg-success text-white shadow-sm'
                      : step.active
                      ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.done ? '✓' : step.icon}
                </motion.div>
                {idx !== steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[28px] ${
                      step.done ? 'bg-success' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Right: label */}
              <div className={`pt-2.5 pb-4 ${idx === steps.length - 1 ? 'pb-0' : ''}`}>
                <p
                  className={`font-semibold text-sm ${
                    step.active
                      ? 'text-primary'
                      : step.done
                      ? 'text-textPrimary'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {step.active && (
                  <p className="text-xs text-textSecondary mt-0.5">Hozirda bajarilmoqda...</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Order details */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-textPrimary border-b border-gray-100 pb-3 mb-3">
          Buyurtma ma'lumotlari
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">📍 Manzil</span>
            <span className="font-medium text-textPrimary">Toshkent shahar</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">📞 Telefon</span>
            <span className="font-medium text-textPrimary">+998 90 123 45 67</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">💵 To'lov</span>
            <span className="font-medium text-textPrimary">Naqd pul</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-textSecondary font-semibold">💰 Jami</span>
            <span className="font-bold text-primary text-base">{formatPrice(90000)}</span>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="card p-4 bg-primary/5 border-primary/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-textPrimary">Yordam kerakmi?</p>
            <p className="text-xs text-textSecondary">Bot orqali biz bilan bog'laning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
