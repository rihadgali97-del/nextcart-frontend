import React from 'react';
import { useEffect, useState } from 'react';
import { Check, CircleAlert, Info, X } from 'lucide-react';
import { TOAST_EVENT_NAME } from '../../services/toast';

const styles = {
  success: { background: '#0f2a23', border: '#1d9e75', icon: Check },
  error: { background: '#3a1c17', border: '#d85a30', icon: CircleAlert },
  info: { background: '#172b3b', border: '#4b9ed0', icon: Info },
  confirm: { background: '#0f2a23', border: '#c6a84b', icon: CircleAlert },
};

export default function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const item = event.detail;
      setItems((current) => [...current.filter((toast) => toast.type === 'confirm'), item]);
      if (item.type !== 'confirm') {
        window.setTimeout(() => setItems((current) => current.filter((toast) => toast.id !== item.id)), 3600);
      }
    };
    window.addEventListener(TOAST_EVENT_NAME, onToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, onToast);
  }, []);

  const dismiss = (item, confirmed = false) => {
    item.resolve?.(confirmed);
    setItems((current) => current.filter((toast) => toast.id !== item.id));
  };

  return (
    <div className="fixed right-4 top-4 z-[10000] flex w-[min(92vw,390px)] flex-col gap-3" aria-live="polite">
      {items.map((item) => {
        const style = styles[item.type] || styles.info;
        const Icon = style.icon;
        const isConfirm = item.type === 'confirm';
        return (
          <div key={item.id} role={item.type === 'error' ? 'alert' : 'status'}
            className="rounded-xl border px-4 py-3 text-white shadow-xl"
            style={{ background: style.background, borderColor: style.border }}>
            <div className="flex items-start gap-3">
              <Icon size={18} className="mt-0.5 shrink-0" style={{ color: style.border }} />
              <div className="min-w-0 flex-1 text-sm font-medium">{item.message}</div>
              {!isConfirm && <button type="button" onClick={() => dismiss(item)} aria-label="Dismiss notification"
                className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"><X size={15} /></button>}
            </div>
            {isConfirm && (
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => dismiss(item, false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/10">Cancel</button>
                <button type="button" onClick={() => dismiss(item, true)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#0f2a23]"
                  style={{ background: style.border }}>{item.confirmLabel}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
