import { useEffect, useRef, useState } from 'react';
import { wsClient, ChatPayload } from '../../lib/wsClient';
import { useAuthStore } from '../../lib/store';
import { Send, MessageSquare } from 'lucide-react';

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
        background: '#111118',
        borderLeft: '4px solid #2a2a35',
        fontFamily: "'Pixelify Sans', sans-serif", // Gamified Font
        imageRendering: 'pixelated',
      }}
    >
      {/* Header - Retro RPG style */}
      <div
        style={{
          padding: '16px',
          borderBottom: '4px solid #2a2a35',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          background: '#1a1a24',
          boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
        }}
      >
        <MessageSquare size={20} color="#4ade80" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' }} />
        <span style={{ 
          color: '#4ade80', 
          fontWeight: 700, 
          fontSize: '18px',
          textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
          letterSpacing: '1px'
        }}>
          CHAT LOG
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#a1a1aa',
            background: '#09090b',
            border: '2px solid #3f3f46',
            padding: '4px 8px',
          }}
        >
          ROOM:{spaceId.slice(0, 4).toUpperCase()}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#4ade80 #111118',
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              color: '#52525b',
              fontSize: '14px',
              textAlign: 'center',
              marginTop: '32px',
              textTransform: 'uppercase',
            }}
          >
            [ System: No logs found ]
          </p>
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
                gap: '4px',
              }}
            >
              {/* Meta line */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                }}
              >
                {!isMe && (
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#f472b6',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.8)'
                    }}
                  >
                    &lt;{msg.username}&gt;
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#52525b', fontFamily: "'VT323', monospace" }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>

              {/* Bubble - Retro Box */}
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  background: isMe ? '#2563eb' : '#27272a',
                  border: isMe ? '2px solid #60a5fa' : '2px solid #52525b',
                  borderTopColor: isMe ? '#93c5fd' : '#71717a',
                  borderLeftColor: isMe ? '#93c5fd' : '#71717a',
                  color: 'white',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.4)',
                }}
              >
                {msg.message}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input - Console Style */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderTop: '4px solid #2a2a35',
          background: '#1a1a24',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          placeholder="ENTER TEXT..."
          style={{
            flex: 1,
            background: '#09090b',
            border: '2px solid #3f3f46',
            borderBottomColor: '#71717a',
            borderRightColor: '#71717a',
            padding: '10px',
            color: '#4ade80',
            fontSize: '14px',
            outline: 'none',
            fontFamily: "'VT323', monospace",
            textTransform: 'uppercase',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#4ade80')}
          onBlur={(e) => {
            e.target.style.borderColor = '#3f3f46';
            e.target.style.borderBottomColor = '#71717a';
            e.target.style.borderRightColor = '#71717a';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            width: '42px',
            height: '42px',
            background: input.trim() ? '#2563eb' : '#27272a',
            border: input.trim() ? '2px solid #60a5fa' : '2px solid #52525b',
            borderTopColor: input.trim() ? '#93c5fd' : '#71717a',
            borderLeftColor: input.trim() ? '#93c5fd' : '#71717a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            boxShadow: '2px 2px 0px rgba(0,0,0,0.5)',
          }}
          onMouseDown={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translate(2px, 2px)';
          }}
          onMouseUp={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)';
            e.currentTarget.style.transform = 'none';
          }}
          onMouseLeave={(e) => {
            if (!input.trim()) return;
            e.currentTarget.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.5)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Send size={18} color={input.trim() ? "white" : "#a1a1aa"} />
        </button>
      </div>
    </div>
  );
}