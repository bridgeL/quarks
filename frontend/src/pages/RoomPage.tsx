import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { endGame, getRoom, joinRoom, leaveRoom, startGame, type RoomResponse } from '../api/roomApi'
import { useAuth } from '../contexts/AuthContext'
import wsService from '../services/wsService'
import PlayerProgressBar from '../components/PlayerProgressBar'
import UserCard from '../components/UserCard'

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
              return (
                <PlayerProgressBar
                  key={player.player_id}
                  player={player}
                  currentUser={nickname ?? ''}
                  emojiStats={emojiStats}
                  total={total}
                />
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
            <UserCard key={user.user_id} user={user} currentUserNickname={nickname ?? ''} />
          ))}
        </div>
      </section>
    </main>
  )
}

function buildEmojiStats(userIndex: number): Array<{ emoji: string; value: number }> {
  const presets = [
    { apple: 3, lightning: 1, shield: 1 },
    { apple: 2, lightning: 2, shield: 0 },
    { apple: 1, lightning: 1, shield: 2 },
    { apple: 3, lightning: 0, shield: 1 },
    { apple: 2, lightning: 2, shield: 2 },
  ]
  const preset = presets[userIndex % presets.length]
  return [
    { emoji: GAME_EMOJIS[0], value: preset.apple },
    { emoji: GAME_EMOJIS[1], value: preset.lightning },
    { emoji: GAME_EMOJIS[2], value: preset.shield },
  ]
}
