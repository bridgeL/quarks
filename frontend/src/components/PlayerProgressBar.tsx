import type { RoomPlayerInfo } from '../api/roomApi'

const TARGET_SCORE = 7

interface EmojiStat {
  emoji: string
  value: number
}

interface PlayerProgressBarProps {
  player: RoomPlayerInfo
  currentUser: string
  emojiStats: EmojiStat[]
  total: number
}

export default function PlayerProgressBar({ player, currentUser, emojiStats, total }: PlayerProgressBarProps) {
  const progressPercent = Math.min((total / TARGET_SCORE) * 100, 100)

  return (
    <article className="game-progress-card">
      <div className="game-progress-header">
        <div className="game-progress-user">
          <span className="game-progress-name">{player.nickname}</span>
          {player.nickname === currentUser ? <span className="user-card-you">（你）</span> : null}
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
        <div className="game-progress-fill" style={{ width: `${progressPercent}%` }}>
          {total > 0 && (
            <span className="game-progress-fill-text">
              {emojiStats.filter((item) => item.value > 0).map((item) => `${item.emoji}${item.value}`).join(' ')}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
