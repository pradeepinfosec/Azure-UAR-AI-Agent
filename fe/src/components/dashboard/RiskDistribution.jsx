import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';

export const RiskDistribution = ({ data, theme }) => {
  const isDark = theme !== 'light';

  const critical = data?.critical_risk_count || 0;
  const high = data?.high_risk_count || 0;
  const low = data?.low_risk_count || 0;
  const total = data?.total_identities || 1; // prevent div by zero

  const criticalPct = Math.round((critical / total) * 100);
  const highPct = Math.round((high / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  return (
    <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 backdrop-blur-sm space-y-6`}>
      <h3 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        <Activity className="w-7 h-7 text-blue-500" /> Security Risk Distribution
      </h3>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-base font-semibold mb-2">
            <span className="flex items-center gap-2 text-rose-500"><ShieldAlert className="w-5 h-5" /> Critical Risk (Over-privileged Admin)</span>
            <span>{critical} Identities</span>
          </div>
          {/* Scaled chart height by 50% (h-6) */}
          <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full h-6 overflow-hidden p-0.5`}>
            <div className="bg-rose-500 h-5 rounded-full transition-all" style={{ width: `${criticalPct}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-base font-semibold mb-2">
            <span className="flex items-center gap-2 text-amber-500"><AlertTriangle className="w-5 h-5" /> High Risk (Storage/KeyVault Rights)</span>
            <span>{high} Identities</span>
          </div>
          {/* Scaled chart height by 50% (h-6) */}
          <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full h-6 overflow-hidden p-0.5`}>
            <div className="bg-amber-500 h-5 rounded-full transition-all" style={{ width: `${highPct}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-base font-semibold mb-2">
            <span className="flex items-center gap-2 text-emerald-500"><ShieldCheck className="w-5 h-5" /> Low Risk (Least-Privilege Compliant)</span>
            <span>{low} Identities</span>
          </div>
          {/* Scaled chart height by 50% (h-6) */}
          <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full h-6 overflow-hidden p-0.5`}>
            <div className="bg-emerald-500 h-5 rounded-full transition-all" style={{ width: `${lowPct}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
