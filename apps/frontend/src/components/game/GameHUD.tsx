import { useAuthStore, useGameUIStore } from '../../lib/store';
import { LogOut, Users, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameHUDProps {
  onToggleElements?: () => void;
}

export default function GameHUD({ onToggleElements }: GameHUDProps) {
  const user = useAuthStore((state) => state.user);
  const connected = useGameUIStore((state) => state.connected);
  const navigate = useNavigate();

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-50">
      {/* Top Left: User Info */}
      <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto border border-white/10">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            user?.username.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="text-white font-medium">{user?.username}</div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Top Right: Actions */}
      <div className="flex gap-2 pointer-events-auto">
        {onToggleElements && (
          <button 
            onClick={onToggleElements}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full p-3 text-white transition-colors border border-white/10"
            title="Elements"
          >
            <Box size={20} />
          </button>
        )}
        <button className="bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full p-3 text-white transition-colors border border-white/10">
          <Users size={20} />
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full p-3 text-white transition-colors border border-red-400/30"
          title="Leave Space"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
