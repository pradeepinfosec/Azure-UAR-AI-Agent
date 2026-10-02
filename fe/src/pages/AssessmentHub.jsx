import React, { useEffect, useState } from 'react';
import { RiskRegister } from '../components/assessment/RiskRegister';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, Filter, Database, FileCode, RefreshCw, Clock } from 'lucide-react';
import { AssessmentService } from '../services/AssessmentService';

export const AssessmentHub = ({ theme }) => {
  const [data, setData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const isDark = theme !== 'light';

  useEffect(() => {
    AssessmentService.getAssessments().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-8 h-[calc(100vh-11rem)] overflow-y-auto custom-scrollbar pr-4 pb-12">
      {/* Top Status & Context Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-mono font-bold text-slate-400">
            ENTREPRISE RBAC EVALUATION & GAP ANALYSIS ENGINE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-amber-500/10 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/30 font-mono font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> 20 Enterprise Policy Rules Evaluated
          </span>
          <span className="text-sm bg-blue-500/10 text-blue-400 px-4 py-2.5 rounded-xl border border-blue-500/30 font-mono font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> 90-Day Telemetry Matrix Active
          </span>
        </div>
      </div>

      {/* Assessment Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono">
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 backdrop-blur-sm space-y-2`}>
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Evaluated Gaps</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-4xl font-extrabold block text-slate-100">{
            data.assessments.reduce((acc, curr) => acc + (curr.unused_permissions?.length || 0), 0)
          } Actions</span>
          <p className="text-xs text-slate-400 font-sans">Unused permissions across active Entra ID principals</p>
        </div>

        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 backdrop-blur-sm space-y-2`}>
          <div className="flex justify-between items-center text-rose-500 text-xs font-bold uppercase tracking-wider">
            <span>Critical Severity Gaps</span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-4xl font-extrabold block text-rose-500">{
            data.assessments.filter(a => a.mitre_mappings?.some(m => m.risk_level === 'CRITICAL')).length
          } Principals</span>
          <p className="text-xs text-slate-400 font-sans">Contains wildcard <code>*</code> or directory Owner scope</p>
        </div>

        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 backdrop-blur-sm space-y-2`}>
          <div className="flex justify-between items-center text-blue-500 text-xs font-bold uppercase tracking-wider">
            <span>Evaluated Principals</span>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-4xl font-extrabold block text-blue-500">{data.assessments.length} Accounts</span>
          <p className="text-xs text-slate-400 font-sans">Entra ID users provisioned with Azure RBAC roles</p>
        </div>

        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 backdrop-blur-sm space-y-2`}>
          <div className="flex justify-between items-center text-emerald-500 text-xs font-bold uppercase tracking-wider">
            <span>Policy Compliance Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-4xl font-extrabold block text-emerald-500">{
            (() => {
              const unused = data.assessments.reduce((acc, curr) => acc + (curr.unused_permissions?.length || 0), 0);
              const executed = data.assessments.reduce((acc, curr) => acc + (curr.executed_actions?.length || 0), 0);
              const total = unused + executed;
              return total === 0 ? "100%" : `${Math.round((executed / total) * 1000) / 10}%`;
            })()
          }</span>
          <p className="text-xs text-slate-400 font-sans">Least-privilege ratio against 90-day operational logs</p>
        </div>
      </div>

      {/* Telemetry Window Informational Banner */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border-slate-800' : 'bg-blue-50 border-blue-200 shadow-sm'} backdrop-blur-sm space-y-3`}>
        <div className="flex items-center gap-3">
          <FileCode className="w-6 h-6 text-blue-500" />
          <h3 className={`text-xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>90-Day Azure Log Analytics Workspace (LAW) Baseline</h3>
        </div>
        <p className="text-base text-slate-400 leading-relaxed">
          The Assessment Engine compares Entra ID provisioned <code>actions</code> against actual operational API activity collected from Azure Log Analytics Workspace using KQL queries over a 90-day window. Any provisioned API permission with <strong>0 executions</strong> is categorized as an unused dormant risk.
        </p>
      </div>

      {/* Risk Issues & Policy Gap Register */}
      <RiskRegister assessments={data.assessments} theme={theme} />
    </div>
  );
};
