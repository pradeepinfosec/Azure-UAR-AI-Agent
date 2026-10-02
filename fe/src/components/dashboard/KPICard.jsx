import React from 'react';

export const KPICard = ({ title, value, icon: Icon, trend, statusColor = "blue", theme }) => {
  const isDark = theme !== 'light';

  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30"
  };

  return (
    <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 flex items-start justify-between backdrop-blur-sm min-h-[160px] transition-all`}>
      <div className="space-y-3">
        <p className={`text-base font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
        <h4 className={`text-4xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</h4>
        {trend && <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{trend}</p>}
      </div>
      <div className={`p-4 rounded-xl border ${colors[statusColor]}`}>
        <Icon className="w-9 h-9" />
      </div>
    </div>
  );
};
