import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Directory } from './pages/Directory';
import { AssessmentHub } from './pages/AssessmentHub';
import { Remediation } from './pages/Remediation';
import { Connectors } from './pages/Connectors';
import { AccessReviewReport } from './pages/AccessReviewReport';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  Plug, 
  ClipboardCheck, 
  Sun, 
  Moon, 
  Menu, 
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const pageTitles = {
    dashboard: { title: "Executive Security Dashboard", subtitle: "Telemetry & AI Remediation Overview" },
    directory: { title: "Identity Directory & Baseline", subtitle: "Master Entra ID user assignments and provisioned Azure RBAC roles" },
    assessment: { title: "Assessment Hub & Policy Rules", subtitle: "Risk issues, gap matrix analysis, and 20-rule policy evaluation" },
    remediation: { title: "AI Remediation Engine (HITL)", subtitle: "Human-in-the-Loop approval dashboard for Groq RAG Synthesized Azure Custom Roles" },
    connectors: { title: "Cloud Connectors & Integrations", subtitle: "Configure connections to Azure Entra ID, Log Analytics Workspace, Groq API, and MongoDB" },
    'access-review': { title: "User Access Review (UAR) Report", subtitle: "Quarterly entitlement review & least-privilege access attestation portal" }
  };

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Identity Directory', icon: Users },
    { id: 'assessment', label: 'Assessment Hub', icon: ShieldAlert, iconClass: 'text-amber-400' },
    { id: 'remediation', label: 'AI Remediation (HITL)', icon: Sparkles, iconClass: 'text-cyan-300 animate-pulse' },
    { id: 'connectors', label: 'Cloud Connectors', icon: Plug },
    { id: 'access-review', label: 'Access Review Report', icon: ClipboardCheck }
  ];

  // The sidebar is expanded if it is NOT manually collapsed OR if the user is hovering over it
  const isExpanded = !isSidebarCollapsed || isSidebarHovered;

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-200`}>
      {/* Sidebar Navigation */}
      <aside
        onMouseEnter={() => {
          if (isSidebarCollapsed) setIsSidebarHovered(true);
        }}
        onMouseLeave={() => {
          if (isSidebarCollapsed) setIsSidebarHovered(false);
        }}
        className={`${
          isExpanded ? 'w-80' : 'w-22'
        } ${
          theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
        } border-r flex flex-col justify-between p-4 transition-all duration-300 ease-in-out backdrop-blur-md shrink-0 z-30 select-none`}
      >
        <div className="space-y-6">
          {/* Logo & Toggle Header */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 shrink-0">
                <Shield className="w-7 h-7 text-white" />
              </div>
              {isExpanded && (
                <div className="whitespace-nowrap animate-in fade-in duration-200">
                  <h1 className="font-extrabold text-xl leading-none">Azure UAR</h1>
                  <span className="text-xs text-blue-500 font-mono font-bold">AI Security Agent</span>
                </div>
              )}
            </div>

            {/* Sidebar collapse/expand toggle button inside sidebar header */}
            {isExpanded && (
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-xl transition-all ${
                  theme === 'dark' ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={isSidebarCollapsed ? "Expand sidebar permanently" : "Collapse sidebar"}
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isExpanded ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isExpanded ? 'gap-4 px-4 py-3.5 justify-start' : 'justify-center p-3.5'
                  } rounded-xl text-base font-semibold transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${item.iconClass || ''}`} />
                  
                  {isExpanded && (
                    <span className="whitespace-nowrap truncate animate-in fade-in duration-200">
                      {item.label}
                    </span>
                  )}

                  {/* Floating tooltip when sidebar is compact */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Indicator when collapsed */}
        {!isExpanded && (
          <div className="flex justify-center pt-4 border-t border-slate-800">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark' ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className={`px-8 py-5 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            {/* Header Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <div>
              <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {pageTitles[activeTab]?.title}
              </h2>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                {pageTitles[activeTab]?.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Top Right Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border text-base font-semibold shadow-md transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-6 h-6 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard theme={theme} />}
          {activeTab === 'directory' && <Directory theme={theme} />}
          {activeTab === 'assessment' && <AssessmentHub theme={theme} />}
          {activeTab === 'remediation' && <Remediation theme={theme} />}
          {activeTab === 'connectors' && <Connectors theme={theme} />}
          {activeTab === 'access-review' && <AccessReviewReport theme={theme} />}
        </main>
      </div>
    </div>
  );
}
