import { useNavigate } from 'react-router-dom'

import { getMe } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { logout, nickname } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      const currentUser = await getMe()
      if (currentUser.is_auto_registered) {
        const confirmed = window.confirm('当前是游客账号，退出登录后将无法找回该账号，确定继续退出吗？')
        if (!confirmed) {
          return
        }
      }
    } finally {
      logout()
      navigate('/login')
    }
  }

  function handleOpenProfile() {
    navigate('/profile')
  }

  return (
    <main className="page">
      <section className="panel hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Quarks</p>
            <h1>主页</h1>
            <p className="subtitle">这里暂时留空，后续会添加新的功能模块。</p>
          </div>
          <div className="user-info">
            <span className="username">{nickname}</span>
            <button type="button" className="secondary" onClick={handleOpenProfile}>
              个人信息
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/lobby')}>
              房间大厅
            </button>
            <button type="button" className="logout-btn" onClick={() => void handleLogout()}>
              退出登录
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="empty">敬请期待</div>
      </section>
    </main>
  )
}
