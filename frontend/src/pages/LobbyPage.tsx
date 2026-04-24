import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createRoom, listRooms, type RoomListItem } from '../api/roomApi'
import { useAuth } from '../contexts/AuthContext'
import RoomCard from '../components/RoomCard'

export default function LobbyPage() {
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState('')

  const { nickname } = useAuth()
  const navigate = useNavigate()

  async function loadRooms() {
    setLoading(true)
    try {
      const data = await listRooms()
      setRooms(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载房间列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRooms()
    const timer = setInterval(() => {
      void loadRooms()
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const room = await createRoom(roomName.trim() || undefined)
      navigate(`/room/${room.room_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建房间失败')
    } finally {
      setCreating(false)
    }
  }

  function handleJoin(roomId: string) {
    navigate(`/room/${roomId}`)
  }

  return (
    <main className="page">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Quarks</p>
            <h1>房间大厅</h1>
            <p className="subtitle">创建房间或加入已有房间</p>
          </div>
          <div className="user-info">
            <span className="username">{nickname}</span>
            <button type="button" className="secondary" onClick={() => navigate('/')}>
              返回主页
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>创建房间</h2>
        <div className="create-form">
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="房间名（留空自动生成）"
          />
          <button type="button" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? '创建中...' : '创建房间'}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>加入房间</h2>
        <div className="create-form">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            placeholder="输入房间号"
          />
          <button type="button" onClick={() => joinId.trim() && handleJoin(joinId.trim())} disabled={!joinId.trim()}>
            加入
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>当前在线房间</h2>
          <button type="button" className="secondary" onClick={() => void loadRooms()} disabled={loading}>
            刷新
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="empty">加载中...</div> : null}
        {!loading && rooms.length === 0 ? <div className="empty">暂无可用房间</div> : null}

        <div className="room-list">
          {rooms.map((room) => (
            <RoomCard key={room.room_id} room={room} onJoin={handleJoin} />
          ))}
        </div>
      </section>
    </main>
  )
}
