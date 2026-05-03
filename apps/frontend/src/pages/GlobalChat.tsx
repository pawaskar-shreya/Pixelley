interface Props {
  spaceId: string
}

export default function GlobalChat({ spaceId }: Props) {
  // spaceId drives which chat room/history to load
  // e.g. socket joins room `chat:${spaceId}`
  // chat history fetched from /api/chat/${spaceId}

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2>Chat — {spaceId}</h2>
      <div className="messages">...</div>
      <input placeholder="Type a message..." />
    </div>
  )
}