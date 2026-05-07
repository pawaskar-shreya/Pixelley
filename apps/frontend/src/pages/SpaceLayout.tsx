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