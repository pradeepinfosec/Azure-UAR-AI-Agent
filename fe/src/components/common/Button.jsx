import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const base = "px-6 py-3.5 rounded-xl font-bold text-lg transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-md";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 shadow-blue-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/40 shadow-rose-500/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 shadow-emerald-500/20"
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
