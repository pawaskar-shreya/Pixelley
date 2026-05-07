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

// Kawaii HUD colour tokens 
const HUD_BG = '#fffdf7';
const HUD_BORDER = '#1f1f1f';
const HUD_SHADOW = '3px 3px 0px #1f1f1f';
const HUD_FONT = "'Nunito', sans-serif";
const HUD_HEADING = "'Baloo 2', sans-serif";
const PINK_BG = '#FFD6EA';
const PURPLE_BTN = 'linear-gradient(145deg, #c8a8ff, #a87fff)';
const RED_BTN = 'linear-gradient(145deg, #ffb3b3, #ff8080)';
const YELLOW_BTN = 'linear-gradient(145deg, #ffe066, #ffd11a)';

// Small pill-shaped HUD card
const hudPill: React.CSSProperties = {
  background: HUD_BG,
  border: `2.5px solid ${HUD_BORDER}`,
  borderRadius: '99px',
  boxShadow: HUD_SHADOW,
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'auto',
};

// Square icon button
const iconBtn = (active: boolean, gradient: string): React.CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '14px',
  border: `2.5px solid ${HUD_BORDER}`,
  background: gradient,
  boxShadow: active ? '1px 1px 0px #1f1f1f' : HUD_SHADOW,
  transform: active ? 'translate(2px,2px)' : 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
  pointerEvents: 'auto',
  flexShrink: 0,
});

export default function GameHUD({ onToggleElements }: GameHUDProps) {
  const user = useAuthStore((state) => state.user);
  const connected = useGameUIStore((state) => state.connected);
  const navigate = useNavigate();
  const [showUsers, setShowUsers] = useState(false);
  const [usersInSpace, setUsersInSpace] = useState<SpaceUser[]>([]);

  useEffect(() => {
    const onUsersUpdated = (users: SpaceUser[]) => setUsersInSpace(users);
    const onUserJoined = (u: SpaceUser) =>
      setUsersInSpace(prev => [...prev.filter(p => p.userId !== u.userId), u]);
    const onUserLeft = ({ userId }: { userId: string }) =>
      setUsersInSpace(prev => prev.filter(p => p.userId !== userId));

    wsClient.on('usersUpdated', onUsersUpdated);
    wsClient.on('userJoinedSpace', onUserJoined);
    wsClient.on('userLeftSpace', onUserLeft);

    return () => {
      wsClient.off('usersUpdated', onUsersUpdated);
      wsClient.off('userJoinedSpace', onUserJoined);
      wsClient.off('userLeftSpace', onUserLeft);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 50,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Left: User Info pill */}
      <div style={{ ...hudPill, gap: '10px', padding: '8px 16px 8px 8px' }}>
        {/* Avatar thumbnail */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `2px solid ${HUD_BORDER}`,
            background: PINK_BG,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {user?.avatar?.idleUrl ? (
            <img
              src={user.avatar.idleUrl}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
            />
          ) : (
            <span style={{ fontFamily: HUD_HEADING, fontWeight: 800, fontSize: '14px', color: '#1f1f1f' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name and status */}
        <div>
          <div style={{ fontFamily: HUD_HEADING, fontWeight: 700, fontSize: '14px', color: '#1f1f1f', lineHeight: 1.2 }}>
            {user?.username}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connected ? '#4ade80' : '#f87171',
                border: `1.5px solid ${HUD_BORDER}`,
              }}
            />
            <span style={{ fontFamily: HUD_FONT, fontSize: '12px', color: '#444', fontWeight: 700 }}>
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Right: Action buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>

        {/* Elements toggle */}
        {onToggleElements && (
          <button
            id="hud-toggle-elements"
            onClick={onToggleElements}
            title="Elements"
            style={iconBtn(false, YELLOW_BTN)}
          >
            <Box size={18} color="#1f1f1f" />
          </button>
        )}

        {/* Users button and dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="hud-toggle-users"
            onClick={() => setShowUsers(prev => !prev)}
            title="Users in space"
            style={iconBtn(showUsers, PURPLE_BTN)}
          >
            <Users size={18} color="#1f1f1f" />
          </button>

          {showUsers && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '260px',
                background: HUD_BG,
                border: `2.5px solid ${HUD_BORDER}`,
                borderRadius: '18px',
                boxShadow: '5px 5px 0px #1f1f1f',
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: `2.5px solid ${HUD_BORDER}`,
                  background: PINK_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontFamily: HUD_HEADING, fontWeight: 800, fontSize: '14px', color: '#1f1f1f' }}>
                  👾 In this space
                </span>
                <span
                  style={{
                    fontFamily: HUD_FONT,
                    fontWeight: 700,
                    fontSize: '13px',
                    background: HUD_BG,
                    border: `2px solid ${HUD_BORDER}`,
                    borderRadius: '99px',
                    padding: '1px 8px',
                    color: '#333',
                  }}
                >
                  {usersInSpace.length}
                </span>
              </div>

              {/* User list */}
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {usersInSpace.length === 0 && (
                  <p style={{ padding: '20px', textAlign: 'center', fontFamily: HUD_FONT, color: '#555', fontSize: '14px', fontWeight: 600 }}>
                    Just you here 🌸
                  </p>
                )}
                {usersInSpace.map(u => {
                  const isYou = u.userId === user?.id;
                  return (
                    <div
                      key={u.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderBottom: '1.5px solid #f0e8e8',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: `2px solid ${HUD_BORDER}`,
                          background: '#f0e8ff',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {u.avatarIdleUrl ? (
                          <img
                            src={u.avatarIdleUrl}
                            alt={u.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <span style={{ fontFamily: HUD_HEADING, fontWeight: 800, fontSize: '14px', color: '#1f1f1f' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: HUD_FONT, fontWeight: 700, fontSize: '14px', color: '#1f1f1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.name}
                          {isYou && (
                            <span style={{ marginLeft: '6px', fontWeight: 700, fontSize: '12px', color: '#7744cc' }}>
                              (you)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Online dot */}
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#4ade80',
                          border: `1.5px solid ${HUD_BORDER}`,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leave button */}
        <button
          id="hud-leave-space"
          onClick={() => navigate('/dashboard')}
          title="Leave Space"
          style={iconBtn(false, RED_BTN)}
        >
          <LogOut size={18} color="#1f1f1f" />
        </button>
      </div>
    </div>
  );
}
