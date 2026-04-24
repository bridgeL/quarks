import type { RoomListItem } from '../api/roomApi'

interface RoomCardProps {
  room: RoomListItem
  onJoin: (roomId: string) => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString()
}

export default function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <article className="room-card">
      <div className="room-card-header">
        <span className="room-name">{room.name}</span>
        <span className="room-id-badge">{room.room_id}</span>
      </div>
      <div className="room-card-meta">
        <span className="room-avatar">{room.created_by_nickname}</span>
        <span className="room-dot">·</span>
        <span>{room.user_count} 人在线</span>
        <span className="room-dot">·</span>
        <span>{room.status === 'preparing' ? '准备中' : '游戏中'}</span>
        <span className="room-dot">·</span>
        <span>{formatTime(room.created_at)}</span>
      </div>
      <div className="room-card-footer">
        <button type="button" className="room-join-btn" onClick={() => void onJoin(room.room_id)}>
          加入房间
        </button>
      </div>
    </article>
  )
}
