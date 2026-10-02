import React, { useState, useEffect } from 'react';
import { ConnectorService } from '../services/ConnectorService';
import { Loader } from '../components/common/Loader';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  Shield, 
  Cpu, 
  Database, 
  Settings2, 
  Plus, 
  Trash2, 
  Server, 
  Layers, 
  Key, 
  Globe, 
  AlertCircle 
} from 'lucide-react';

export const Connectors = ({ theme }) => {
  const [connectors, setConnectors] = useState([]);
  const [lastChecked, setLastChecked] = useState('Never');
  const [loading, setLoading] = useState(true);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'AZURE' | 'AWS' | 'INFRA'
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [providerTab, setProviderTab] = useState('azure'); // 'azure' | 'aws'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Azure Form State
  const [azureForm, setAzureForm] = useState({
    accountName: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    subscriptionId: '',
    environment: 'AzureCloud'
  });

  // New AWS Form State
  const [awsForm, setAwsForm] = useState({
    accountName: '',
    accountId: '',
    authType: 'access_keys', // 'access_keys' | 'role_arn'
    accessKeyId: '',
    secretAccessKey: '',
    roleArn: '',
    externalId: '',
    region: 'us-east-1'
  });

  const isDark = theme !== 'light';

  const fetchConnectors = async () => {
    try {
      const data = await ConnectorService.getConnectors();
      const connData = data.connectors || data;
      setConnectors(connData);
      if (data.last_checked) setLastChecked(data.last_checked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleTestConnection = async (conn) => {
    setTestingId(conn.id);
    const result = await ConnectorService.testConnection(conn.id);
    setTestingId(null);
    setNotification({
      type: result.status === 'SUCCESS' ? 'success' : 'error',
      message: result.message || `${conn.name}: Connection status verified.`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    const result = await ConnectorService.testAllConnections();
    const list = result.connectors || result;
    setConnectors(list);
    setIsTestingAll(false);
    setNotification({ type: 'success', message: 'All cloud connectors tested successfully.' });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteConnector = async (conn) => {
    if (!window.confirm(`Are you sure you want to disconnect and remove "${conn.name}"?`)) return;
    setDeletingId(conn.id);
    try {
      await ConnectorService.deleteConnector(conn.id);
      setConnectors(prev => prev.filter(c => c.id !== conn.id));
      setNotification({ type: 'success', message: `Disconnected ${conn.name} successfully.` });
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete connector' });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleAddAzureAccount = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        provider: 'azure',
        azure: {
          accountName: azureForm.accountName || `Azure Subscription (${azureForm.subscriptionId.slice(0, 8)})`,
          tenantId: azureForm.tenantId,
          clientId: azureForm.clientId,
          clientSecret: azureForm.clientSecret,
          subscriptionId: azureForm.subscriptionId,
          environment: azureForm.environment
        }
      };
      await ConnectorService.addConnector(payload);
      setNotification({ type: 'success', message: `Azure account "${payload.azure.accountName}" connected successfully!` });
      setIsAddModalOpen(false);
      setAzureForm({
        accountName: '',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        subscriptionId: '',
        environment: 'AzureCloud'
      });
      fetchConnectors();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to add Azure account.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleAddAwsAccount = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        provider: 'aws',
        aws: {
          accountName: awsForm.accountName || `AWS Account (${awsForm.accountId})`,
          accountId: awsForm.accountId,
          authType: awsForm.authType,
          accessKeyId: awsForm.authType === 'access_keys' ? awsForm.accessKeyId : undefined,
          secretAccessKey: awsForm.authType === 'access_keys' ? awsForm.secretAccessKey : undefined,
          roleArn: awsForm.authType === 'role_arn' ? awsForm.roleArn : undefined,
          externalId: awsForm.externalId || undefined,
          region: awsForm.region
        }
      };
      await ConnectorService.addConnector(payload);
      setNotification({ type: 'success', message: `AWS account "${payload.aws.accountName}" connected successfully!` });
      setIsAddModalOpen(false);
      setAwsForm({
        accountName: '',
        accountId: '',
        authType: 'access_keys',
        accessKeyId: '',
        secretAccessKey: '',
        roleArn: '',
        externalId: '',
        region: 'us-east-1'
      });
      fetchConnectors();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to add AWS account.' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'CONNECTED') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (status === 'DISCONNECTED' || status?.includes('DISCONNECTED') || status === 'NOT CONNECTED') {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold shadow-sm shadow-rose-500/10';
    }
    if (status?.includes('READY') || status?.includes('Fallback')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const filteredConnectors = connectors.filter(c => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AZURE') return c.provider === 'azure' || c.id.includes('azure');
    if (selectedFilter === 'AWS') return c.provider === 'aws' || c.id.includes('aws');
    if (selectedFilter === 'INFRA') return c.provider === 'ai' || c.provider === 'db' || c.id.includes('groq') || c.id.includes('mongo');
    return true;
  });

  const azureCount = connectors.filter(c => c.provider === 'azure' || c.id.includes('azure')).length;
  const awsCount = connectors.filter(c => c.provider === 'aws' || c.id.includes('aws')).length;

  if (loading) return <Loader label="Loading cloud connectors & integrations..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Cloud Connectors & Multi-Cloud Integrations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {connectors.length} Connected
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage live authentication bridges for Microsoft Azure (Entra ID / ARM) and Amazon Web Services (IAM / STS).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2 text-sm font-semibold"
            onClick={handleTestAll}
            disabled={isTestingAll}
          >
            <RefreshCw className={`w-4 h-4 ${isTestingAll ? 'animate-spin text-blue-400' : ''}`} />
            {isTestingAll ? 'Testing All...' : 'Test All Connections'}
          </Button>

          <Button
            variant="primary"
            className="flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Add Cloud Account
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl ${notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'} border text-sm flex items-center justify-between shadow-lg`}>
          <span className="flex items-center gap-3 font-semibold">
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {notification.message}
          </span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            selectedFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          All Connectors ({connectors.length})
        </button>
        <button
          onClick={() => setSelectedFilter('AZURE')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            selectedFilter === 'AZURE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          Azure Accounts ({azureCount})
        </button>
        <button
          onClick={() => setSelectedFilter('AWS')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            selectedFilter === 'AWS'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-amber-400" />
          AWS Accounts ({awsCount})
        </button>
        <button
          onClick={() => setSelectedFilter('INFRA')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            selectedFilter === 'INFRA'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          AI & Storage Services
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredConnectors.map((c) => {
          const isAzure = c.provider === 'azure' || c.id.includes('azure');
          const isAws = c.provider === 'aws' || c.id.includes('aws');
          const isAi = c.provider === 'ai' || c.id.includes('groq');
          const isDb = c.provider === 'db' || c.id.includes('mongo');

          return (
            <div
              key={c.id}
              className={`${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-md'
              } border rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-200 hover:border-slate-700`}
            >
              {/* Top Accent Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isAzure ? 'bg-sky-500' : isAws ? 'bg-amber-500' : isAi ? 'bg-purple-500' : 'bg-emerald-500'
                }`}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-3 rounded-xl border ${
                        isAzure
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                          : isAws
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : isAi
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isAzure ? <Cloud className="w-6 h-6" /> : isAws ? <Server className="w-6 h-6" /> : isAi ? <Cpu className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-extrabold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</h4>
                        {c.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-bold uppercase">{c.category}</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border ${getStatusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">{c.description}</p>

                {/* Configuration Specs Box */}
                {c.config && (
                  <div className={`p-3 rounded-xl text-xs font-mono space-y-1.5 ${isDark ? 'bg-slate-950/70 border border-slate-800/80 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                    {c.config.tenantId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tenant ID:</span>
                        <span className="font-semibold text-sky-400 truncate max-w-[240px]">{c.config.tenantId}</span>
                      </div>
                    )}
                    {c.config.subscriptionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Subscription:</span>
                        <span className="font-semibold truncate max-w-[240px]">{c.config.subscriptionId}</span>
                      </div>
                    )}
                    {c.config.accountId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">AWS Account ID:</span>
                        <span className="font-semibold text-amber-400 truncate max-w-[240px]">{c.config.accountId}</span>
                      </div>
                    )}
                    {c.config.roleArn && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">IAM Role:</span>
                        <span className="font-semibold truncate max-w-[240px]">{c.config.roleArn}</span>
                      </div>
                    )}
                    {c.config.accessKeyId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Access Key:</span>
                        <span className="font-semibold">{c.config.accessKeyId.slice(0, 4)}••••••••</span>
                      </div>
                    )}
                    {c.config.region && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Region:</span>
                        <span className="font-semibold text-amber-300">{c.config.region}</span>
                      </div>
                    )}
                    {c.config.model && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">LLM Model:</span>
                        <span className="font-semibold text-purple-400">{c.config.model}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-between gap-2`}>
                <span className="text-xs text-slate-500 font-mono">Last Sync: {c.lastSync}</span>
                <div className="flex items-center gap-2">
                  {!c.isDefault && (
                    <Button
                      variant="secondary"
                      className="text-xs py-1.5 px-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20"
                      onClick={() => handleDeleteConnector(c)}
                      disabled={deletingId === c.id}
                      title="Disconnect and remove account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="text-xs py-1.5 px-3 font-semibold"
                    onClick={() => handleTestConnection(c)}
                    disabled={testingId === c.id}
                  >
                    {testingId === c.id ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Cloud Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Cloud Account Connector"
      >
        <div className="space-y-6">
          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setProviderTab('azure')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                providerTab === 'azure'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cloud className="w-5 h-5" />
              Microsoft Azure
            </button>
            <button
              type="button"
              onClick={() => setProviderTab('aws')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                providerTab === 'aws'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-5 h-5" />
              Amazon Web Services (AWS)
            </button>
          </div>

          {/* Azure Form */}
          {providerTab === 'azure' && (
            <form onSubmit={handleAddAzureAccount} className="space-y-4">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Connect an Azure Entra ID tenant and Subscription to extract RBAC assignments, roles, and audit activity logs.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Account Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Azure Enterprise Production"
                  value={azureForm.accountName}
                  onChange={(e) => setAzureForm({ ...azureForm, accountName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Directory (Tenant) ID</label>
                <input
                  type="text"
                  placeholder="e.g. 72f988bf-86f1-41af-91ab-2d7cd011db47"
                  value={azureForm.tenantId}
                  onChange={(e) => setAzureForm({ ...azureForm, tenantId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Application (Client) ID</label>
                  <input
                    type="text"
                    placeholder="e.g. e44d32a1-9b12-4c22-b5e1..."
                    value={azureForm.clientId}
                    onChange={(e) => setAzureForm({ ...azureForm, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Client Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••"
                    value={azureForm.clientSecret}
                    onChange={(e) => setAzureForm({ ...azureForm, clientSecret: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Azure Subscription ID</label>
                  <input
                    type="text"
                    placeholder="e.g. sub-778899-prod-azure"
                    value={azureForm.subscriptionId}
                    onChange={(e) => setAzureForm({ ...azureForm, subscriptionId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Cloud Environment</label>
                  <select
                    value={azureForm.environment}
                    onChange={(e) => setAzureForm({ ...azureForm, environment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="AzureCloud">Azure Commercial (Global)</option>
                    <option value="AzureUSGovernment">Azure US Government</option>
                    <option value="AzureChina">Azure China (21Vianet)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-500">
                  {isSubmitting ? 'Authenticating...' : 'Connect Azure Account'}
                </Button>
              </div>
            </form>
          )}

          {/* AWS Form */}
          {providerTab === 'aws' && (
            <form onSubmit={handleAddAwsAccount} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Connect an AWS Account via IAM credentials or STS cross-account assume role to audit IAM users, roles, and policies.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Account Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Production Workloads"
                  value={awsForm.accountName}
                  onChange={(e) => setAwsForm({ ...awsForm, accountName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">AWS Account ID (12-Digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    maxLength={12}
                    value={awsForm.accountId}
                    onChange={(e) => setAwsForm({ ...awsForm, accountId: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Default AWS Region</label>
                  <select
                    value={awsForm.region}
                    onChange={(e) => setAwsForm({ ...awsForm, region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="us-east-1">US East (N. Virginia) [us-east-1]</option>
                    <option value="us-east-2">US East (Ohio) [us-east-2]</option>
                    <option value="us-west-1">US West (N. California) [us-west-1]</option>
                    <option value="us-west-2">US West (Oregon) [us-west-2]</option>
                    <option value="eu-west-1">Europe (Ireland) [eu-west-1]</option>
                    <option value="eu-central-1">Europe (Frankfurt) [eu-central-1]</option>
                    <option value="ap-south-1">Asia Pacific (Mumbai) [ap-south-1]</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore) [ap-southeast-1]</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Authentication Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAwsForm({ ...awsForm, authType: 'access_keys' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${
                      awsForm.authType === 'access_keys'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IAM Access Keys
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwsForm({ ...awsForm, authType: 'role_arn' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition-all ${
                      awsForm.authType === 'role_arn'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cross-Account Role ARN
                  </button>
                </div>
              </div>

              {awsForm.authType === 'access_keys' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Access Key ID</label>
                    <input
                      type="text"
                      placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                      value={awsForm.accessKeyId}
                      onChange={(e) => setAwsForm({ ...awsForm, accessKeyId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Secret Access Key</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      value={awsForm.secretAccessKey}
                      onChange={(e) => setAwsForm({ ...awsForm, secretAccessKey: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">IAM Role ARN</label>
                    <input
                      type="text"
                      placeholder="arn:aws:iam::123456789012:role/SecurityAuditRole"
                      value={awsForm.roleArn}
                      onChange={(e) => setAwsForm({ ...awsForm, roleArn: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">External ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. uar-security-bridge-key"
                      value={awsForm.externalId}
                      onChange={(e) => setAwsForm({ ...awsForm, externalId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500">
                  {isSubmitting ? 'Verifying AWS STS...' : 'Connect AWS Account'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
