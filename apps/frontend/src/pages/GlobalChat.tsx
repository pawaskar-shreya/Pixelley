interface Props {
  spaceId: string
}

export default function GlobalChat({ spaceId }: Props) {

  return (
  <div
    style={{
      width: '450px',
      height: '800px',
      outline: '5px solid red',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      background: '#111',
      color: 'white',
    }}
  >
    <h2>Chat for the {spaceId}</h2>

    <div className="messages">...</div>

    <input placeholder="Type a message..." />
  </div>
);
}