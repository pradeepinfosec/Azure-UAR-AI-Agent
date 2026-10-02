import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, ShieldAlert, Cpu, Code2, AlertCircle } from 'lucide-react';

export const ReviewModal = ({ isOpen, onClose, assessment, onApprove }) => {
  if (!assessment) return null;
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(assessment.id, assessment);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`HITL Review — ${assessment.user_upn}`}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-mono uppercase font-bold">Provisioned Baseline</span>
            <p className="text-xl font-bold text-rose-400">{assessment.provisioned_role}</p>
            <p className="text-sm text-slate-400 font-mono">Scope: {assessment.scope}</p>
          </div>
          <div className="bg-slate-950 p-6 rounded-xl border border-blue-500/40 space-y-2">
            <span className="text-xs text-blue-400 font-mono uppercase font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Groq RAG Synthesized Role
            </span>
            <p className="text-xl font-bold text-blue-300">{assessment.synthesized_role?.Name}</p>
            <p className="text-sm text-slate-400 font-mono">Status: Pending JIT Execution</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> MITRE ATT&CK Threat Mapping
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessment.mitre_mappings?.map((m, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <span className="font-mono text-slate-200 block font-bold">{m.permission}</span>
                  <span className="text-slate-400">{m.tactic} ({m.technique_id})</span>
                </div>
                <span className="px-3 py-1 rounded-md bg-rose-500/10 text-rose-400 font-extrabold border border-rose-500/30">
                  {m.risk_level}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" /> Synthesized Azure Custom Role JSON
          </h4>
          <pre className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-sm font-mono text-blue-300 overflow-x-auto max-h-64 leading-relaxed">
            {JSON.stringify(assessment.synthesized_role, null, 2)}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>Human-in-the-Loop authorization required for Azure CLI execution.</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="success" onClick={handleApprove} disabled={loading}>
              <CheckCircle2 className="w-5 h-5" /> {loading ? "Applying JIT Role..." : "Approve & Execute JIT"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
