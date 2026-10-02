import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ label = "Loading data..." }) => (
  <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);
