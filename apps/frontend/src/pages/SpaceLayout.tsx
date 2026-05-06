import { Outlet } from 'react-router-dom'
import SideChatPanel from '../components/game/SideChatPanel'
import { useParams } from 'react-router-dom'

export default function SpaceLayout() {
  const { spaceId } = useParams()

  return (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      background: '#0f0f0f',
    }}
  >
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-evenly',
        alignItems: 'center',
      }}
    >
      {spaceId && <SideChatPanel spaceId={spaceId} />}

      <div
        id="space-container"
        style={{
          width: '1200px',
          height: '800px',
          outline: '5px solid red',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Outlet />
      </div>
    </div>
  </div>
);
}