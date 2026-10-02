import React, { useState } from 'react';
import { AlertOctagon, ChevronDown, ChevronUp, Shield, Activity, Users, ShieldAlert, Search, Database } from 'lucide-react';

export const RiskRegister = ({ assessments = [], theme }) => {
  const isDark = theme !== 'light';
  const [expandedId, setExpandedId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const groupedRisks = {};
  assessments.forEach((assess) => {
    assess.mitre_mappings?.forEach((mitre) => {
      // Group by distinct technique + target action for comprehensive coverage
      const key = `${mitre.technique_id}_${mitre.permission}`;
      if (!groupedRisks[key]) {
        groupedRisks[key] = {
          id: key,
          techniqueId: mitre.technique_id,
          tactic: mitre.tactic,
          name: `${mitre.tactic} (${mitre.technique_id})`,
          severity: mitre.risk_level || 'HIGH',
          perm: mitre.permission,
          targetScope: mitre.permission,
          roleType: mitre.role_type || 'Subscription IAM',
          description: `Adversaries may exploit '${mitre.technique_id}' (${mitre.tactic}) to abuse excessive permissions. The entitlement '${mitre.permission}' is provisioned but has recorded 0 operational calls over the 90-day baseline window.`,
          remediation: `Synthesize a tailored Azure custom role stripping '${mitre.permission}' to enforce Zero Trust Least Privilege.`,
          users: []
        };
      }
      
      const userExists = groupedRisks[key].users.some(u => u.mail === assess.user_upn);
      if (!userExists) {
        groupedRisks[key].users.push({
          id: assess.display_name || assess.user_upn.split('@')[0],
          mail: assess.user_upn,
          role: assess.provisioned_role,
          scope: assess.scope || '/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd'
        });
      }
    });
  });

  const allRisks = Object.values(groupedRisks);

  const filteredRisks = allRisks.filter(r => {
    const matchesSev = filterSeverity === 'ALL' ? true : r.severity === filterSeverity;
    const matchesSearch = searchTerm === '' 
      ? true 
      : (r.techniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.tactic.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.targetScope.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.users.some(u => u.mail.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev) => {
    if (sev === 'CRITICAL') {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
    }
    if (sev === 'HIGH') {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
    if (sev === 'MEDIUM') {
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    }
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
  };

  return (
    <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-3xl p-8 backdrop-blur-sm space-y-6`}>
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className={`font-extrabold text-2xl flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <AlertOctagon className="w-7 h-7 text-rose-500" /> Active Policy Risk Register & MITRE Controls
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {allRisks.length} Total Controls &bull; {assessments.length} Principals
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time threat mapping of dormant permissions across all Entra ID & Azure Subscription IAM identities
          </p>
        </div>

        {/* Search & Severity Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono text-xs font-bold">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by action, tactic or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                  filterSeverity === sev
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                    : isDark
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Structured Risk Register Table */}
      <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'} uppercase font-bold tracking-wider`}>
              <tr>
                <th className="px-5 py-4">MITRE Technique & ID</th>
                <th className="px-5 py-4">Target Over-Granted Action</th>
                <th className="px-5 py-4 text-center">Affected Principals</th>
                <th className="px-5 py-4 text-center">Severity</th>
                <th className="px-5 py-4">Policy Control Status</th>
                <th className="px-5 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
              {filteredRisks.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr 
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className={`hover:${isDark ? 'bg-slate-900/60' : 'bg-slate-50'} transition-colors cursor-pointer group ${
                        isExpanded ? (isDark ? 'bg-slate-900/40' : 'bg-slate-100/70') : ''
                      }`}
                    >
                      {/* MITRE Technique */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">
                            {r.techniqueId}
                          </span>
                          <div>
                            <span className={`font-extrabold text-sm block group-hover:text-blue-400 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {r.tactic}
                            </span>
                            <span className="text-[11px] text-slate-400">Technique ID: {r.techniqueId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Action */}
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1.5 rounded-lg border font-bold text-xs inline-block ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                        }`}>
                          {r.targetScope}
                        </span>
                      </td>

                      {/* Affected Principals */}
                      <td className="px-5 py-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {r.users.length} {r.users.length === 1 ? 'Account' : 'Accounts'}
                        </span>
                      </td>

                      {/* Severity Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`px-3.5 py-1 rounded-xl text-xs font-extrabold border ${getSeverityBadge(r.severity)}`}>
                          {r.severity}
                        </span>
                      </td>

                      {/* Policy Control Status */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          0 Calls in 90d (Dormant Risk)
                        </span>
                      </td>

                      {/* Drilldown Arrow */}
                      <td className="px-5 py-4 text-center">
                        <button className="p-1 rounded-lg hover:bg-slate-800 transition-colors inline-block text-slate-400 group-hover:text-blue-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Drilldown Panel */}
                    {isExpanded && (
                      <tr className={isDark ? 'bg-slate-950/90' : 'bg-slate-50'}>
                        <td colSpan="6" className="p-0 border-t-0">
                          <div className={`p-6 space-y-6 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-200'} animate-in slide-in-from-top-2 duration-200`}>
                            {/* Threat & Impact Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className={`p-5 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-amber-500" /> MITRE ATT&CK Threat Analysis
                                </h4>
                                <p className={`text-sm font-sans leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {r.description}
                                </p>
                              </div>

                              <div className={`p-5 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-emerald-500" /> Recommended JIT Remediation
                                </h4>
                                <p className={`text-sm font-sans leading-relaxed ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                                  {r.remediation}
                                </p>
                              </div>
                            </div>

                            {/* Affected Accounts Table */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" /> All Affected User Accounts ({r.users.length})
                              </h4>
                              <div className={`border rounded-xl overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead className={isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
                                    <tr>
                                      <th className="px-4 py-2.5">Principal Identity</th>
                                      <th className="px-4 py-2.5">User Principal Name (UPN)</th>
                                      <th className="px-4 py-2.5">Assigned Role</th>
                                      <th className="px-4 py-2.5">Assigned Scope</th>
                                      <th className="px-4 py-2.5 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                    {r.users.map((u, uIdx) => (
                                      <tr key={uIdx} className={`hover:${isDark ? 'bg-slate-850' : 'bg-slate-50'}`}>
                                        <td className="px-4 py-2.5 font-bold">
                                          <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{u.id}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-400 font-mono">
                                          {u.mail}
                                        </td>
                                        <td className="px-4 py-2.5">
                                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                                          }`}>
                                            {u.role}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-400 text-[11px] font-mono">
                                          {u.scope}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                            OVER-PRIVILEGED
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-slate-500 py-10">
                    No active risks found matching search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
