import React from 'react';
import { Sparkles, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { Button } from '../common/Button';

export const KanbanBoard = ({ assessments = [], onReview, theme }) => {
  const isDark = theme !== 'light';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Column 1 */}
      <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-6 space-y-4`}>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>1. Gap Analyzed</span>
          <span className={`${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'} px-3 py-1 rounded-lg text-sm font-extrabold`}>2</span>
        </h4>
        <div className={`${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-xl p-6 space-y-3`}>
          <div className="flex justify-between items-start">
            <span className="text-base font-bold">dev.sarah@contoso.com</span>
            <span className="text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 font-bold">HIGH</span>
          </div>
          <p className="text-sm text-slate-400 font-mono">18 unused permissions detected</p>
        </div>
      </div>

      {/* Column 2 */}
      <div className={`${isDark ? 'bg-slate-900/50 border-blue-500/30' : 'bg-blue-50/50 border-blue-200 shadow-md'} border rounded-2xl p-6 space-y-4`}>
        <h4 className="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> 2. RAG Synthesized (HITL Pending)</span>
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm font-extrabold">{assessments.length}</span>
        </h4>
        {assessments.map((item) => (
          <div key={item.id} className={`${isDark ? 'bg-slate-950 border-blue-500/40' : 'bg-white border-blue-300'} border rounded-xl p-6 space-y-4 shadow-xl`}>
            <div className="flex justify-between items-start">
              <span className="text-base font-bold">{item.user_upn}</span>
              <span className="text-xs text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30 font-bold">
                Score: {item.risk_score}
              </span>
            </div>
            <div className={`text-sm font-mono p-3 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              Role Proposed: <span className="text-blue-500 font-bold block mt-1">{item.synthesized_role?.Name}</span>
            </div>
            <Button variant="primary" className="w-full text-base py-3 justify-center" onClick={() => onReview(item)}>
              Review & Approve JIT <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Column 3 */}
      <div className={`${isDark ? 'bg-slate-900/50 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200 shadow-md'} border rounded-2xl p-6 space-y-4`}>
        <h4 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center justify-between">
          <span>3. JIT Enforced</span>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-sm font-extrabold">14</span>
        </h4>
        <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'} border rounded-xl p-6 space-y-2 opacity-85`}>
          <span className="text-base font-bold">analyst.alex@contoso.com</span>
          <p className="text-sm text-emerald-500 font-mono font-semibold">Least-privilege role active</p>
        </div>
      </div>
    </div>
  );
};
