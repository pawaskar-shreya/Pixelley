import { useEffect, useRef, useState } from 'react';
import { wsClient, ChatPayload } from '../../lib/wsClient';
import { useAuthStore } from '../../lib/store';
import { Send } from 'lucide-react';

interface Props {
  spaceId: string;
}

export default function SideChatPanel({ spaceId }: Props) {
  const [messages, setMessages] = useState<ChatPayload[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleChat = (data: ChatPayload) => {
      setMessages((prev) => [...prev, data]);
    };
    wsClient.on('chat', handleChat);
    return () => wsClient.off('chat', handleChat);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    wsClient.sendChat(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
    e.stopPropagation(); // prevent WASD reaching Phaser
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        width: '450px',
        height: '800px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fffdf7',
        border: '3px solid #1f1f1f',
        borderRadius: '24px',
        boxShadow: '6px 6px 0px #1f1f1f',
        overflow: 'hidden',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Header - Retro RPG style */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '3px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          background: '#FFD6EA',
        }}
      >
        <span style={{ fontSize: '22px' }}>💬</span>
        <span
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: '18px',
            color: '#1f1f1f',
            letterSpacing: '0.3px',
          }}
        >
          Space Chat
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontWeight: 700,
            background: '#fffdf7',
            border: '2px solid #1f1f1f',
            borderRadius: '99px',
            padding: '2px 10px',
            color: '#555',
          }}
        >
          OFFICE
        </span>
      </div>

      {/* Messages */}
      <div className="chat-messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '40px',
              color: '#bbb',
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🌸</div>
            No messages yet!
            <br />
            <span style={{ fontSize: '12px', color: '#ccc' }}>Say hello to everyone 👋</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                gap: '3px',
              }}
            >
              {/* Sender name (only for others) */}
              {!isMe && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#a87fff',
                    marginLeft: '6px',
                    fontFamily: "'Baloo 2', sans-serif",
                  }}
                >
                  {msg.username}
                </span>
              )}

              {/* Bubble*/}
              <div className={isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}
                style={{
                  maxWidth: '82%',
                  padding: '9px 14px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#1f1f1f',
                  wordBreak: 'break-word',
                }}
              >
                {msg.message}
              </div>

              {/* Timestamp */}
              <span
                style={{
                  fontSize: '10px',
                  color: '#bbb',
                  marginTop: '1px',
                  marginLeft: isMe ? 0 : '6px',
                  marginRight: isMe ? '6px' : 0,
                }}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input Area*/}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
          borderTop: '3px solid #1f1f1f',
          background: '#f9f4ff',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>&gt;</span>
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          placeholder="Say something cute... 🌸"
          className="kawaii-input"
          style={{ flex: 1, fontSize: '14px', padding: '9px 14px' }}
        />
        <button
          id="chat-send"
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            width: '42px',
            height: '42px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: input.trim()
              ? 'linear-gradient(145deg, #c8a8ff, #a87fff)'
              : '#e8e8e8',
            border: '2.5px solid #1f1f1f',
            borderRadius: '12px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            boxShadow: input.trim() ? '3px 3px 0px #1f1f1f' : 'none',
            transition: 'all 0.1s ease',
          }}
          onMouseDown={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = '1px 1px 0px #1f1f1f';
            e.currentTarget.style.transform = 'translate(2px, 2px)';
          }}
          onMouseUp={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = '3px 3px 0px #1f1f1f';
            e.currentTarget.style.transform = 'none';
          }}
          onMouseLeave={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = '3px 3px 0px #1f1f1f';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Send size={18} color={input.trim() ? '#fff' : '#aaa'} />
        </button>
      </div>
    </div>
  );
}