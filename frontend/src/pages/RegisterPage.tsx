import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { register } from '../api/authApi'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
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
      const data = await register({ username: username.trim(), password })
      setToken(data.access_token, username.trim())
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="panel auth-panel">
        <div className="auth-header">
          <p className="eyebrow">Quarks</p>
          <h1>注册</h1>
          <p className="subtitle">创建新账号开始使用。</p>
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="auth-footer">
          已有账号？<Link to="/login">登录</Link>
        </p>
      </section>
    </main>
  )
}
