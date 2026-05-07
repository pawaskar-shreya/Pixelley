import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/store';

export default function Signin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setToken = useAuthStore(state => state.setToken);
  const setUser = useAuthStore(state => state.setUser);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.signin({ username, password });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      navigate('/dashboard');
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
        {/* Logo / title area */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '8px' }}>🎮</div>
          <h1
            className="kawaii-heading"
            style={{ fontSize: '30px', margin: 0 }}
          >
            Welcome back!
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#555', fontSize: '15px', fontWeight: 600, marginTop: '6px' }}>
            Sign in to continue hanging out ✨
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
            😣 Oops! Please sign up first.
          </div>
        )}

        <form onSubmit={handleSignin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Username */}
          <div>
            <label className="kawaii-label">🌸 Username</label>
            <input
              id="signin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="kawaii-input"
              placeholder="your email id"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="kawaii-label">🔒 Password</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="kawaii-input"
              placeholder="your secret password"
              required
            />
          </div>

          <button
            id="signin-submit"
            type="submit"
            className="kawaii-btn kawaii-btn-purple"
            style={{ width: '100%', marginTop: '4px' }}
          >
            🕹️ Lesssgo!
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '22px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            color: '#444',
          }}
        >
          New here?{' '}
          <Link
            to="/signup"
            style={{
              color: '#8855ee',
              fontWeight: 800,
              textDecoration: 'none',
              borderBottom: '2.5px solid #8855ee',
            }}
          >
            Create an account 🌟
          </Link>
        </p>
      </div>
    </div>
  );
}