import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Space } from '../lib/types';
import { useAuthStore } from '../lib/store';
import { LobbyScene } from '../game/scenes/LobbyScene';

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const fetchSpaces = async () => {
    try {
      const res = await api.getSpaces();
      setSpaces(res.spaces || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const handleEnterSpace = (spaceId: string, spaceName: string) => {
    navigate(`/space/${spaceId}`);

    // Poll until LobbyScene is active after Phaser boots
    const tryEnter = (attempts = 0) => {
      if (attempts > 20) {
        console.error('LobbyScene never became available');
        return;
      }

      const game = (window as any).__phaserGame as Phaser.Game | undefined;
      const lobby = game?.scene.getScene('LobbyScene') as LobbyScene | undefined;

      if (lobby?.scene.isActive()) {
        lobby.enterSpace(spaceName.toLowerCase());
      } else {
        setTimeout(() => tryEnter(attempts + 1), 300);
      }
    };

    setTimeout(() => tryEnter(), 300);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="kawaii-card"
          style={{ padding: '32px 48px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎮</div>
          <p
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              color: '#555',
            }}
          >
            Loading your spaces...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '36px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              className="kawaii-heading"
              style={{ fontSize: '34px', margin: 0 }}
            >
              🕹️ Pick a Space!
            </h1>
            {user?.name && (
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: '#777',
                  fontSize: '15px',
                  marginTop: '4px',
                }}
              >
                Hey <strong style={{ color: '#a87fff' }}>{user.name}</strong> 👋 where are you hanging today?
              </p>
            )}
          </div>

          <button
            id="dashboard-logout"
            onClick={handleLogout}
            className="kawaii-btn kawaii-btn-danger"
            style={{ fontSize: '14px', padding: '10px 22px' }}
          >
            👋 Logout
          </button>
        </div>

        {/* ── Spaces grid ── */}
        {spaces.length === 0 ? (
          <div
            className="kawaii-card"
            style={{
              padding: '60px 40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌟</div>
            <p
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 700,
                fontSize: '20px',
                color: '#888',
              }}
            >
              No spaces found yet!
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: '#aaa', fontSize: '14px', marginTop: '6px' }}>
              Spaces will appear here once they're created.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {spaces.map((space) => (
              <div key={space.id} className="space-card">
                {/* Thumbnail */}
                <div
                  style={{
                    aspectRatio: '16/9',
                    background: '#f0e8ff',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '3px solid #1f1f1f',
                  }}
                >
                  {space.thumbnail ? (
                    <img
                      src={space.thumbnail}
                      alt={space.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '48px' }}>🎮</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px' }}>
                  <p
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 700,
                      fontSize: '18px',
                      margin: '0 0 12px 0',
                      color: '#1f1f1f',
                    }}
                  >
                    {space.name}
                  </p>

                  <button
                    id={`enter-space-${space.id}`}
                    onClick={() => handleEnterSpace(space.id, space.name)}
                    className="kawaii-btn kawaii-btn-yellow"
                    style={{ width: '100%', fontSize: '14px', padding: '10px 20px' }}
                  >
                    🚀 Enter Space
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}