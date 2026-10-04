import { Wifi, WifiOff } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';

const ConnectionStatus = () => {
  const { isConnected } = useLiveData();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
      isConnected
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-red-50 text-red-700'
    }`}>
      {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
      {isConnected ? 'Live' : 'Reconnecting...'}
      {isConnected && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </div>
  );
};

export default ConnectionStatus;