import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Search, ChevronRight, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const IdentityList = ({ identities = [], lastChecked = "Never", onSync, isSyncing, theme }) => {
  const isDark = theme !== 'light';
  const [selectedUser, setSelectedUser] = useState(null);
  const [permFilter, setPermFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedCount, setScrapedCount] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setPermFilter('ALL');
    setSearchTerm('');
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedIdentities = [...identities].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'riskLevel') {
      const riskOrder = { 'CRITICAL': 3, 'HIGH': 2, 'LOW': 1, 'NONE': 0 };
      aVal = riskOrder[a.riskLevel] || 0;
      bVal = riskOrder[b.riskLevel] || 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredPermissions = selectedUser?.permissions?.filter(p => {
    const matchesFilter =
      permFilter === 'ALL' ? true :
      permFilter === 'USED' ? p.status === 'USED' :
      permFilter === 'UNUSED' ? p.status === 'UNUSED' : true;

    const matchesSearch = p.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronDown className="w-4 h-4 opacity-20 inline-block ml-1" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-500 inline-block ml-1" /> : <ChevronDown className="w-4 h-4 text-blue-500 inline-block ml-1" />;
  };

  return (
    <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col h-full shadow-xl`}>
      <div className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <h3 className={`font-bold text-xl flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <UserCheck className="w-6 h-6 text-blue-500" /> Entra ID Identities Baseline
        </h3>
        
        <div className="flex items-center gap-4">
          {scrapedCount === 'syncing' && (
            <span className="text-sm bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full border border-amber-500/30 font-mono font-bold animate-pulse">
              ⏳ Identity Sync in Progress...
            </span>
          )}
          {scrapedCount === true && (
            <span className="text-sm bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full border border-emerald-500/30 font-mono font-bold animate-pulse">
              ✅ Roles Exported & DB Synced
            </span>
          )}
          <Button
            onClick={async () => {
              setIsScraping(true);
              setScrapedCount(null);
              try {
                const res = await fetch('http://localhost:8000/api/v1/identities/run-scraper', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                  // Show "syncing" badge — background thread needs ~35s to finish
                  setScrapedCount('syncing');
                  setIsScraping(false);
                  // Wait 35s then pull fresh identity data from DB
                  setTimeout(async () => {
                    if (onSync) await onSync();
                    setScrapedCount(true);
                  }, 35000);
                } else {
                  alert('Scraper execution failed: ' + (data.error || data.message));
                  setScrapedCount(null);
                }
              } catch (e) {
                alert('Error executing scraper: ' + e.message);
                setScrapedCount(null);
              } finally {
                setIsScraping(false);
              }
            }}
            disabled={isScraping || scrapedCount === 'syncing'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isScraping ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scraping Roles...
              </>
            ) : scrapedCount === 'syncing' ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Identities...
              </>
            ) : (
              'Run AZ Role Scraper'
            )}
          </Button>
          <span className="text-sm bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full border border-blue-500/30 font-mono font-bold">
            {identities.length} Active Principals
          </span>
        </div>
      </div>



      {/* Identity Table Rows */}
      <div className={`overflow-y-auto flex-1 custom-scrollbar ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-10 backdrop-blur-md ${isDark ? 'bg-slate-900/80 text-slate-400 border-b border-slate-800' : 'bg-slate-50/80 text-slate-500 border-b border-slate-200'} text-xs uppercase font-bold tracking-wider`}>
            <tr>
              <th className="px-5 py-4 font-bold cursor-pointer hover:text-blue-500 select-none transition-colors" onClick={() => handleSort('displayName')}>
                Identity (UPN) <SortIcon columnKey="displayName" />
              </th>
              <th className="px-5 py-4 font-bold cursor-pointer hover:text-purple-500 select-none transition-colors" onClick={() => handleSort('entraRole')}>
                Entra ID Role <SortIcon columnKey="entraRole" />
              </th>
              <th className="px-5 py-4 font-bold cursor-pointer hover:text-blue-500 select-none transition-colors" onClick={() => handleSort('subscriptionRole')}>
                Subscription IAM Role <SortIcon columnKey="subscriptionRole" />
              </th>
              <th className="px-4 py-4 font-bold text-center cursor-pointer hover:text-blue-500 select-none transition-colors" onClick={() => handleSort('riskLevel')}>
                Risk Level <SortIcon columnKey="riskLevel" />
              </th>
              <th className="px-4 py-4 font-bold text-center cursor-pointer hover:text-blue-500 select-none transition-colors" onClick={() => handleSort('unusedCount')}>
                Unused Actions <SortIcon columnKey="unusedCount" />
              </th>
              <th className="px-4 py-4 font-bold text-center cursor-pointer hover:text-blue-500 select-none transition-colors" onClick={() => handleSort('riskScore')}>
                Risk Score <SortIcon columnKey="riskScore" />
              </th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {sortedIdentities.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr 
                  onClick={() => {
                    if (selectedUser?.upn === item.upn) {
                      setSelectedUser(null);
                    } else {
                      setSelectedUser(item);
                      setPermFilter('ALL');
                      setSearchTerm('');
                    }
                  }}
                  className={`hover:${isDark ? 'bg-slate-800/40' : 'bg-slate-50'} transition-all cursor-pointer group ${selectedUser?.upn === item.upn ? (isDark ? 'bg-slate-800/30' : 'bg-slate-100') : ''}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className={`font-extrabold text-base group-hover:text-blue-500 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{item.displayName}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">{item.upn}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${
                      item.entraRole && !item.entraRole.includes('None') && !item.entraRole.includes('Member')
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : isDark ? 'bg-slate-800/40 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {item.entraRole || (item.provisionedRole?.includes('Administrator') ? item.provisionedRole : 'Directory Member')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${
                      item.subscriptionRole && !item.subscriptionRole.includes('None')
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : isDark ? 'bg-slate-800/40 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {item.subscriptionRole || item.provisionedRole || 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      item.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                      item.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-slate-500 font-mono font-bold flex items-center justify-center gap-1.5">
                      {item.unusedCount > 0 ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                      {item.unusedCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1.5 rounded-lg font-mono text-sm font-extrabold border ${
                       item.riskScore > 80 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                       item.riskScore > 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                       'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}>
                      {item.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-all inline-block ${selectedUser?.upn === item.upn ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </td>
                </tr>

                {/* Expanded Row for Permissions Breakdown */}
                {selectedUser?.upn === item.upn && (
                  <tr className={isDark ? 'bg-slate-900/60' : 'bg-slate-50'}>
                    <td colSpan="7" className="p-0 border-t-0">
                      <div className={`p-8 space-y-6 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-200'} animate-in slide-in-from-top-2 duration-200`}>
                        {/* Associated Roles Header Info */}
                        <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 font-mono ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold uppercase">Entra ID Role:</span>
                              <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                {selectedUser.entraRole || 'Directory Member'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold uppercase">Subscription IAM Role:</span>
                              <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                {selectedUser.subscriptionRole || 'No Subscription IAM'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            Scope: <span className="text-slate-300 font-bold">{selectedUser.scope}</span>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-6 font-mono">
                          <div className={`${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} p-5 rounded-2xl border text-center space-y-1`}>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Permissions</span>
                            <span className="text-3xl font-extrabold block">{selectedUser.permissions?.length || 0}</span>
                          </div>
                          <div className={`${isDark ? 'bg-slate-950 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} p-5 rounded-2xl border text-center space-y-1`}>
                            <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Used (Executed)</span>
                            <span className="text-3xl font-extrabold text-emerald-500 block">
                              {selectedUser.permissions?.filter(p => p.status === 'USED').length || 0}
                            </span>
                          </div>
                          <div className={`${isDark ? 'bg-slate-950 border-rose-500/30' : 'bg-rose-50 border-rose-200'} p-5 rounded-2xl border text-center space-y-1`}>
                            <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Unused (Dormant)</span>
                            <span className="text-3xl font-extrabold text-rose-500 block">
                              {selectedUser.permissions?.filter(p => p.status === 'UNUSED').length || 0}
                            </span>
                          </div>
                        </div>

                        {/* Filter & Search Bar */}
                        <div className={`flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            {['ALL', 'USED', 'UNUSED'].map(f => (
                              <button
                                key={f}
                                onClick={() => setPermFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                  permFilter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                          <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="Filter by action name..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none ${
                                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Permission Breakdown Table */}
                        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900 border-b border-slate-800 text-slate-400' : 'bg-slate-100 border-b border-slate-200 text-slate-600'} font-bold uppercase tracking-wider`}>
                                <tr>
                                  <th className="px-4 py-3">Permission (Action)</th>
                                  <th className="px-4 py-3">Role Level / Scope</th>
                                  <th className="px-4 py-3">Granted By Role</th>
                                  <th className="px-4 py-3">Threat Mapping (MITRE)</th>
                                  <th className="px-4 py-3 text-center">Risk</th>
                                  <th className="px-4 py-3 text-center">Activity</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-100 text-slate-800'}`}>
                                {filteredPermissions.map((p, pIdx) => {
                                  const isEntra = p.roleType?.includes('Entra');
                                  return (
                                    <tr key={pIdx} className={`hover:${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} transition-colors`}>
                                      <td className="px-4 py-3.5 font-bold">
                                        <span className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.action}</span>
                                      </td>
                                      <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-lg font-bold border inline-flex items-center gap-1.5 ${
                                          isEntra
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                        }`}>
                                          {isEntra ? 'Entra ID Directory' : 'Subscription IAM'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5">
                                        <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                                          isEntra
                                            ? 'bg-purple-500/5 text-purple-300 border-purple-500/20'
                                            : 'bg-blue-500/5 text-blue-300 border-blue-500/20'
                                        }`}>
                                          {p.grantedBy || selectedUser.provisionedRole}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5">
                                        {p.status === 'UNUSED' ? (
                                          <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                            {p.mitre}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">Normal Usage Pattern</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        {p.status === 'UNUSED' ? (
                                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                            p.risk === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                                            p.risk === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                            p.risk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                          }`}>
                                            {p.risk || 'LOW'}
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 text-[11px]">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 text-center text-slate-400">
                                        {p.status === 'USED' ? (
                                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                            {p.executionCount}x ({p.lastUsed})
                                          </span>
                                        ) : (
                                          <span>{p.lastUsed || 'Never (90d)'}</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <span className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border ${
                                          p.status === 'USED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                        }`}>
                                          {p.status}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {filteredPermissions.length === 0 && (
                                  <tr>
                                    <td colSpan="7" className="text-center text-slate-500 py-8">
                                      No permissions found matching search filter.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
