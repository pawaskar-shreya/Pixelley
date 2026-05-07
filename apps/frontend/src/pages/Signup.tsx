import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.signup({ name, username, password, gender });
      navigate('/signin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="kawaii-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 36px',
        }}
      >
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '8px' }}>⭐</div>
          <h1
            className="kawaii-heading"
            style={{ fontSize: '30px', margin: 0 }}
          >
            Join Pixelley!
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#888', fontSize: '14px', marginTop: '6px' }}>
            Create your player profile 🌈
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fff0f3',
              border: '2.5px solid #1f1f1f',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '18px',
              color: '#d63b6f',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '3px 3px 0px #1f1f1f',
            }}
          >
            😬 {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label className="kawaii-label">💛 Name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="kawaii-input"
              placeholder="your display name"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="kawaii-label">🌸 Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="kawaii-input"
              placeholder="pick a cool username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="kawaii-label">🔒 Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kawaii-input"
              placeholder="secret password"
              required
            />
          </div>

          {/* Gender */}
          <div style={{ position: 'relative' }}>
            <label className="kawaii-label">🎀 Avatar Type</label>
            <select
              id="signup-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="kawaii-select"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
            {/* Custom arrow */}
            <span
              style={{
                position: 'absolute',
                right: '14px',
                bottom: '12px',
                pointerEvents: 'none',
                fontSize: '14px',
              }}
            >
              ▾
            </span>
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="kawaii-btn kawaii-btn-pink"
            style={{ width: '100%', marginTop: '4px' }}
          >
            🎉 Create Account
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '22px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '14px',
            color: '#666',
          }}
        >
          Already a player?{' '}
          <Link
            to="/signin"
            style={{
              color: '#a87fff',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '2px solid #a87fff',
            }}
          >
            Sign In 🕹️
          </Link>
        </p>
      </div>
    </div>
  );
}
