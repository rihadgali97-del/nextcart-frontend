import React from 'react';
import { CheckCircle, LogOut, X } from 'lucide-react';

const VendorToast = ({ message, isConfirmation = false, onConfirm, onCancel }) => {
  if (!message) return null;

  return (
    <div className={`fixed top-6 right-6 z-[100] flex max-w-sm items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
      isConfirmation
        ? 'border-[#c4a456]/40 bg-[#0f2a29] text-white'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }`}>
      {isConfirmation ? <LogOut size={18} className="mt-0.5 text-[#c4a456]" /> : <CheckCircle size={18} />}
      <div className="flex-1">
        <span className="font-bold text-sm">{message}</span>
        {isConfirmation && (
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors">
              <X size={13} /> Cancel
            </button>
            <button type="button" onClick={onConfirm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#c4a456] text-[#0f2a29] hover:bg-[#e5c77e] transition-colors">
              <LogOut size={13} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorToast;