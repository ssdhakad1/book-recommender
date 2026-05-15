'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { borderColor: 'rgba(34,197,94,0.35)',  iconColor: '#4ade80'  },
  error:   { borderColor: 'rgba(239,68,68,0.35)',   iconColor: '#ef4444'  },
  info:    { borderColor: 'rgba(99,102,241,0.35)',  iconColor: '#818cf8'  },
};

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info;
  const Icon = ICONS[toast.type] || Info;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl"
      style={{ backgroundColor: '#1a1d27', borderColor: s.borderColor, minWidth: '280px', maxWidth: '400px' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: s.iconColor }} />
      <span className="text-sm flex-1 leading-snug" style={{ color: '#f0f0f5' }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 transition-colors"
        style={{ color: '#4a4d62' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#8b8fa8')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4d62')}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
