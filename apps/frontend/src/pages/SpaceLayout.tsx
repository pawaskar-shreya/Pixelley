// SpaceLayout.tsx
import { Outlet } from 'react-router-dom'
import GlobalChat from './GlobalChat'
import { useParams } from 'react-router-dom'

export default function SpaceLayout() {
  const { spaceId } = useParams()

  return (
    <div style={{ display: 'flex', width: '1920px', height: '1080px' }}>
      <div id="game-container" style={{ width: '1420px', height: '1080px' }}>
        <Outlet />
      </div>

      {spaceId && <GlobalChat spaceId={spaceId} />}
    </div>
  )
}