import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Space } from '../lib/types';
import { useAuthStore } from '../lib/store';
import { LobbyScene } from '../game/scenes/LobbyScene';

// ── design tokens ─────────────────────────────────────────────────────
const CARD_BG     = '#fffdf7';
const BORDER      = '#1f1f1f';
const SHADOW      = '5px 5px 0px #1f1f1f';
const FONT        = "'Nunito', sans-serif";
const HEADING     = "'Baloo 2', sans-serif";
const PINK        = '#FFD6EA';
const PURPLE      = '#c8a8ff';
const MINT        = '#DDF5BE';
const YELLOW      = '#ffe066';

// Feature bullets for the left panel
const FEATURES = [
  {
    emoji: '🏠',
    title: 'Your own hangout spot',
    desc: 'Be in the same virtual room as your friends — no matter where on the planet you actually are.',
  },
  {
    emoji: '🎨',
    title: 'Decorate your space',
    desc: "Drop desks, plants, whiteboards, and more. Make the room actually feel like yours.",
  },
  {
    emoji: '💬',
    title: 'Chat in real-time',
    desc: 'Every space has a live chat panel. Say hi, share ideas, or just vibe together.',
  },
  {
    emoji: '👾',
    title: 'See who\'s around',
    desc: 'Spot your friends roaming the space — their little avatars give them away every time.',
  },
  {
    emoji: '🕹️',
    title: 'Move around freely',
    desc: 'Walk through the space using arrow keys or WASD. It genuinely feels like being there.',
  },
];

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout   = useAuthStore((state) => state.logout);
  const user     = useAuthStore((state) => state.user);

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

  useEffect(() => { fetchSpaces(); }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const handleEnterSpace = (spaceId: string, spaceName: string) => {
    navigate(`/space/${spaceId}`);
    const tryEnter = (attempts = 0) => {
      if (attempts > 20) { console.error('LobbyScene never became available'); return; }
      const game  = (window as any).__phaserGame as Phaser.Game | undefined;
      const lobby = game?.scene.getScene('LobbyScene') as LobbyScene | undefined;
      if (lobby?.scene.isActive()) {
        lobby.enterSpace(spaceName.toLowerCase());
      } else {
        setTimeout(() => tryEnter(attempts + 1), 300);
      }
    };
    setTimeout(() => tryEnter(), 300);
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="kawaii-card" style={{ padding: '36px 56px', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }}>🎮</div>
          <p style={{ fontFamily: HEADING, fontWeight: 700, fontSize: '18px', color: '#666', margin: 0 }}>
            Loading your spaces...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ══════════════════════════════════════════════════════════
            TOP BAR
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: CARD_BG,
            border: `3px solid ${BORDER}`,
            borderRadius: '20px',
            boxShadow: SHADOW,
            padding: '18px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Left — brand */}
          <div>
            <h1
              style={{
                fontFamily: HEADING,
                fontWeight: 800,
                fontSize: '28px',
                color: '#1f1f1f',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              🕹️ Pixelley
            </h1>
            <p
              style={{
                fontFamily: FONT,
                fontSize: '13px',
                color: '#888',
                margin: '4px 0 0 0',
                fontWeight: 600,
              }}
            >
              Your pixel alley on the internet ✨
            </p>
          </div>

          {/* Right — logout */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <button
              id="dashboard-logout"
              onClick={handleLogout}
              className="kawaii-btn kawaii-btn-danger"
              style={{ fontSize: '14px', padding: '10px 22px' }}
            >
              👋 Logout
            </button>
            <p style={{ fontFamily: FONT, fontSize: '12px', color: '#aaa', margin: 0, fontWeight: 600 }}>
              Come back soon, okay? 🌸
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TWO-PANEL BODY
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* ── LEFT PANEL: What you can do ── */}
          <div
            style={{
              background: CARD_BG,
              border: `3px solid ${BORDER}`,
              borderRadius: '20px',
              boxShadow: SHADOW,
              overflow: 'hidden',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                background: PURPLE,
                borderBottom: `3px solid ${BORDER}`,
                padding: '16px 22px',
              }}
            >
              <h2
                style={{
                  fontFamily: HEADING,
                  fontWeight: 800,
                  fontSize: '18px',
                  color: '#1f1f1f',
                  margin: 0,
                }}
              >
                What's waiting for you 🌈
              </h2>
              <p style={{ fontFamily: FONT, fontSize: '12px', color: '#555', margin: '3px 0 0 0', fontWeight: 600 }}>
                Everything Pixelley has to offer
              </p>
            </div>

            {/* Feature list */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    background: i % 2 === 0 ? '#fdf6ff' : '#f6fff8',
                    border: `2px solid ${BORDER}`,
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '3px 3px 0px #1f1f1f',
                  }}
                >
                  {/* Emoji badge */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      border: `2px solid ${BORDER}`,
                      background: i % 2 === 0 ? PURPLE : MINT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {f.emoji}
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: HEADING,
                        fontWeight: 700,
                        fontSize: '14px',
                        color: '#1f1f1f',
                        margin: '0 0 2px 0',
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: '12px',
                        color: '#666',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL: Enter a space ── */}
          <div
            style={{
              background: CARD_BG,
              border: `3px solid ${BORDER}`,
              borderRadius: '20px',
              boxShadow: SHADOW,
              overflow: 'hidden',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                background: PINK,
                borderBottom: `3px solid ${BORDER}`,
                padding: '16px 22px',
              }}
            >
              <h2
                style={{
                  fontFamily: HEADING,
                  fontWeight: 800,
                  fontSize: '18px',
                  color: '#1f1f1f',
                  margin: 0,
                }}
              >
                Enter a space & have fun! 🚀
              </h2>
              <p style={{ fontFamily: FONT, fontSize: '13px', color: '#555', margin: '4px 0 0 0', fontWeight: 600 }}>
                Hey{user?.name ? <> <strong style={{ color: '#a87fff' }}>{user.name}</strong></> : ''} 👋 where are you hanging today?
              </p>
            </div>

            {/* Spaces */}
            <div style={{ padding: '20px' }}>
              {spaces.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '52px', marginBottom: '14px' }}>🌟</div>
                  <p style={{ fontFamily: HEADING, fontWeight: 700, fontSize: '18px', color: '#999', margin: 0 }}>
                    No spaces yet!
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: '13px', color: '#bbb', marginTop: '6px' }}>
                    Spaces will appear here once they're created.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '18px',
                  }}
                >
                  {spaces.map((space) => (
                    <div
                      key={space.id}
                      className="space-card"
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          aspectRatio: '16/9',
                          background: '#f0e8ff',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: `3px solid ${BORDER}`,
                        }}
                      >
                        {space.thumbnail ? (
                          <img
                            src={space.thumbnail}
                            alt={space.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '40px' }}>🎮</span>
                        )}
                      </div>

                      {/* Space name + CTA */}
                      <div style={{ padding: '14px 16px' }}>
                        <p
                          style={{
                            fontFamily: HEADING,
                            fontWeight: 700,
                            fontSize: '16px',
                            color: '#1f1f1f',
                            margin: '0 0 4px 0',
                          }}
                        >
                          {space.name}
                        </p>
                        <p style={{ fontFamily: FONT, fontSize: '12px', color: '#999', margin: '0 0 12px 0', fontWeight: 600 }}>
                          Tap in and start exploring →
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
        </div>

      </div>
    </div>
  );
}