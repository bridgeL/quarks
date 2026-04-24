interface UserCardProps {
  user: {
    user_id: string
    nickname: string
    username: string
    is_auto_registered: boolean
  }
  currentUserNickname: string
}

export default function UserCard({ user, currentUserNickname }: UserCardProps) {
  return (
    <article className={`user-card${user.is_auto_registered ? ' user-card-guest' : ''}`}>
      <div className={`user-card-avatar${user.is_auto_registered ? ' user-card-avatar-guest' : ''}`}>
        {user.nickname.charAt(0).toUpperCase()}
      </div>
      <div className="user-card-info">
        <div className="user-card-name">
          {user.nickname}
          {user.nickname === currentUserNickname && <span className="user-card-you">（你）</span>}
          {user.is_auto_registered && <span className="user-card-guest-badge">游客</span>}
        </div>
        <div className="user-card-username">{user.username}</div>
      </div>
    </article>
  )
}
