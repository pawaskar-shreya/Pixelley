import { Outlet } from 'react-router-dom'
import GlobalChat from './GlobalChat'
import { useParams } from 'react-router-dom'

export default function SpaceLayout() {
  const { spaceId } = useParams()

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', width: '1920px', height: '1080px', alignItems:'center', justifyContent: 'space-evenly', }}>
      {spaceId && <GlobalChat spaceId={spaceId} />}

      <div id="space-container" style={{ height: '800px', width: '1200px', border: '5px solid red', flexShrink: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}