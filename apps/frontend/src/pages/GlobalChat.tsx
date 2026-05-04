interface Props {
  spaceId: string
}

export default function GlobalChat({ spaceId }: Props) {
  // spaceId drives which chat room/history to load

  return (
    <div style={{ height: '800px', width: '500px', border: '5px solid red', display: 'flex', flexDirection: 'column', flexShrink: 0, }}>
      <h2>Chat — {spaceId}</h2>
      <div className="messages">...</div>
      <input placeholder="Type a message..." />
    </div>
  )
}