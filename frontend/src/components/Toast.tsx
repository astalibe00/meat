import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface ToastProps {
  message: string;
  tone: "error" | "info" | "success";
  visible: boolean;
}

const toneClasses: Record<ToastProps["tone"], string> = {
  error: "bg-danger",
  info: "bg-primary",
  success: "bg-success",
};

function Toast({ message, tone, visible }: ToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`fixed left-4 right-4 top-4 z-[100] rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toneClasses[tone]}`}
      initial={{ opacity: 0, y: -24 }}
    >
      {message}
    </motion.div>
  );
}

export function useToast() {
  const [state, setState] = useState<ToastProps>({
    message: "",
    tone: "success",
    visible: false,
  });

  const showToast = useCallback(
    (message: string, tone: ToastProps["tone"] = "success") => {
      setState({ message, tone, visible: true });
      window.setTimeout(() => {
        setState((current) => ({ ...current, visible: false }));
      }, 2500);
    },
    [],
  );

  const ToastComponent = useMemo(
    () =>
      function ToastComponentInner() {
        return (
          <Toast
            message={state.message}
            tone={state.tone}
            visible={state.visible}
          />
        );
      },
    [state.message, state.tone, state.visible],
  );

  return { ToastComponent, showToast };
}
