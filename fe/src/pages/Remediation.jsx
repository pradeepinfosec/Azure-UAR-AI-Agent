import React, { useEffect, useState } from 'react';
import { AssessmentService } from '../services/AssessmentService';
import { ReviewModal } from '../components/assessment/ReviewModal';
import { Loader } from '../components/common/Loader';
import { Cpu, ShieldCheck, Sparkles, ArrowRight, Zap, CheckCircle2, ShieldAlert, Search, Filter } from 'lucide-react';

export const Remediation = ({ theme }) => {
  const [assessments, setAssessments] = useState([]);
  const [lastChecked, setLastChecked] = useState('Never');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const isDark = theme !== 'light';

  useEffect(() => {
    AssessmentService.getAssessments().then((data) => {
      setAssessments(data.assessments || data);
      if (data.last_checked) setLastChecked(data.last_checked);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (id, payload) => {
    await AssessmentService.approveAssessment(id, payload);
    setAssessments(assessments.filter(a => a.id !== id));
  };

  const filteredAssessments = assessments.filter((item) => {
    const matchesSearch = searchTerm === ''
      ? true
      : (item.user_upn.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.display_name && item.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
         item.provisioned_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.synthesized_role?.Name && item.synthesized_role.Name.toLowerCase().includes(searchTerm.toLowerCase())));

    let matchesRisk = true;
    if (riskFilter === 'CRITICAL') matchesRisk = item.risk_score >= 75;
    else if (riskFilter === 'HIGH') matchesRisk = item.risk_score >= 40 && item.risk_score < 75;
    else if (riskFilter === 'LOW') matchesRisk = item.risk_score < 40;

    return matchesSearch && matchesRisk;
  });

  if (loading) return <Loader label="Loading AI Remediation Engine & HITL approvals..." />;

  return (
    <div className="space-y-8">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-1 pl-2">
          <span className="text-sm font-mono font-bold text-slate-400">
            GROQ RAG LEAST-PRIVILEGE SYNTHESIZER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950/50 rounded-xl border border-slate-800/80 p-1">
            <span className="text-xs text-cyan-400 px-4 py-2 font-mono font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4" /> llama-3.3-70b-versatile
            </span>
            <div className="w-px bg-slate-800/80 my-2"></div>
            <span className="text-xs text-emerald-400 px-4 py-2 font-mono font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> HITL Active
            </span>
          </div>
        </div>
      </div>

      {/* RAG AI Remediation Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono">
        <div className={`group ${isDark ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200 shadow-md hover:border-amber-500/50'} border rounded-2xl p-6 backdrop-blur-sm space-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10`}>
          <div className="flex justify-between items-center text-amber-500 text-xs font-bold uppercase tracking-wider">
            <span>Pending Approvals</span>
            <ShieldAlert className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-4xl font-extrabold block text-amber-500">{assessments.length}</span>
          <p className="text-xs text-slate-400 font-sans">Roles awaiting security admin sign-off</p>
        </div>

        <div className={`group ${isDark ? 'bg-slate-900/80 border-slate-800 hover:border-cyan-400/50' : 'bg-white border-slate-200 shadow-md hover:border-cyan-400/50'} border rounded-2xl p-6 backdrop-blur-sm space-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/10`}>
          <div className="flex justify-between items-center text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <span>RAG Roles Generated</span>
            <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
          </div>
          <span className="text-4xl font-extrabold block text-cyan-400">{assessments.length > 0 ? assessments.length : 3}</span>
          <p className="text-xs text-slate-400 font-sans">Synthesized via Groq API</p>
        </div>

        <div className={`group ${isDark ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 shadow-md hover:border-emerald-500/50'} border rounded-2xl p-6 backdrop-blur-sm space-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10`}>
          <div className="flex justify-between items-center text-emerald-500 text-xs font-bold uppercase tracking-wider">
            <span>Avg Permissions Reduced</span>
            <Zap className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-4xl font-extrabold block text-emerald-500">{
            assessments.length > 0 
            ? `${Math.round(assessments.reduce((acc, curr) => acc + (curr.unused_permissions?.length || 0), 0) / assessments.length)}`
            : "0"
          }</span>
          <p className="text-xs text-slate-400 font-sans">Average unused attack actions removed per principal</p>
        </div>

        <div className={`group ${isDark ? 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-500/50'} border rounded-2xl p-6 backdrop-blur-sm space-y-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10`}>
          <div className="flex justify-between items-center text-blue-500 text-xs font-bold uppercase tracking-wider">
            <span>JIT Deployment</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-4xl font-extrabold block text-blue-500">Auto</span>
          <p className="text-xs text-slate-400 font-sans">Executed via <code>az role assignment create</code></p>
        </div>
      </div>

      {/* HITL Enforcement Queue Table */}
      <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} backdrop-blur-md space-y-6`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
              <h3 className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                HITL Enforcement Queue
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {assessments.length} Principals Awaiting JIT Sign-Off
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Review AI-synthesized least-privilege custom roles and enforce Just-In-Time (JIT) access.
            </p>
          </div>

          {/* Search & Risk Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono text-xs font-bold">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user, role or role name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((rf) => (
                <button
                  key={rf}
                  onClick={() => setRiskFilter(rf)}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                    riskFilter === rf
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                      : isDark
                      ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {rf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Table */}
        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'} uppercase font-bold tracking-wider`}>
                <tr>
                  <th className="px-5 py-4">Principal Identity</th>
                  <th className="px-5 py-4">Current Provisioned Role</th>
                  <th className="px-5 py-4">Proposed Least-Privilege Role</th>
                  <th className="px-4 py-4 text-center">Unused Actions</th>
                  <th className="px-4 py-4 text-center">Risk Score</th>
                  <th className="px-5 py-4 text-right">HITL Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                {filteredAssessments.map((item, idx) => (
                  <tr key={idx} className={`hover:${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} transition-colors`}>
                    {/* Identity */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className={`font-extrabold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {item.display_name || item.user_upn.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5">{item.user_upn}</span>
                      </div>
                    </td>

                    {/* Current Role */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-block ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}>
                        {item.provisioned_role}
                      </span>
                    </td>

                    {/* Proposed Synthesized Role */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          {item.synthesized_role?.Name || 'Custom-LeastPrivilege'}
                        </span>
                      </div>
                    </td>

                    {/* Unused Actions */}
                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        -{item.unused_permissions?.length || 0} Actions
                      </span>
                    </td>

                    {/* Risk Score */}
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${
                        item.risk_score > 80 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                        item.risk_score > 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      }`}>
                        {item.risk_score}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedAssessment(item)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        Review & Approve JIT <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAssessments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-slate-500 py-12">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500/40" />
                      <p className="text-base font-bold">No pending HITL approvals matching search.</p>
                      <p className="text-xs">All identities are operating within least-privilege baselines.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HITL Custom Role JSON Approval Modal */}
      <ReviewModal
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        assessment={selectedAssessment}
        onApprove={handleApprove}
      />
    </div>
  );
};
