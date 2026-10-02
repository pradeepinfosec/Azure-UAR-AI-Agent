import React, { useEffect, useState } from 'react';
import { DashboardService } from '../services/DashboardService';
import { KPICard } from '../components/dashboard/KPICard';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { Loader } from '../components/common/Loader';
import { Users, ShieldAlert, Key, CheckCircle, Database, Cpu, RefreshCw, Clock } from 'lucide-react';

export const Dashboard = ({ theme }) => {
  const [data, setData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const isDark = theme !== 'light';

  useEffect(() => {
    DashboardService.getSummary().then(setData);
  }, []);

  if (!data) return <Loader label="Loading executive security dashboard..." />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-mono font-bold text-slate-400 tracking-wider">
            SECURITY INTELLIGENCE & TELEMETRY HUB
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 font-mono font-bold">
            <Database className="w-5 h-5" /> LAW Status: Connected
          </span>
          <span className="text-sm bg-blue-500/10 text-blue-400 px-4 py-2.5 rounded-xl border border-blue-500/30 flex items-center gap-2 font-mono font-bold">
            <Cpu className="w-5 h-5" /> Groq RAG: Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Identities" value={data.total_identities} icon={Users} statusColor="blue" trend="+4 new this week" theme={theme} />
        <KPICard title="High Risk Identities" value={data.high_risk_identities} icon={ShieldAlert} statusColor="rose" trend="Requires JIT Remediation" theme={theme} />
        <KPICard title="Unused Permissions" value={data.total_unused_permissions} icon={Key} statusColor="amber" trend="Identified via 90d KQL" theme={theme} />
        <KPICard title="Remediation Rate" value={`${data.risk_remediation_percentage}%`} icon={CheckCircle} statusColor="emerald" trend="+12% from last month" theme={theme} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RiskDistribution data={data} theme={theme} />
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 backdrop-blur-sm space-y-6`}>
          <h3 className={`font-bold text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Top Identities by Risk Score</h3>
          
          <div className="space-y-5 pt-2">
            {data.top_users && data.top_users.map((u, idx) => {
              const maxVal = Math.max(...data.top_users.map(x => x.riskScore)) || 100;
              return (
              <div key={idx} className="flex justify-between items-center text-sm font-semibold">
                <span className="w-24 truncate text-slate-400 font-mono text-base">{u.name}</span>
                <div className="flex-1 mx-6 space-y-2">
                  <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} w-full h-4 rounded-full overflow-hidden p-0.5`}>
                    <div className="bg-rose-500 h-3 rounded-full transition-all" style={{ width: `${(u.riskScore / maxVal) * 100}%` }}></div>
                  </div>
                  <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} w-full h-4 rounded-full overflow-hidden p-0.5`}>
                    <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${(u.unusedCount / 50) * 100}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-base text-rose-500">{u.riskScore.toFixed(1)} Score</span>
                  <span className="text-xs text-slate-500">{u.unusedCount} Unused</span>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};
