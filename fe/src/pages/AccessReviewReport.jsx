import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { IdentityService } from '../services/IdentityService';
import { PdfReportService } from '../services/PdfReportService';
import { 
  ClipboardCheck, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Filter, 
  FileText, 
  Search, 
  ShieldAlert, 
  Layers
} from 'lucide-react';

export const AccessReviewReport = ({ theme }) => {
  const isDark = theme !== 'light';
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REVOKED'
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [rawIdentities, setRawIdentities] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    IdentityService.getIdentities()
      .then((data) => {
        const idList = Array.isArray(data) ? data : (data?.identities || []);
        if (idList && idList.length > 0) {
          setRawIdentities(idList);
          const items = idList.map((id, index) => {
            const perms = id.permissions || [];
            const usedPerms = perms.filter(p => p.status === 'USED');
            
            let lastAuth = 'No recent activity (Dormant >90d)';
            if (usedPerms.length > 0) {
              lastAuth = usedPerms[0].lastUsed || 'Active recently';
            }
            
            const isHighRisk = id.riskLevel === 'CRITICAL' || id.riskLevel === 'HIGH';

            return {
              id: `uar-${String(index + 1).padStart(3, '0')}`,
              upn: id.upn,
              displayName: id.displayName,
              scope: id.scope || '/subscriptions/efca2116-f6e1-430f-a854-27d4b4476efd',
              assignedRole: id.provisionedRole || 'Owner',
              entraRole: id.entraRole || (id.provisionedRole?.includes('Admin') ? id.provisionedRole : 'None'),
              subscriptionRole: id.subscriptionRole || (id.provisionedRole && !id.provisionedRole.includes('Admin') ? id.provisionedRole : 'Owner'),
              userType: id.userType || (id.upn?.includes('guest') || id.upn?.includes('#EXT#') ? 'Guest' : 'Member'),
              lastAuth: lastAuth,
              provisionedCount: perms.length > 0 ? perms.length : (id.unusedCount ? id.unusedCount + 4 : 28),
              executedCount: usedPerms.length,
              unusedCount: id.unusedCount !== undefined ? id.unusedCount : (perms.length - usedPerms.length),
              riskLevel: id.riskLevel || 'LOW',
              riskScore: id.riskScore !== undefined ? id.riskScore : (isHighRisk ? 85.0 : 15.0),
              permissions: perms,
              rawIdentity: id,
              decision: isHighRisk && id.unusedCount > 0 ? 'PENDING' : 'APPROVED' // Auto-approve low risk
            };
          });
          setReviewItems(items);
        }
      })
      .catch((err) => {
        console.error("Error loading identities for UAR report:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleExportExecutiveReport = () => {
    setIsExporting(true);
    try {
      const filename = PdfReportService.generateExecutiveReport({
        identities: rawIdentities.length > 0 ? rawIdentities : reviewItems.map(r => r.rawIdentity),
        reviewItems: reviewItems,
        metadata: {
          subscriptionId: "efca2116-f6e1-430f-a854-27d4b4476efd",
          tenantDomain: "anjalibhagigmail.onmicrosoft.com"
        }
      });
      setNotification({
        type: 'success',
        message: `Executive Report generated successfully: ${filename}`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (e) {
      alert("Error generating Executive Report: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredItems = reviewItems.filter(item => {
    const matchesDecision = filter === 'ALL' || item.decision === filter;
    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.displayName.toLowerCase().includes(query) ||
      item.upn.toLowerCase().includes(query) ||
      (item.entraRole && item.entraRole.toLowerCase().includes(query)) ||
      (item.subscriptionRole && item.subscriptionRole.toLowerCase().includes(query)) ||
      item.scope.toLowerCase().includes(query);

    return matchesDecision && matchesRisk && matchesSearch;
  });

  const stats = {
    total: reviewItems.length,
    approved: reviewItems.filter(i => i.decision === 'APPROVED').length,
    revoked: reviewItems.filter(i => i.decision === 'REVOKED').length,
    pending: reviewItems.filter(i => i.decision === 'PENDING').length
  };

  const completionPct = stats.total > 0 ? Math.round(((stats.approved + stats.revoked) / stats.total) * 100) : 100;

  if (loading) {
    return <Loader label="Loading User Access Review assignments..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              User Access Review (UAR) Executive Report
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              ISO 27001 / SOX Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Executive access attestation and least-privilege audit across Azure Entra ID Directory Roles and Subscription RBAC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="text-sm font-bold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex items-center gap-2"
            onClick={handleExportExecutiveReport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating Executive Report...' : 'Generate Executive Report'}
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-3 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {notification.message}
          </span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>
      )}

      {/* Campaign Summary & Progress Bar */}
      <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-3xl p-8 backdrop-blur-md space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className={`text-xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Q3 Entitlement Attestation Campaign</h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Attestation Window
              </span>
            </div>
            <p className="text-sm text-slate-400">Attestation deadline: October 15, 2026 &bull; Scope: Azure Subscription & Entra ID Directory</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Attestation Progress</span>
            <span className="font-mono text-blue-400 font-bold">
              {completionPct}% Complete ({stats.approved + stats.revoked} / {stats.total} Reviewed)
            </span>
          </div>
          <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} w-full h-3 rounded-full overflow-hidden p-0.5`}>
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 font-mono">
          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl border text-center space-y-1`}>
            <span className="text-slate-500 text-xs font-bold uppercase block">Total Identities</span>
            <span className="text-2xl font-extrabold">{stats.total}</span>
          </div>
          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl border text-center space-y-1`}>
            <span className="text-emerald-400 text-xs font-bold uppercase block">Approved Entitlements</span>
            <span className="text-2xl font-extrabold text-emerald-400">{stats.approved}</span>
          </div>
          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl border text-center space-y-1`}>
            <span className="text-rose-400 text-xs font-bold uppercase block">Revoked Rights</span>
            <span className="text-2xl font-extrabold text-rose-400">{stats.revoked}</span>
          </div>
          <div className={`${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} p-4 rounded-2xl border text-center space-y-1`}>
            <span className="text-amber-400 text-xs font-bold uppercase block">Pending Decisions</span>
            <span className="text-2xl font-extrabold text-amber-400">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Access Review Entitlement Table Card */}
      <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-3xl overflow-hidden backdrop-blur-sm space-y-0`}>
        {/* Table Filter & Search Toolbar */}
        <div className={`p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search user, role, UPN, or scope..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Risk Level Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk Only</option>
              <option value="HIGH">High Risk Only</option>
              <option value="LOW">Low Risk Only</option>
            </select>

            {/* Decision Status Filter */}
            <div className="flex items-center gap-1.5">
              {['ALL', 'PENDING', 'APPROVED', 'REVOKED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    filter === f
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Executive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-mono font-bold uppercase tracking-wider ${isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                <th className="py-4 px-6">Identity / Principal</th>
                <th className="py-4 px-4">Entra ID Directory Role</th>
                <th className="py-4 px-4">Subscription IAM Role</th>
                <th className="py-4 px-4">Scope</th>
                <th className="py-4 px-4">Unused Rights / Activity</th>
                <th className="py-4 px-4 text-center">Risk Level</th>
                <th className="py-4 px-6 text-center">Attestation Decision</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching access review entitlements found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const hasEntraAdmin = item.entraRole && item.entraRole !== 'None';
                  const isHighRisk = item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:${isDark ? 'bg-slate-800/30' : 'bg-slate-50'} transition-colors duration-150`}
                    >
                      {/* Identity / User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            isHighRisk ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.displayName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-sans font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {item.displayName}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                item.userType === 'Guest' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {item.userType}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">{item.upn}</span>
                          </div>
                        </div>
                      </td>

                      {/* Entra ID Role */}
                      <td className="py-4 px-4">
                        {hasEntraAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                            {item.entraRole}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">None</span>
                        )}
                      </td>

                      {/* Subscription IAM Role */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          item.subscriptionRole === 'Owner' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                          item.subscriptionRole === 'Contributor' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        }`}>
                          <Layers className="w-3.5 h-3.5" />
                          {item.subscriptionRole}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="py-4 px-4">
                        <span className="text-slate-400 text-[11px] truncate block max-w-[150px]" title={item.scope}>
                          {item.scope.includes('resourceGroups') ? item.scope.split('resourceGroups/')[1] : 'Subscription'}
                        </span>
                      </td>

                      {/* Unused Rights & Activity */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-rose-400 font-bold">{item.unusedCount} Unused</span>
                            <span className="text-slate-500">/ {item.provisionedCount} Total</span>
                          </div>
                          <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${item.provisionedCount > 0 ? (item.unusedCount / item.provisionedCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[120px]" title={item.lastAuth}>
                            {item.lastAuth}
                          </span>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          item.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-black' :
                          item.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>

                      {/* Attestation Decision */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          item.decision === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          item.decision === 'REVOKED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {item.decision === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                           item.decision === 'REVOKED' ? <XCircle className="w-3.5 h-3.5" /> :
                           <AlertTriangle className="w-3.5 h-3.5" />}
                          {item.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
