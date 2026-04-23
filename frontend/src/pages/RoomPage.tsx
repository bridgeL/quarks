import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getRoom, joinRoom, leaveRoom, startGame, endGame, type RoomResponse } from '../api/roomApi'
import wsService from '../services/wsService'
import { useAuth } from '../contexts/AuthContext'

export default function RoomPage() {
  const { room_id } = useParams<{ room_id: string }>()
  const [room, setRoom] = useState<RoomResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { nickname } = useAuth()
  const navigate = useNavigate()
  const roomRef = useRef<RoomResponse | null>(null)
  roomRef.current = room

  async function loadRoom() {
    if (!room_id) return
    try {
      await joinRoom(room_id)
      const data = await getRoom(room_id)
      setRoom(data)
      roomRef.current = data
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入房间失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!room_id) return

    async function init() {
      await loadRoom()
      wsService.setMessageHandler((data) => {
        const msg = data as { type: string; user_id?: string; username?: string; nickname?: string; is_auto_registered?: boolean }
        if (msg.type === 'user_joined') {
          setRoom((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              users: [
                ...prev.users.filter((u) => u.user_id !== msg.user_id),
                { user_id: msg.user_id!, username: msg.username!, nickname: msg.nickname!, is_auto_registered: msg.is_auto_registered! },
              ],
            }
          })
        } else if (msg.type === 'user_left') {
          setRoom((prev) =>
            prev ? { ...prev, users: prev.users.filter((u) => u.user_id !== msg.user_id) } : prev
          )
        } else if (msg.type === 'game_started') {
          setRoom((prev) => prev ? { ...prev, status: 'playing' } : prev)
        } else if (msg.type === 'game_ended') {
          setRoom((prev) => prev ? { ...prev, status: 'preparing' } : prev)
        }
      })
    }
    void init()

    return () => {
      wsService.setMessageHandler(null)
    }
  }, [room_id])

  async function handleLeave() {
    if (!room_id) return
    try {
      await leaveRoom(room_id)
      navigate('/lobby')
    } catch (err) {
      setError(err instanceof Error ? err.message : '离开房间失败')
    }
  }

  async function handleStartGame() {
    if (!room_id) return
    try {
      await startGame(room_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '开始游戏失败')
    }
  }

  async function handleEndGame() {
    if (!room_id) return
    try {
      await endGame(room_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束游戏失败')
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="empty">加载中...</div>
      </main>
    )
  }

  if (error || !room) {
    return (
      <main className="page">
        <section className="panel hero">
          <div className="hero-content">
            <div>
              <p className="eyebrow">Quarks</p>
              <h1>房间加入失败</h1>
              <p className="subtitle">{error || '无法找到该房间'}</p>
            </div>
            <div className="user-info">
              <button type="button" className="secondary" onClick={() => navigate('/lobby')}>
                返回大厅
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">房间号: {room.room_id}</p>
            <h1>{room.name}</h1>
            <p className="subtitle">状态: {room.status === 'preparing' ? '准备中' : '游戏中'}</p>
          </div>
          <div className="user-info">
            <span className="username">{nickname}</span>
            {room.status === 'preparing' ? (
              <button
                type="button"
                className="primary"
                onClick={() => void handleStartGame()}
                disabled={room.users.length < 2 || room.users.length > 5}
                title={room.users.length < 2 ? '需要至少2人' : room.users.length > 5 ? '最多5人' : '开始游戏'}
              >
                开始游戏
              </button>
            ) : (
              <button type="button" className="secondary" onClick={() => void handleEndGame()}>
                结束游戏
              </button>
            )}
            <button type="button" className="danger" onClick={() => void handleLeave()}>
              离开房间
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>在线用户 ({room.users.length})</h2>
        {error ? <div className="error">{error}</div> : null}
        <div className="user-list-grid">
          {room.users.map((user) => (
            <article key={user.user_id} className={`user-card${user.is_auto_registered ? ' user-card-guest' : ''}`}>
              <div className={`user-card-avatar${user.is_auto_registered ? ' user-card-avatar-guest' : ''}`}>
                {user.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="user-card-info">
                <div className="user-card-name">
                  {user.nickname}
                  {user.nickname === nickname && <span className="user-card-you">（你）</span>}
                  {user.is_auto_registered && <span className="user-card-guest-badge">游客</span>}
                </div>
                <div className="user-card-username">{user.username}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
