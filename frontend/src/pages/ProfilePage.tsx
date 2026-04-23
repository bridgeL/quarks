import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMe, updateProfile } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [isAutoRegistered, setIsAutoRegistered] = useState(false)
  const [createdAt, setCreatedAt] = useState<number | null>(null)
  const [lastLoginAt, setLastLoginAt] = useState<number | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const createdAtText = useMemo(() => formatTimestamp(createdAt), [createdAt])
  const lastLoginAtText = useMemo(() => formatTimestamp(lastLoginAt), [lastLoginAt])

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
      setCreatedAt(data.created_at)
      setLastLoginAt(data.last_login_at)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password && password !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    setSubmitting(true)

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
      setCreatedAt(data.created_at)
      setLastLoginAt(data.last_login_at)
      syncProfile(data.username, data.nickname)
      setOldPassword('')
      setPassword('')
      setConfirmPassword('')
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
        <h2>账号信息</h2>

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
            <div className="profile-item">
              <span className="profile-label">创建时间</span>
              <span className="profile-value">{createdAtText}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">最近登录时间</span>
              <span className="profile-value">{lastLoginAtText}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>更新资料</h2>
        <p className="subtitle profile-subtitle">{passwordHint}</p>

        {error ? <div className="error">{error}</div> : null}
        {success ? <div className="success">{success}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">用户名</label>
            <div className="readonly-input-wrapper">
              <input
                id="username"
                className="readonly-input"
                type="text"
                value={username}
                autoComplete="username"
                readOnly
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="nickname">昵称</label>
            <input
              id="nickname"
              className="editable-input"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="输入新的昵称"
            />
          </div>

          <div className="form-field">
            <label htmlFor="old-password">旧密码</label>
            <div className={isAutoRegistered ? 'readonly-input-wrapper' : undefined}>
              <input
                id="old-password"
                className={isAutoRegistered ? 'readonly-input' : 'editable-input'}
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="输入旧密码"
                autoComplete="current-password"
                readOnly={isAutoRegistered}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="new-password">新密码</label>
            <input
              id="new-password"
              className="editable-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入新密码"
              autoComplete="new-password"
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">重复新密码</label>
            <input
              id="confirm-password"
              className="editable-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
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

function formatTimestamp(value: number | null): string {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
