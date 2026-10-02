import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, theme, size = 'full' }) => {
  if (!isOpen) return null;
  const isDark = theme !== 'light';

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    md: 'max-w-2xl w-full max-h-[85vh]',
    lg: 'max-w-4xl w-full max-h-[88vh]',
    xl: 'max-w-6xl w-full max-h-[92vh]',
    full: 'w-[95vw] max-w-[1600px] h-[92vh] max-h-[92vh]',
  }[size] || 'w-[95vw] max-w-[1600px] h-[92vh] max-h-[92vh]';

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl shadow-slate-950/80' : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        } border rounded-3xl ${sizeClasses} flex flex-col overflow-hidden shadow-2xl transition-all`}
      >
        {/* Fixed Top Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-2xl sm:text-3xl font-extrabold truncate pr-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h3>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-8 h-8" />
          </button>
        </div>
        {/* Scrollable Content Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
