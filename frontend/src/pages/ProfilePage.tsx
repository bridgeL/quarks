import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMe, updateProfile } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [isAutoRegistered, setIsAutoRegistered] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { updateProfile: syncProfile } = useAuth()

  const passwordHint = useMemo(() => {
    return isAutoRegistered
      ? '当前为游客账号，首次设置密码无需填写旧密码。'
      : '修改密码需要填写旧密码。'
  }, [isAutoRegistered])

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const data = await getMe()
      setUsername(data.username)
      setNickname(data.nickname)
      setIsAutoRegistered(data.is_auto_registered)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload: { nickname?: string; old_password?: string; password?: string } = {}
    if (nickname.trim()) {
      payload.nickname = nickname.trim()
    }
    if (oldPassword) {
      payload.old_password = oldPassword
    }
    if (password) {
      payload.password = password
    }

    try {
      const data = await updateProfile(payload)
      setUsername(data.username)
      setNickname(data.nickname)
      setIsAutoRegistered(data.is_auto_registered)
      syncProfile(data.username, data.nickname)
      setOldPassword('')
      setPassword('')
      setSuccess('个人信息已更新')
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新个人信息失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <section className="panel hero profile-hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">Quarks</p>
            <h1>个人信息</h1>
            <p className="subtitle">查看当前账号资料，并更新昵称或密码。</p>
          </div>
          <div className="profile-actions">
            <Link to="/" className="profile-link-button">
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>账号信息</h2>
          <button type="button" className="secondary" onClick={() => void loadProfile()} disabled={loading || submitting}>
            刷新
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {success ? <div className="success">{success}</div> : null}
        {loading ? <div className="empty">加载中...</div> : null}

        {!loading ? (
          <div className="profile-details">
            <div className="profile-item">
              <span className="profile-label">用户名</span>
              <span className="profile-value">{username}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">当前昵称</span>
              <span className="profile-value">{nickname}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">账号类型</span>
              <span className="profile-value">{isAutoRegistered ? '游客账号' : '普通用户'}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>更新资料</h2>
        <p className="subtitle profile-subtitle">{passwordHint}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="nickname">昵称</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="输入新的昵称"
            />
          </div>

          {!isAutoRegistered ? (
            <div className="form-field">
              <label htmlFor="old-password">旧密码</label>
              <input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="输入旧密码"
                autoComplete="current-password"
              />
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor="new-password">新密码</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入新密码"
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={submitting || loading}>
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </form>
      </section>
    </main>
  )
}
