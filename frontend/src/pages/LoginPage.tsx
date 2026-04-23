import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { login } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login: setToken } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await login({ username: username.trim(), password })
      setToken(data.access_token, data.username, data.nickname)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="panel auth-panel">
        <div className="auth-header">
          <p className="eyebrow">Quarks</p>
          <h1>登录</h1>
          <p className="subtitle">已有账号？立即登录。</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error ? <div className="error">{error}</div> : null}

          <div className="form-field">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="auth-footer">
          还没有账号？<Link to="/register">注册</Link>
        </p>
      </section>
    </main>
  )
}
