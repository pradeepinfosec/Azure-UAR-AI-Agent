import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { IdentityService } from '../services/IdentityService';
import { PdfReportService } from '../services/PdfReportService';

export const Reporting = ({ theme }) => {
  const isDark = theme !== 'light';
  const [identities, setIdentities] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    IdentityService.getIdentities().then((data) => {
      if (data) setIdentities(data);
    });
  }, []);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const filename = PdfReportService.generateExecutiveReport({
        identities: identities,
        metadata: {
          subscriptionId: "efca2116-f6e1-430f-a854-27d4b4476efd",
          tenantDomain: "anjalibhagigmail.onmicrosoft.com"
        }
      });
      setNotification(`Report successfully exported: ${filename}`);
      setTimeout(() => setNotification(null), 4000);
    } catch (e) {
      alert("Error generating PDF: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Audit & Compliance Reports</h2>
          <p className="text-base text-slate-400">Generate executive summary & least-privilege compliance audit logs</p>
        </div>
        <Button variant="primary" onClick={handleExportPDF} disabled={isExporting}>
          <Download className="w-5 h-5" /> {isExporting ? 'Generating PDF...' : 'Export Executive PDF Report'}
        </Button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 backdrop-blur-sm space-y-4 flex flex-col justify-between`}>
          <div className="space-y-3">
            <FileText className="w-10 h-10 text-blue-500" />
            <h3 className={`font-extrabold text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>ISO 27001 Access Control Audit</h3>
            <p className="text-base text-slate-400 leading-relaxed">Deterministic proof of 90-day entitlement reviews and least-privilege role conversions.</p>
          </div>
          <Button variant="secondary" onClick={handleExportPDF} className="w-full justify-center">Generate Log (PDF)</Button>
        </div>

        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 backdrop-blur-sm space-y-4 flex flex-col justify-between`}>
          <div className="space-y-3">
            <Shield className="w-10 h-10 text-emerald-500" />
            <h3 className={`font-extrabold text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>SOC 2 Type II Attestation</h3>
            <p className="text-base text-slate-400 leading-relaxed">Audit report demonstrating automated threat mapping and HITL human approval workflows.</p>
          </div>
          <Button variant="secondary" onClick={handleExportPDF} className="w-full justify-center">Generate Attestation (PDF)</Button>
        </div>

        <div className={`${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'} border rounded-2xl p-8 backdrop-blur-sm space-y-4 flex flex-col justify-between`}>
          <div className="space-y-3">
            <CheckCircle className="w-10 h-10 text-amber-500" />
            <h3 className={`font-extrabold text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Azure RBAC Diff Log</h3>
            <p className="text-base text-slate-400 leading-relaxed">JSON diff export of provisioned vs enforced JIT role definitions.</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => {
              const blob = new Blob([JSON.stringify(identities, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Azure_RBAC_Entitlement_Diff_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="w-full justify-center"
          >
            Download JSON Diff
          </Button>
        </div>
      </div>
    </div>
  );
};
