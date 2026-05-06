import { useEffect, useState } from 'react';
import { useAuthStore, useGameUIStore } from '../../lib/store';
import { LogOut, Users, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wsClient } from '../../lib/wsClient';

interface GameHUDProps {
  onToggleElements?: () => void;
}

interface SpaceUser {
  userId: string;
  name: string;
  avatarIdleUrl: string;
}

export default function GameHUD({ onToggleElements }: GameHUDProps) {
  const user = useAuthStore((state) => state.user);
  const connected = useGameUIStore((state) => state.connected);
  const navigate = useNavigate();
  const [showUsers,    setShowUsers]    = useState(false);
  const [usersInSpace, setUsersInSpace] = useState<SpaceUser[]>([]);

  useEffect(() => {
    const onUsersUpdated = (users: SpaceUser[]) => setUsersInSpace(users);

    const onUserJoined = (user: SpaceUser) =>
      setUsersInSpace(prev => [...prev.filter(u => u.userId !== user.userId), user]);

    const onUserLeft = ({ userId }: { userId: string }) =>
      setUsersInSpace(prev => prev.filter(u => u.userId !== userId));

    wsClient.on('usersUpdated',    onUsersUpdated);
    wsClient.on('userJoinedSpace', onUserJoined);
    wsClient.on('userLeftSpace',   onUserLeft);

    return () => {
      wsClient.off('usersUpdated',    onUsersUpdated);
      wsClient.off('userJoinedSpace', onUserJoined);
      wsClient.off('userLeftSpace',   onUserLeft);
    };
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-50">
      {/* Top Left: User Info */}
      <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto border border-white/10">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {user?.avatar?.idleUrl ? (
            <img src={user?.avatar.idleUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            user?.username?.charAt(0).toUpperCase()
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

        {/* Users button and panel */}
        <div className="relative">
          <button
            onClick={() => setShowUsers(prev => !prev)}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full p-3 text-white transition-colors border border-white/10"
            title="Users in space" >
            <Users size={20} />
          </button>

          {showUsers && (
            <div className="absolute right-0 top-14 w-72 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">In this space</span>
                <span className="text-white/50 text-xs bg-white/10 rounded-full px-2 py-0.5">
                  {usersInSpace.length}
                </span>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {usersInSpace.map(u => {
                  const isYou = u.userId === user?.id;
                  return (
                    <div key={u.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                        {u.avatarIdleUrl ? (
                          <img
                            src={u.avatarIdleUrl}
                            alt={u.name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {u.name}
                          {isYou && <span className="ml-2 text-white/40 text-xs font-normal">you</span>}
                        </p>
                      </div>

                      {/* Online dot */}
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full p-3 text-white transition-colors border border-red-400/30"
          title="Leave Space" >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
