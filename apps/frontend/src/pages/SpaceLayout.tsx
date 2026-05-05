import { Outlet } from 'react-router-dom'
import GlobalChat from './GlobalChat'
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
        gap: '40px',
      }}
    >
      {spaceId && <GlobalChat spaceId={spaceId} />}

      <div
        id="space-container"
        style={{
          width: '1200px',
          height: '800px',
          boxSizing: 'border-box',
          border: '5px solid red',
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