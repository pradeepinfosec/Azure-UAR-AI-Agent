import React, { useEffect, useState } from 'react';
import { IdentityService } from '../services/IdentityService';
import { IdentityList } from '../components/directory/IdentityList';
import { Loader } from '../components/common/Loader';

export const Directory = ({ theme }) => {
  const [identities, setIdentities] = useState([]);
  const [lastChecked, setLastChecked] = useState("Never");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isDark = theme !== 'light';

  useEffect(() => {
    IdentityService.getIdentities().then((data) => {
      setIdentities(data.identities || data);
      if(data.last_checked) setLastChecked(data.last_checked);
      setLoading(false);
    });
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const data = await IdentityService.syncIdentities();
    setIdentities(data.identities || data);
    if(data.last_checked) setLastChecked(data.last_checked);
    setIsSyncing(false);
  };

  if (loading) return <Loader label="Fetching Entra ID identity assignments..." />;

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <IdentityList 
        identities={identities} 
        onSync={handleSync}
        isSyncing={isSyncing}
        theme={theme} 
      />
    </div>
  );
};
