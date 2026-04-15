import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
}

const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

const colors: Record<string, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-primary',
};

export default function Toast({ message, type = 'success', visible }: ToastProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className={`fixed top-4 left-4 right-4 z-[100] ${colors[type]} text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3`}
    >
      <span className="text-lg">{icons[type]}</span>
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
}

// Simple toast hook
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  const ToastComponent = () => (
    <Toast message={toast.message} type={toast.type} visible={toast.visible} />
  );

  return { showToast, ToastComponent };
}
