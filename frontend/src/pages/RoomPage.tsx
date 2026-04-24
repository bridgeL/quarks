import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { endGame, getRoom, joinRoom, leaveRoom, startGame, type RoomPlayerInfo, type RoomResponse } from '../api/roomApi'
import { useAuth } from '../contexts/AuthContext'
import wsService from '../services/wsService'

const TARGET_SCORE = 7
const GAME_EMOJIS = ['🍎', '⚡', '🛡️'] as const

export default function RoomPage() {
  const { room_id } = useParams<{ room_id: string }>()
  const [room, setRoom] = useState<RoomResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { nickname } = useAuth()
  const navigate = useNavigate()
  const roomRef = useRef<RoomResponse | null>(null)
  roomRef.current = room

  async function loadRoom(options?: { join?: boolean }) {
    if (!room_id) return
    try {
      if (options?.join !== false) {
        await joinRoom(room_id)
      }
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
        const msg = data as { type: string }
        if (msg.type === 'user_joined' || msg.type === 'user_left' || msg.type === 'game_started' || msg.type === 'game_ended') {
          void loadRoom({ join: false })
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
      await loadRoom({ join: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : '开始游戏失败')
    }
  }

  async function handleEndGame() {
    if (!room_id) return
    try {
      await endGame(room_id)
      await loadRoom({ join: false })
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

  const gamePlayers = room.game?.players ?? []

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

      {room.status === 'playing' ? (
        <section className="panel">
          <div className="section-header">
            <h2>游戏区域</h2>
            <span className="game-target">目标 {TARGET_SCORE}</span>
          </div>
          <div className="game-progress-list">
            {gamePlayers.map((player, index) => {
              const emojiStats = buildEmojiStats(index)
              const total = emojiStats.reduce((sum, item) => sum + item.value, 0)
              const progressPercent = Math.min((total / TARGET_SCORE) * 100, 100)
              return (
                <article key={player.player_id} className="game-progress-card">
                  <div className="game-progress-header">
                    <div className="game-progress-user">
                      <span className="game-progress-name">{player.nickname}</span>
                      {player.nickname === nickname ? <span className="user-card-you">（你）</span> : null}
                      {player.left_at ? <span className="user-card-guest-badge">已离场</span> : null}
                    </div>
                    <span className="game-progress-username">{player.username}</span>
                  </div>
                  <div className="game-progress-row">
                    <div className="game-emoji-group">
                      {emojiStats.map((item) => (
                        <span key={`${player.player_id}-${item.emoji}`} className="game-emoji-pill">
                          <span className="game-emoji-icon">{item.emoji}</span>
                          <span className="game-emoji-value">{item.value}</span>
                        </span>
                      ))}
                    </div>
                    <div className="game-score-box">
                      <span className="game-score-current">{total}</span>
                      <span className="game-score-divider">/</span>
                      <span className="game-score-target">{TARGET_SCORE}</span>
                    </div>
                  </div>
                  <div className="game-progress-track">
                    <div className="game-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

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

function buildEmojiStats(userIndex: number): Array<{ emoji: string; value: number }> {
  const base = userIndex % TARGET_SCORE
  const values = [
    Math.min(base + 1, 3),
    Math.min(Math.max(base - 1, 0), 2),
    Math.min(Math.max(base - 3, 0), 2),
  ]

  return GAME_EMOJIS.map((emoji, index) => ({ emoji, value: values[index] ?? 0 }))
}
